// server/models/HouseholdMember.js
const mongoose = require("mongoose");

const HouseholdMemberSchema = new mongoose.Schema(
  {  flat_no: {  type: String,
      required: [true, "Số căn hộ là bắt buộc"],
      uppercase: true, trim: true, index: true, },
    full_name: { type: String,
      required: [true, "Họ tên thành viên là bắt buộc"],
      trim: true, maxlength: 100, },
    relationship: {  type: String,
      enum: ["head", "spouse", "child", "parent", "other"],
      required: [true, "Vai trò trong gia đình là bắt buộc"], },
    gender: { type: String,
      enum: ["male", "female", "other"],  default: "other",  },
    date_of_birth: {  type: Date, default: null,  },
    id_card_number: {  type: String,  trim: true,
      default: null, sparse: true, },
    phone: {  type: String,  trim: true,   default: null, },
    is_head: {  type: Boolean,  default: false, },
    move_in_date: {  type: Date,  default: Date.now, },
    is_active: {  type: Boolean,  default: true, },
    note: {  type: String,  default: null,  }, },
  {
    timestamps: true,
  },
);

// Đảm bảo mỗi căn hộ chỉ có một chủ hộ (is_head = true)
HouseholdMemberSchema.index(
  { flat_no: 1, is_head: 1 },
  {
    unique: true,
    partialFilterExpression: { is_head: true },
  },
);

// Index phục vụ tìm kiếm
HouseholdMemberSchema.index({ flat_no: 1, is_active: 1 });

module.exports = mongoose.model("HouseholdMember", HouseholdMemberSchema);
