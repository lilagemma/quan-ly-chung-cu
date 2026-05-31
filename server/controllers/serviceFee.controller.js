const ServiceFee = require("../models/ServiceFee");
const PaymentLog = require("../models/PaymentLog");
const User = require("../models/User");
const { client, paypal } = require("../config/paypal");

const isPrivileged = (user) => ["admin", "manager"].includes(user?.role);
const normalizeFlatNo = (flatNo) => String(flatNo || "").trim().toUpperCase();

const canAccessFee = (req, fee) => {
  if (isPrivileged(req.user)) return true;
  return (
    req.user?.role === "resident" &&
    normalizeFlatNo(req.user.flat_no) === normalizeFlatNo(fee.flat_no)
  );
};

const normalizeItems = (items = []) =>
  items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;

    return {
      ...item,
      quantity,
      unit_price: unitPrice,
      amount: quantity * unitPrice,
    };
  });

const createPaymentLog = async ({ fee, transactionId, method, orderId }) => {
  const existing = await PaymentLog.findOne({ transaction_id: transactionId });
  if (existing) return existing;

  return PaymentLog.create({
    user_id: fee.user_id,
    flat_no: fee.flat_no,
    amount: fee.total_amount,
    payment_date: new Date(),
    transaction_id: transactionId,
    month: fee.month,
    year: fee.year,
    service_fee_id: fee._id,
    payment_type: "service_fee",
    payment_method: method,
    paypal_order_id: method === "paypal" ? orderId : undefined,
    paypal_capture_id: method === "paypal" ? transactionId : undefined,
  });
};

const createServiceFee = async (req, res) => {
  try {
    let { user_id, flat_no, month, year, items, due_date, note } = req.body;
    flat_no = normalizeFlatNo(flat_no);

    if (!user_id || user_id === "undefined" || user_id === "null") {
      const user = await User.findOne({ flat_no, role: "resident" });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: `Khong tim thay cu dan cho can ho ${flat_no}`,
        });
      }
      user_id = user._id;
    }

    const normalizedItems = normalizeItems(items);

    if (!flat_no || !month || !year || !due_date || !normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap day du thong tin hoa don",
      });
    }

    const existed = await ServiceFee.findOne({
      flat_no,
      month: Number(month),
      year: Number(year),
    });

    if (existed) {
      return res.status(409).json({
        success: false,
        message: `Can ho ${flat_no} da co hoa don thang ${month}/${year}`,
      });
    }

    const serviceFee = new ServiceFee({
      user_id,
      flat_no,
      month: Number(month),
      year: Number(year),
      items: normalizedItems,
      total_amount: normalizedItems.reduce((sum, item) => sum + item.amount, 0),
      due_date: new Date(due_date),
      note: note || "",
    });

    await serviceFee.save();
    res.status(201).json({ success: true, data: serviceFee });
  } catch (error) {
    console.error("Loi tao hoa don:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllServiceFees = async (req, res) => {
  try {
    const filter = {};
    if (req.query.flat_no) filter.flat_no = normalizeFlatNo(req.query.flat_no);

    const fees = await ServiceFee.find(filter).sort({
      year: -1,
      month: -1,
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceFees = async (req, res) => {
  try {
    const flat_no = normalizeFlatNo(req.params.flat_no);

    if (!isPrivileged(req.user) && normalizeFlatNo(req.user.flat_no) !== flat_no) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen xem hoa don cua can ho nay",
      });
    }

    const fees = await ServiceFee.find({ flat_no }).sort({
      year: -1,
      month: -1,
    });

    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServiceFeeById = async (req, res) => {
  try {
    const fee = await ServiceFee.findById(req.params.id);
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Khong tim thay hoa don" });
    }

    if (!canAccessFee(req, fee)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen xem hoa don nay",
      });
    }

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateServiceFee = async (req, res) => {
  try {
    const { flat_no, month, year, items, due_date, note } = req.body;
    const normalizedFlatNo = normalizeFlatNo(flat_no);
    const normalizedItems = normalizeItems(items);
    const resident = await User.findOne({
      flat_no: normalizedFlatNo,
      role: "resident",
    });

    const updateData = {
      flat_no: normalizedFlatNo,
      month: Number(month),
      year: Number(year),
      items: normalizedItems,
      total_amount: normalizedItems.reduce((sum, item) => sum + item.amount, 0),
      due_date: new Date(due_date),
      note: note || "",
    };

    if (resident) updateData.user_id = resident._id;

    const fee = await ServiceFee.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Khong tim thay hoa don" });
    }

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const { note } = req.body;
    const fee = await ServiceFee.findById(req.params.id);

    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Khong tim thay hoa don" });
    }

    if (!canAccessFee(req, fee)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen thanh toan hoa don nay",
      });
    }

    if (!isPrivileged(req.user)) {
      return res.status(400).json({
        success: false,
        message: "Cu dan vui long thanh toan qua PayPal",
      });
    }

    fee.status = "paid";
    fee.paid_date = new Date();
    if (note) fee.note = note;
    await fee.save();

    await createPaymentLog({
      fee,
      transactionId: `manual-${fee._id}-${Date.now()}`,
      method: "manual",
    });

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPaypalOrder = async (req, res) => {
  try {
    const fee = await ServiceFee.findById(req.params.id);
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Khong tim thay hoa don" });
    }

    if (!canAccessFee(req, fee)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen thanh toan hoa don nay",
      });
    }

    if (fee.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Hoa don da duoc thanh toan" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: fee._id.toString(),
          amount: {
            currency_code: "USD",
            value: Number(fee.total_amount).toFixed(2),
          },
          description: `Service fee ${fee.flat_no} ${fee.month}/${fee.year}`,
        },
      ],
      application_context: {
        brand_name: "Rajarshi Darshan Society",
        user_action: "PAY_NOW",
      },
    });

    const order = await client().execute(request);
    fee.paypal_order_id = order.result.id;
    await fee.save();

    res.status(200).json({
      success: true,
      data: {
        order_id: order.result.id,
        amount: fee.total_amount,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("Loi tao PayPal order cho hoa don:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const capturePaypalPayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing PayPal order ID" });
    }

    const fee = await ServiceFee.findById(req.params.id);
    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Khong tim thay hoa don" });
    }

    if (!canAccessFee(req, fee)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen thanh toan hoa don nay",
      });
    }

    if (fee.status === "paid") {
      return res.status(200).json({ success: true, data: fee });
    }

    if (fee.paypal_order_id && fee.paypal_order_id !== order_id) {
      return res
        .status(400)
        .json({ success: false, message: "PayPal order khong khop hoa don" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(order_id);
    request.requestBody({});
    const capture = await client().execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }

    const transactionId =
      capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      order_id;

    fee.status = "paid";
    fee.paid_date = new Date();
    fee.paypal_order_id = order_id;
    fee.paypal_capture_id = transactionId;
    await fee.save();

    await createPaymentLog({
      fee,
      transactionId,
      method: "paypal",
      orderId: order_id,
    });

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    console.error("Loi capture PayPal hoa don:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllFlatNos = async (req, res) => {
  try {
    const { month, year } = req.query;
    const users = await User.find({
      role: "resident",
      flat_no: { $exists: true, $ne: null },
    })
      .select("flat_no")
      .sort({ flat_no: 1 });

    let flatNos = users
      .map((user) => normalizeFlatNo(user.flat_no))
      .filter(Boolean);

    if (month && year) {
      const billed = await ServiceFee.find({
        month: Number(month),
        year: Number(year),
        flat_no: { $in: flatNos },
      }).distinct("flat_no");
      const billedSet = new Set(billed.map(normalizeFlatNo));
      flatNos = flatNos.filter((flatNo) => !billedSet.has(flatNo));
    }

    res.status(200).json({ success: true, data: flatNos });
  } catch (error) {
    console.error("Loi lay danh sach can ho:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createServiceFee,
  getAllServiceFees,
  getServiceFees,
  getServiceFeeById,
  updateServiceFee,
  markAsPaid,
  createPaypalOrder,
  capturePaypalPayment,
  getAllFlatNos,
};
