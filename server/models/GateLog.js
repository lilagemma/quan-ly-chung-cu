const mongoose = require('mongoose');

const GateLogSchema = new mongoose.Schema(
  {
    visitor_name: {
      type: String,
      required: [true, "Tên khách là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên khách không được vượt quá 100 ký tự"],
    },
    flat_no_visiting: {
      type: String,
      required: [true, "Số căn hộ là bắt buộc"],
    },
    purpose: {
      type: String,
      required: [true, "Mục đích là bắt buộc"],
      trim: true,
      maxlength: [200, "Mục đích không được vượt quá 200 ký tự"],
    },
    vehicle_number: {
      type: String,
      trim: true,
      maxlength: [20, "Biển số xe không được vượt quá 20 ký tự"],
      default: null,
    },
    in_time: {
      type: Date,
      default: Date.now,
    },
    out_time: {
      type: Date,
      default: null,
    },
    logged_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for today's logs query
GateLogSchema.index({ in_time: -1 });
GateLogSchema.index({ logged_by: 1 });

module.exports = mongoose.model('GateLog', GateLogSchema);
