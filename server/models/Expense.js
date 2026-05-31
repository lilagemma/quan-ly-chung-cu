const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "dien_nuoc",
        "bao_tri",
        "luong_nhan_vien",
        "thue",
        "van_phong_pham",
        "tiec_hoi",
        "khac",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    expense_date: { type: Date, required: true, default: Date.now },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020 },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    payee: { type: String, trim: true },
    receipt_number: { type: String, unique: true, sparse: true },
    note: String,
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

ExpenseSchema.index({ month: 1, year: 1 });
ExpenseSchema.index({ category: 1, status: 1 });
ExpenseSchema.index({ expense_date: -1 });

module.exports = mongoose.model("Expense", ExpenseSchema);
