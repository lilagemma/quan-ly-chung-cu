const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createServiceFee,
  getAllServiceFees,
  getServiceFees,
  getServiceFeeById,
  updateServiceFee,
  markAsPaid,
  createPaypalOrder,
  capturePaypalPayment,
  getAllFlatNos,
} = require("../controllers/serviceFee.controller");

router.get(
  "/flatnos",
  authenticate,
  authorize("admin", "manager"),
  getAllFlatNos,
);

router.get(
  "/all",
  authenticate,
  authorize("admin", "manager"),
  getAllServiceFees,
);

router.get("/bill/:id", authenticate, getServiceFeeById);

router.post("/", authenticate, authorize("admin", "manager"), createServiceFee);

router.put(
  "/:id/pay",
  authenticate,
  authorize("admin", "manager", "resident"),
  markAsPaid,
);

router.post(
  "/:id/paypal/create-order",
  authenticate,
  authorize("resident"),
  createPaypalOrder,
);

router.post(
  "/:id/paypal/capture",
  authenticate,
  authorize("resident"),
  capturePaypalPayment,
);

router.put("/:id", authenticate, authorize("admin", "manager"), updateServiceFee);

router.get("/:flat_no", authenticate, getServiceFees);

module.exports = router;
