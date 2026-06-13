const Asset = require('../models/Asset');

/**
 * @desc    Get all assets
 * @route   GET /api/assets
 * @access  Private (All authenticated users)
 */
exports.getAllAssets = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    
    // Build query
    const query = {};
    if (status && ['working', 'under_maintenance', 'not_working'].includes(status)) {
      query.status = status;
    }
    if (type && ['lift', 'water_pump', 'generator'].includes(type)) {
      query.type = type;
    }

    const assets = await Asset.find(query)
      .sort({ type: 1, name: 1 });

    // Calculate stats
    const stats = {
      total: assets.length,
      working: assets.filter(a => a.status === 'working').length,
      under_maintenance: assets.filter(a => a.status === 'under_maintenance').length,
      not_working: assets.filter(a => a.status === 'not_working').length
    };

    res.status(200).json({
      success: true,
      data: assets,
      stats
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    next(error);
  }
};

/**
 * @desc    Get single asset by ID
 * @route   GET /api/assets/:id
 * @access  Private (All authenticated users)
 */
exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài sản",
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    next(error);
  }
};

/**
 * @desc    Create a new asset
 * @route   POST /api/assets
 * @access  Private (Manager only)
 */
exports.createAsset = async (req, res, next) => {
  try {
    const { name, type, status, location } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Tên và loại tài sản là bắt buộc'
      });
    }

    // Validate type
    if (!['lift', 'water_pump', 'generator'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại tài sản không hợp lệ...",
      });
    }

    // Check if asset with same name and type already exists
    const existingAsset = await Asset.findOne({ 
      name: name.trim(),
      type: type
    });

    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: "Tài sản với tên và loại này đã tồn tại",
      });
    }

    // Create asset
    const asset = await Asset.create({
      name: name.trim(),
      type,
      status: status || 'working',
      location: location || null,
      services: []
    });

    res.status(201).json({
      success: true,
      message: "Tạo tài sản thành công",
      data: asset,
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    next(error);
  }
};

/**
 * @desc    Update asset details
 * @route   PUT /api/assets/:id
 * @access  Private (Manager only)
 */
exports.updateAsset = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Update fields
    if (name) asset.name = name.trim();
    if (location !== undefined) asset.location = location;

    await asset.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật tài sản thành công",
      data: asset,
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    next(error);
  }
};

/**
 * @desc    Update asset status
 * @route   PUT /api/assets/:id/status
 * @access  Private (Manager, Admin)
 */
exports.updateAssetStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status
    if (
      !status ||
      !["working", "under_maintenance", "not_working"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ...",
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const oldStatus = asset.status; // ← khai báo oldStatus
    asset.status = status;
    await asset.save();

    res.status(200).json({
      success: true,
      message: `Trạng thái tài sản đã được cập nhật từ "${oldStatus}" thành "${status}"`, // ← sửa message
      data: asset,
    });
  } catch (error) {
    console.error("Error updating asset status:", error);
    next(error);
  }
};

/**
 * @desc    Add service entry to asset
 * @route   POST /api/assets/:id/service
 * @access  Private (Manager only)
 */
exports.logServiceEntry = async (req, res, next) => {
  try {
    const { description, done_by, date } = req.body;

    // Validate required fields
    if (!description || !done_by) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả và tên kỹ thuật viên là bắt buộc'
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Add service entry
    const serviceEntry = {
      date: date ? new Date(date) : new Date(),
      description: description.trim(),
      done_by: done_by.trim()
    };

    asset.services.push(serviceEntry);
    
    // last_service_date is automatically updated via pre-save hook in model
    await asset.save();

    res.status(201).json({
      success: true,
      message:'Thêm bản ghi bảo trì thành công',
      data: asset
    });
  } catch (error) {
    console.error('Error adding service entry:', error);
    next(error);
  }
};

/**
 * @desc    Delete an asset
 * @route   DELETE /api/assets/:id
 * @access  Private (Manager only)
 */
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa tài sản thành công",
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    next(error);
  }
};
