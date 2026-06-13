const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      trim: true,
      maxlength: [100, "Họ tên không được vượt quá 100 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Vui lòng nhập email hợp lệ"],
    },
    // phone: {
    //   type: String,
    //   required: [true, 'Phone number is required'],
    //   match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
    // },
    phone: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      match: [/^(03|05|07|08|09)\d{8}$/, "Vui lòng nhập số điện thoại hợp lệ"],
    },
    flat_no: {
      type: String,
      required: function () {
        return this.role !== "watchman";
      },
      match: [/^[1-9]\d{2}$/, "Vui lòng nhập số căn hộ hợp lệ"],
    },
    role: {
      type: String,
      enum: ["manager", "admin", "resident", "watchman"],
      default: "resident",
    },
    password_hash: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_verified: {
      type: Boolean,
      default: true, // Auto-verified for now
    },
    fcmToken: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otp_expires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// Indexes
UserSchema.index({ flat_no: 1 });
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password_hash')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.otp;
  delete obj.otp_expires;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
