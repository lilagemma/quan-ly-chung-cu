const Expense = require("../models/Expense");
const User = require("../models/User");

const createExpense = async (req, res) => {
  try {
    const { title, category, description, amount, date, paymentMethod, vendor, receiptRef, status } = req.body;
    const createdBy = req.user._id;

    if (!title || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đủ thông tin: tiêu đề, danh mục, số tiền",
      });
    }

    const expense = new Expense({
      title,
      category,
      description,
      amount: Number(amount),
      date: date ? new Date(date) : undefined,
      paymentMethod,
      vendor,
      receiptRef,
      status,
      createdBy,
    });

    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error("Lỗi tạo chi phí:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const { month, year, category, status, minAmount, maxAmount } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minAmount) filter.amount = { ...filter.amount, $gte: Number(minAmount) };
    if (maxAmount) filter.amount = { ...filter.amount, $lte: Number(maxAmount) };

    let query = Expense.find(filter);

    if (month || year) {
      const startMonth = month ? Number(month) - 1 : 0;
      const endMonth = month ? Number(month) : 11;
      const startDate = year ? new Date(Number(year), startMonth, 1) : new Date(0, startMonth, 1);
      const endDate = year ? new Date(Number(year), endMonth + 1, 0) : new Date(11, endMonth + 1, 0);
      query = query.where("date").gte(startDate).lte(endDate);
    }

    const expenses = await query.sort({ date: -1 }).populate("createdBy", "name email flat_no");
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate("createdBy", "name email flat_no");
    if (!expense) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khoản chi" });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!expense) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khoản chi" });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khoản chi" });
    }
    res.status(200).json({ success: true, message: "Đã xóa khoản chi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExpenseStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const categoryStats = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalExpense,
        categoryStats,
        count: expenses.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thống kê chi phí theo tháng trong năm
const getMonthlyExpenseStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    expenses.forEach((exp) => {
      const monthIndex = new Date(exp.date).getMonth();
      monthlyData[monthIndex].total += exp.amount;
      monthlyData[monthIndex].count += 1;
    });

    // Category breakdown for the year
    const categoryStats = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    // Total for year
    const totalYear = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        monthlyData,
        categoryStats,
        totalYear,
        totalCount: expenses.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Theo dõi công nợ cư dân
const getResidentDebtStats = async (req, res) => {
  try {
    const ServiceFee = require("../models/ServiceFee");
    const User = require("../models/User");

    const { month, year } = req.query;
    const filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    filter.status = { $in: ["pending", "overdue"] };

    const unpaidFees = await ServiceFee.find(filter)
      .sort({ due_date: 1 })
      .populate("user_id", "name email flat_no");

    // Group by flat
    const debtByFlat = {};
    unpaidFees.forEach((fee) => {
      const flatNo = fee.flat_no;
      if (!debtByFlat[flatNo]) {
        debtByFlat[flatNo] = {
          flat_no: flatNo,
          ownerName: fee.user_id?.name || "—",
          totalDebt: 0,
          monthsOwed: 0,
          fees: [],
          earliestDue: fee.due_date,
          latestDue: fee.due_date,
        };
      }
      debtByFlat[flatNo].totalDebt += fee.total_amount;
      debtByFlat[flatNo].monthsOwed += 1;
      debtByFlat[flatNo].fees.push({
        _id: fee._id,
        month: fee.month,
        year: fee.year,
        amount: fee.total_amount,
        due_date: fee.due_date,
        status: fee.status,
      });
      if (new Date(fee.due_date) < new Date(debtByFlat[flatNo].earliestDue)) {
        debtByFlat[flatNo].earliestDue = fee.due_date;
      }
      if (new Date(fee.due_date) > new Date(debtByFlat[flatNo].latestDue)) {
        debtByFlat[flatNo].latestDue = fee.due_date;
      }
    });

    const debtList = Object.values(debtByFlat).sort((a, b) => b.totalDebt - a.totalDebt);
    const totalDebt = debtList.reduce((sum, d) => sum + d.totalDebt, 0);

    // Payment history for each flat
    const PaymentLog = require("../models/PaymentLog");
    const paymentHistory = await PaymentLog.find()
      .sort({ payment_date: -1 })
      .limit(50)
      .populate("user_id", "name flat_no");

    res.status(200).json({
      success: true,
      data: {
        debtList,
        totalDebt,
        totalUnpaidCount: unpaidFees.length,
        paymentHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tổng thu theo tháng (từ ServiceFee đã thanh toán)
const getMonthlyIncomeStats = async (req, res) => {
  try {
    const ServiceFee = require("../models/ServiceFee");
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const paidFees = await ServiceFee.find({
      status: "paid",
      paid_date: { $gte: startDate, $lte: endDate },
    });

    const monthlyIncome = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    paidFees.forEach((fee) => {
      if (fee.paid_date) {
        const monthIndex = new Date(fee.paid_date).getMonth();
        monthlyIncome[monthIndex].total += fee.total_amount;
        monthlyIncome[monthIndex].count += 1;
      }
    });

    const totalIncome = paidFees.reduce((sum, fee) => sum + fee.total_amount, 0);

    res.status(200).json({
      success: true,
      data: {
        year: currentYear,
        monthlyIncome,
        totalIncome,
        totalCount: paidFees.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlyExpenseStats,
  getResidentDebtStats,
  getMonthlyIncomeStats,
};