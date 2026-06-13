// server/routes/residentRoutes.js
const express = require("express");
const router = express.Router();
const {
  getApartmentsList,
  getApartmentDetail,
  addMember,
  updateMember,
  deleteMember,
  getResidentStatistics, // thêm dòng này
  getDetailedStatistics,
  getOccupiedFlats,
} = require("../controllers/residentController");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// Danh sách căn hộ và chi tiết (resident cũng có thể xem căn hộ của mình)
router.get("/apartments", getApartmentsList);
router.get("/apartments/:flatNo", getApartmentDetail);

// Các route quản lý thành viên - chỉ admin/manager
router.post("/members", authorize("admin", "manager"), addMember);
router.put("/members/:id", authorize("admin", "manager"), updateMember);
router.delete("/members/:id", authorize("admin", "manager"), deleteMember);
router.get(
  "/statistics",
  authenticate,
  authorize("admin", "manager"),
  getResidentStatistics,
);
router.get(
  "/detailed-statistics",
  authenticate,
  authorize("admin", "manager"),
  getDetailedStatistics,
);
router.get(
  "/occupied-flats",
  authenticate,
  authorize("admin", "manager"),
  getOccupiedFlats,
);


module.exports = router;
