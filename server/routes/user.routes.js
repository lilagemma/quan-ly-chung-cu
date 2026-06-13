const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users (Manager, Admin)
router.get('/', authorize('manager', 'admin'), userController.getAllUsers);

// GET /api/users/flats/available - Get unregistered flats
router.get('/flats/available', userController.getAvailableFlats);

// GET /api/users/:id - Get user by ID (Manager, Admin)
router.get('/:id', authorize('manager', 'admin'), userController.getUserById);

// PUT /api/users/:id/role - Update user role (Manager only)
router.put('/:id/role', authorize('manager'), userController.updateUserRole);

// POST /api/users/watchman - Create watchman account (Manager only)
router.post('/watchman', authorize('manager'), userController.createWatchman);

// DELETE /api/users/:id - Deactivate user (Manager only)
router.delete('/:id', authorize('manager'), userController.deleteUser);


// PUT /api/users/fcm-token
// router.put('/fcm-token', async (req, res) => {

//   try {

//     const User = require('../models/User');


//     const { token } = req.body;


//     if (!token) {

//       return res.status(400).json({
//         message: "FCM token is required"
//       });

//     }


//     await User.findByIdAndUpdate(

//       req.user.id,

//       {
//         fcmToken: token
//       }

//     );


//     res.json({

//       success: true,

//       message: "Save FCM token successfully"

//     });


//   } catch (error) {


//     res.status(500).json({

//       message: error.message

//     });


//   }

// });


router.put("/fcm-token", userController.saveFcmToken);

module.exports = router;
