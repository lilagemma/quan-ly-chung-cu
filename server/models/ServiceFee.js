// server/models/ServiceFee.js
const mongoose = require("mongoose");

const ServiceFeeSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    flat_no: { type: String, required: true,
      uppercase: true,  trim: true,
    },
    month: { type: Number, required: true,
      min: 1, max: 12,
    },
    year: { type: Number, required: true,
      min: 2020, max: 2030,
    },
    bill_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },
    items: [
      {
        type: {
          type: String,
          enum: [
            "dien", 
            "nuoc",
            "xe_o_to",
            "xe_may",
            "xe_dap",
            "xe_dap_dien",
            "quan_ly_van_hanh",
            "phat_qua_han", 
            "phi_bao_tri",
            "other",
          ],
          required: true,
        },
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit_price: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    total_amount: { type: Number, required: true, min: 0,
    },
    status: { type: String,  enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    paid_date: Date,
    paypal_order_id: {
      type: String,
      default: null,
    },
    paypal_capture_id: {
      type: String,
      default: null,
    },
    note: String,
  },
  {
    timestamps: true,
  },
);

// ====================== INDEX ======================
ServiceFeeSchema.index({ flat_no: 1, month: 1, year: 1 }, { unique: true });
ServiceFeeSchema.index({ user_id: 1, status: 1 });
ServiceFeeSchema.index({ status: 1, due_date: 1 }); // Hỗ trợ query quá hạn
ServiceFeeSchema.index({ flat_no: 1 });

// ====================== MIDDLEWARE ======================
// Tự động tính total_amount trước khi lưu (an toàn hơn)
ServiceFeeSchema.pre("save", function () {
  if (this.items && this.items.length > 0) {
    this.total_amount = this.items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );
  }
});

module.exports = mongoose.model("ServiceFee", ServiceFeeSchema);
