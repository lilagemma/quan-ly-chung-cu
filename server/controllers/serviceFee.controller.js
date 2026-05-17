// server/controllers/serviceFee.controller.js
const ServiceFee = require("../models/ServiceFee");
const User = require("../models/User");


const createServiceFee = async (req, res) => {
  try {
    let { user_id, flat_no, month, year, items, due_date, note } = req.body;

    // Nếu không có user_id hoặc user_id không hợp lệ, tìm user theo flat_no
    if (!user_id || user_id === "undefined" || user_id === "null") {
      const user = await User.findOne({ flat_no });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy cư dân cho căn hộ ${flat_no}`,
        });
      }
      user_id = user._id;
    }

    // Tính tổng tiền từ các items (đảm bảo)
    const total_amount = items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );

    const serviceFee = new ServiceFee({
      user_id,
      flat_no,
      month: Number(month),
      year: Number(year),
      items: items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        amount: Number(item.quantity) * Number(item.unit_price),
      })),
      total_amount,
      due_date: new Date(due_date),
      note: note || "",
    });

    await serviceFee.save();
    res.status(201).json({ success: true, data: serviceFee });
  } catch (error) {
    console.error("Lỗi tạo hóa đơn:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ... giữ nguyên các hàm khác (getServiceFees, getServiceFeeById, markAsPaid)
// Lấy tất cả hóa đơn của một căn hộ / user
const getServiceFees = async (req, res) => {
  try {
    const { flat_no } = req.params;
    const fees = await ServiceFee.find({ flat_no }).sort({
      year: -1,
      month: -1,
    });
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết 1 hóa đơn
const getServiceFeeById = async (req, res) => {
  try {
    const fee = await ServiceFee.findById(req.params.id);
    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn" });
    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin xác nhận đã thanh toán (chuyển khoản)
const markAsPaid = async (req, res) => {
  try {
    const { payment_id, note } = req.body;
    const fee = await ServiceFee.findById(req.params.id);

    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy" });

    fee.status = "paid";
    fee.paid_date = Date.now();
    fee.note = note || fee.note;
    await fee.save();

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách tất cả flat_no của cư dân (chỉ admin/manager dùng)
const getAllFlatNos = async (req, res) => {
  try {
    // Lọc những user có role là 'resident' (cư dân) và có flat_no
    const users = await User.find({ role: 'resident', flat_no: { $exists: true, $ne: null } })
      .select('flat_no');
    const flatNos = users.map(u => u.flat_no).filter(flat => flat && flat !== '');
    res.status(200).json({ success: true, data: flatNos });
  } catch (error) {
    console.error("Lỗi lấy danh sách căn hộ:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createServiceFee,
  getServiceFees,
  getServiceFeeById,
  markAsPaid,
  getAllFlatNos,
};
