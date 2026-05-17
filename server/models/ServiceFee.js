// server/models/ServiceFee.js
const mongoose = require("mongoose");

const ServiceFeeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flat_no: {
      type: String,
      required: true,
    },

    // Thông tin hóa đơn
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    bill_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },

    // Các khoản phí (linh hoạt như trong ảnh)
    items: [
      {
        type: {
          type: String,
          enum: [
            "nuoc",
            "xe_o_to",
            "xe_may",
            "xe_dap_dien",
            "quan_ly_van_hanh",
            "other",
          ],
          required: true,
        },
        description: String,
        quantity: Number,
        unit_price: Number,
        amount: Number,
      },
    ],

    total_amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },

    razorpay_order_id: String,
    razorpay_payment_id: String,
    paid_date: Date,

    note: String, // Ghi chú như trong bill
  },
  {
    timestamps: true,
  },
);

// Index
ServiceFeeSchema.index({ flat_no: 1, month: 1, year: 1 }, { unique: true });
ServiceFeeSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model("ServiceFee", ServiceFeeSchema);
