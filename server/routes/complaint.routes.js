const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer = require("multer");

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/complaints/'); // Đảm bảo folder này tồn tại
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file hình ảnh!'), false);
    }
  }
});

// All routes require authentication
router.use(authenticate);

router.get("/statistics", complaintController.getComplaintStatistics);

router.get("/statistics/:id", complaintController.getComplaintStatisticsById);

// POST /api/complaints - Create new complaint
router.post('/', complaintController.createComplaint);

// GET /api/complaints - Get user's complaints
router.get('/', complaintController.getUserComplaints);

// GET /api/complaints/all - Get all complaints (Manager, Admin)
router.get('/all', authorize('manager', 'admin'), complaintController.getAllComplaints);

// GET /api/complaints/:id - Get complaint details
router.get('/:id', complaintController.getComplaintById);

// PUT /api/complaints/:id/status - Update complaint status (Manager, Admin)
router.put('/:id/status', authorize('manager', 'admin'), complaintController.updateComplaintStatus);

// POST /api/complaints/upload-url - Get ImageKit upload URL
router.post('/upload-url', complaintController.getUploadUrl);

// Sửa khiếu nại (User) - PHẢI CÓ upload.single('image')
router.put('/:id', upload.single('image'), complaintController.updateComplaint);

// Xóa khiếu nại (User)
router.delete('/:id', complaintController.deleteComplaint);

module.exports = router;
