const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const emailService = require('../services/email.service');
const HouseholdMember = require("../models/HouseholdMember");

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper: Set JWT Cookie
// const setTokenCookie = (res, token) => {
//   const isProduction = process.env.NODE_ENV === 'production';
//   const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction, // Must be true for sameSite: 'none'
//     sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin cookies
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     path: '/'
//   };
//   res.cookie('token', token, cookieOptions);
// };

// Cập nhật hàm setTokenCookie trong auth.controller.js
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  // Quan trọng: Với ngrok, bạn đang ở môi trường "production" ảo, cần cookie secure và sameSite none
  // Ép buộc các thiết lập an toàn để hoạt động trên ngrok
  const cookieOptions = {
    httpOnly: true,
    secure: true,             // BẮT BUỘC với sameSite 'none'
    sameSite: 'none',         // BẮT BUỘC để cookie hoạt động cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
  res.cookie('token', token, cookieOptions);
};


// Helper: Validate flat number format (101-410)
const isValidFlatNo = (flatNo) => {
  const floor = parseInt(flatNo.charAt(0));
  const unit = parseInt(flatNo.substring(1));
  return floor >= 1 && floor <= 4 && unit >= 1 && unit <= 10;
};

/**
 * @desc    Register new resident
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, flat_no, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !flat_no || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ: họ tên, email, mật khẩu, số căn hộ, số điện thoại",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Validate flat number format
    if (!isValidFlatNo(flat_no)) {
      return res.status(400).json({
        success: false,
        message: "Số căn hộ không hợp lệ",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email đã được đăng ký",
      });
    }

    // Check if flat is already registered
    const existingFlat = await User.findOne({ flat_no });
    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: "Căn hộ này đã được đăng ký",
      });
    }

    // Check if manager exists (residents can only register after manager)
    const managerExists = await User.findOne({ role: "manager" });
    if (!managerExists) {
      return res.status(400).json({
        success: false,
        message:
          "Quản lý phải được đăng ký trước. Vui lòng liên hệ ban quản lý chung cư.",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password, // Will be hashed by pre-save hook
      flat_no,
      phone,
      role: "resident",
    });
    // Tạo bản ghi HouseholdMember cho chủ hộ mới
    try {
      await HouseholdMember.create({
        flat_no: user.flat_no,
        full_name: user.name,
        relationship: "head",
        is_head: true,
        phone: user.phone,
        move_in_date: new Date(),
        is_active: true,
        user_id: user._id,
        note: "Chủ hộ đăng ký qua form",
      });
    } catch (err) {
      console.error("Lỗi khi tạo HouseholdMember:", err);
      // Không nên throw lỗi vì user đã tạo thành công, nhưng có thể log lại.
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp email và mật khẩu",
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message:
          "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản lý.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: user.toJSON(),
        token,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res, next) => {
  try {
    // res.cookie('token', '', {
    //   httpOnly: true,
    //   expires: new Date(0)
    // });
    res.cookie("token", "", {
      httpOnly: true,

      secure: true,

      sameSite: "none",

      expires: new Date(0),

      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached by auth middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: { user: user.toJSON() }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    One-time manager setup (first user)
 * @route   POST /api/auth/manager-setup
 * @access  Public
 */
exports.managerSetup = async (req, res, next) => {
  try {
    const { name, email, password, flat_no, phone } = req.body;

    // Check if manager already exists
    const managerExists = await User.findOne({ role: 'manager' });
    if (managerExists) {
      return res.status(400).json({
        success: false,
        message: "Quản lý đã được đăng ký. Đây là thiết lập một lần duy nhất.",
      });
    }

    // Validate required fields
    if (!name || !email || !password || !flat_no || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ: họ tên, email, mật khẩu, số căn hộ, số điện thoại",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Validate flat number
    if (!isValidFlatNo(flat_no)) {
      return res.status(400).json({
        success: false,
        message: "Số căn hộ không hợp lệ.",
      });
    }

    // Create manager
    const manager = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password,
      flat_no,
      phone,
      role: 'manager'
    });

    // Generate token
    const token = generateToken(manager._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Thiết lập quản lý thành công. Chào mừng!',
      data: {
        user: manager.toJSON(),
        token
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }
    next(error);
  }
};

/**
 * @desc    Check if manager exists
 * @route   GET /api/auth/manager-exists
 * @access  Public
 */
exports.checkManagerExists = async (req, res, next) => {
  try {
    const managerExists = await User.findOne({ role: 'manager' });
    
    res.status(200).json({
      success: true,
      data: { exists: !!managerExists }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ email của bạn",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với địa chỉ email này",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản này đã bị vô hiệu hóa",
      });
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP to user document
    user.otp = otp;
    user.otp_expires = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP({
        email: user.email,
        name: user.name,
        otp: otp,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
      });
    } catch (emailError) {
      // Clear OTP if email fails
      user.otp = null;
      user.otp_expires = null;
      await user.save({ validateBeforeSave: false });

      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: "Gửi email OTP thất bại. Vui lòng thử lại sau.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
      data: {
        email: user.email,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp email và mã OTP",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với địa chỉ email này",
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otp_expires) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy yêu cầu OTP. Vui lòng yêu cầu mã OTP mới.",
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expires)) {
      // Clear expired OTP
      user.otp = null;
      user.otp_expires = null;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không chính xác. Vui lòng kiểm tra và thử lại.",
      });
    }

    // OTP is valid - generate a temporary reset token
    const resetToken = jwt.sign(
      { user_id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Token valid for 15 minutes
    );

    res.status(200).json({
      success: true,
      message: "Xác minh OTP thành công",
      data: {
        resetToken,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with verified OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    console.log("body: ", req.body);
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin",
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message:
          "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
      });
    }

    // Check token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: "Token đặt lại không hợp lệ",
      });
    }

    // Find user by email and token user_id
    const user = await User.findOne({ 
      _id: decoded.user_id,
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password_hash = newPassword;
    user.otp = null;
    user.otp_expires = null;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation({
        email: user.email,
        name: user.name
      });
    } catch (emailError) {
      console.error('Failed to send password reset confirmation:', emailError);
      // Don't fail the request, password was already reset
    }

    res.status(200).json({
      success: true,
      message:
        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    });

  } catch (error) {
    next(error);
  }
};
