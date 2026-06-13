const mongoose = require('mongoose');

const PaymentLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flat_no: {
      type: String,
      required: [true, "Số căn hộ là bắt buộc"],
    },
    amount: {
      type: Number,
      required: [true, "Số tiền là bắt buộc"],
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    transaction_id: {
      type: String,
      required: [true, "Mã giao dịch là bắt buộc"],
    },
    month: {
      type: Number,
      required: [true, "Tháng là bắt buộc"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Năm là bắt buộc"],
    },
    service_fee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceFee",
      default: null,
    },
    payment_type: {
      type: String,
      enum: ["service_fee"],
      default: "service_fee",
    },
    payment_method: {
      type: String,
      enum: ["paypal", "manual"],
      default: "manual",
    },
    paypal_order_id: {
      type: String,
    },
    paypal_capture_id: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

PaymentLogSchema.index({ user_id: 1 });
PaymentLogSchema.index({ flat_no: 1 });
PaymentLogSchema.index({ payment_date: -1 });
PaymentLogSchema.index({ service_fee_id: 1 });
PaymentLogSchema.index({ transaction_id: 1 });

module.exports = mongoose.model('PaymentLog', PaymentLogSchema);
