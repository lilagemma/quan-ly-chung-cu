const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate user via JWT token in cookies or Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.token;
    
    // Check Authorization header if cookie not found
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Truy cập bị từ chối. Không tìm thấy token.",
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.user_id).select('-password_hash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa.",
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ.",
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn.",
      });
    }
    next(error);
  }
};

/**
 * Authorize user based on roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Yêu cầu xác thực.",
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Truy cập bị từ chối. Không đủ quyền hạn.",
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
