const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createServiceFee,
  getServiceFees,
  getServiceFeeById,
  markAsPaid,
  getAllFlatNos, // import mới
} = require("../controllers/serviceFee.controller");

// Route lấy danh sách tất cả flat_no (chỉ admin/manager)
router.get(
  "/flatnos",
  authenticate,
  authorize("admin", "manager"),
  getAllFlatNos,
);

// Tạo hóa đơn (admin/manager)
router.post("/", authenticate, authorize("admin", "manager"), createServiceFee);

// Lấy hóa đơn của một căn hộ (cư dân hoặc admin)
router.get("/:flat_no", authenticate, getServiceFees);

// Lấy chi tiết hóa đơn
router.get("/bill/:id", authenticate, getServiceFeeById);

// Xác nhận thanh toán (admin)
router.put("/:id/pay", authenticate, authorize("admin"), markAsPaid);

module.exports = router;
