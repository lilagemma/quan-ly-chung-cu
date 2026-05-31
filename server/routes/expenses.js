const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Expense = require("../models/Expense");

// 📋 Lấy danh sách chi phí (chỉ admin/manager)
router.get(
  "/",
  authenticate,
  authorize("admin", "manager"),
  async (req, res) => {
    try {
      const { month, year, category, status, minAmount, maxAmount, search } =
        req.query;
      let filter = {};

      if (month) filter.month = parseInt(month);
      if (year) filter.year = parseInt(year);
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { payee: { $regex: search, $options: "i" } },
          { note: { $regex: search, $options: "i" } },
        ];
      }

      const expenses = await Expense.find(filter)
        .populate("created_by", "name email")
        .sort({ expense_date: -1 });
      res.json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ➕ Tạo khoản chi mới
router.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  async (req, res) => {
    try {
      const expense = new Expense({ ...req.body, created_by: req.user._id });
      await expense.save();
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ✏️ Cập nhật khoản chi
router.put(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  async (req, res) => {
    try {
      const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!expense)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy chi phí" });
      res.json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// 🗑️ Xóa khoản chi
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  async (req, res) => {
    try {
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (!expense)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy chi phí" });
      res.json({ success: true, message: "Đã xóa" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
