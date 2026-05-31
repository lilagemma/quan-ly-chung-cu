const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const ServiceFee = require("../models/ServiceFee");
const Expense = require("../models/Expense");

router.get(
  "/financial-summary",
  authenticate,
  authorize("admin", "manager"),
  async (req, res) => {
    try {
      const { year } = req.query;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      // Thu từ phí dịch vụ
      const revenueAgg = await ServiceFee.aggregate([
        { $match: { year: targetYear } },
        {
          $group: {
            _id: "$month",
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$total_amount", 0],
              },
            },
            totalPending: {
              $sum: {
                $cond: [{ $ne: ["$status", "paid"] }, "$total_amount", 0],
              },
            },
          },
        },
      ]);

      // Chi từ Expense
      const expenseAgg = await Expense.aggregate([
        { $match: { year: targetYear, status: "completed" } },
        {
          $group: {
            _id: "$month",
            totalExpense: { $sum: "$amount" },
          },
        },
      ]);

      // Tổng hợp 12 tháng
      const monthlyData = [];
      for (let m = 1; m <= 12; m++) {
        const rev = revenueAgg.find((r) => r._id === m) || {
          totalPaid: 0,
          totalPending: 0,
        };
        const exp = expenseAgg.find((e) => e._id === m) || { totalExpense: 0 };
        monthlyData.push({
          month: m,
          revenue: rev.totalPaid,
          pendingRevenue: rev.totalPending,
          expense: exp.totalExpense,
          net: rev.totalPaid - exp.totalExpense,
        });
      }

      // Thống kê theo danh mục chi
      const expenseByCategory = await Expense.aggregate([
        { $match: { year: targetYear, status: "completed" } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          year: targetYear,
          monthlyData,
          expenseByCategory,
          totalRevenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
          totalExpense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
