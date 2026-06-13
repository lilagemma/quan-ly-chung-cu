// server/controllers/residentController.js
const HouseholdMember = require("../models/HouseholdMember");
const User = require("../models/User");

// @desc    Lấy danh sách tất cả căn hộ (flat_no duy nhất)
// @route   GET /api/residents/apartments
// @access  Private (Admin/Manager)
exports.getApartmentsList = async (req, res) => {
  try {
    // Lấy flat_no từ bảng HouseholdMember
    const members = await HouseholdMember.find({ is_active: true }).distinct(
      "flat_no",
    );
    // Nếu muốn bổ sung flat_no từ User (trường hợp có user nhưng chưa có thành viên)
    const users = await User.find({ flat_no: { $ne: null, $ne: "" } }).distinct(
      "flat_no",
    );
    const allFlats = [...new Set([...members, ...users])].sort();
    res.json({ success: true, data: allFlats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy chi tiết một căn hộ (danh sách thành viên)
// @route   GET /api/residents/apartments/:flatNo
// @access  Private (Admin/Manager hoặc chính cư dân của căn hộ đó)
exports.getApartmentDetail = async (req, res) => {
  try {
    const { flatNo } = req.params;
    const normalizedFlatNo = flatNo.toUpperCase().trim();

    // Kiểm tra quyền: nếu là resident thì chỉ cho xem flat_no của mình
    if (req.user.role === "resident" && req.user.flat_no !== normalizedFlatNo) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Bạn không có quyền xem căn hộ khác",
        });
    }

    const members = await HouseholdMember.find({
      flat_no: normalizedFlatNo,
      is_active: true,
    }).sort({ is_head: -1, relationship: 1 });

    const totalMembers = members.length;
    const head = members.find((m) => m.is_head === true) || null;

    res.json({
      success: true,
      data: {
        flat_no: normalizedFlatNo,
        total_members: totalMembers,
        head_of_household: head,
        members: members,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Thêm thành viên mới vào căn hộ (chỉ admin/manager)
// @route   POST /api/residents/members
// @access  Private (Admin/Manager)
exports.addMember = async (req, res) => {
  try {
    const {
      flat_no,
      full_name,
      relationship,
      gender,
      date_of_birth,
      id_card_number,
      phone,
      is_head,
      move_in_date,
      note,
    } = req.body;

    const normalizedFlatNo = flat_no.toUpperCase().trim();

    // Nếu thành viên mới là chủ hộ, kiểm tra xem căn hộ đã có chủ hộ chưa
    if (is_head) {
      const existingHead = await HouseholdMember.findOne({
        flat_no: normalizedFlatNo,
        is_head: true,
        is_active: true,
      });
      if (existingHead) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Căn hộ này đã có chủ hộ. Vui lòng chuyển đổi vai trò trước.",
          });
      }
    }

    const newMember = await HouseholdMember.create({
      flat_no: normalizedFlatNo,
      full_name,
      relationship,
      gender,
      date_of_birth: date_of_birth || null,
      id_card_number,
      phone,
      is_head: is_head || false,
      move_in_date: move_in_date || Date.now(),
      note,
      is_active: true,
    });

    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key error (chủ hộ đã tồn tại)
      return res
        .status(400)
        .json({ success: false, message: "Căn hộ này đã có chủ hộ." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật thông tin thành viên
// @route   PUT /api/residents/members/:id
// @access  Private (Admin/Manager)
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const member = await HouseholdMember.findById(id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy thành viên" });
    }

    // Nếu cập nhật thành chủ hộ, kiểm tra trùng
    if (updateData.is_head === true && !member.is_head) {
      const existingHead = await HouseholdMember.findOne({
        flat_no: member.flat_no,
        is_head: true,
        is_active: true,
      });
      if (existingHead && existingHead.id !== id) {
        return res
          .status(400)
          .json({ success: false, message: "Căn hộ này đã có chủ hộ khác." });
      }
    }

    Object.assign(member, updateData);
    await member.save();

    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Xóa thành viên (xóa cứng hoặc set is_active = false)
// @route   DELETE /api/residents/members/:id
// @access  Private (Admin/Manager)
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await HouseholdMember.findById(id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy thành viên" });
    }
    // Xóa mềm (đề nghị dùng xóa mềm để giữ lịch sử)
    member.is_active = false;
    await member.save();
    // Hoặc xóa cứng: await HouseholdMember.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa thành viên" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// @desc    Lấy thống kê cư dân (tổng hợp)
// @route   GET /api/residents/statistics
// @access  Private (Admin/Manager)
exports.getResidentStatistics = async (req, res) => {
  try {
    // Tổng số căn hộ có ít nhất 1 thành viên đang hoạt động
    const apartmentsWithMembers = await HouseholdMember.distinct('flat_no', { is_active: true });
    const totalApartments = apartmentsWithMembers.length;

    // Tổng số thành viên đang hoạt động
    const totalMembers = await HouseholdMember.countDocuments({ is_active: true });

    // Phân bố theo giới tính
    const genderStats = await HouseholdMember.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Phân bố theo vai trò (head, spouse, child, parent, other)
    const roleStats = await HouseholdMember.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$relationship', count: { $sum: 1 } } }
    ]);

    // Số lượng thành viên trung bình trên mỗi căn hộ
    const avgMembers = totalApartments > 0 ? (totalMembers / totalApartments).toFixed(1) : 0;

    // (Tuỳ chọn) Top căn hộ có nhiều thành viên nhất
    const topApartments = await HouseholdMember.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$flat_no', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalApartments,
        totalMembers,
        avgMembers,
        genderStats,
        roleStats,
        topApartments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy thống kê chi tiết căn hộ (bao gồm căn hộ trống)
// @route   GET /api/residents/detailed-statistics
// @access  Private (Admin/Manager)
exports.getDetailedStatistics = async (req, res) => {
  try {
    // Lấy danh sách tất cả căn hộ từ constants (bạn có thể lưu trong DB hoặc dùng mảng cứng)
    // Ở đây tôi giả sử bạn có một mảng FLAT_NUMBERS import từ constants (nếu không, bạn có thể định nghĩa trong code)
    const allFlats = [
      '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
      '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
      '301', '302', '303', '304', '305', '306', '307', '308', '309', '310',
      '401', '402', '403', '404', '405', '406', '407', '408', '409', '410'
    ];

    // Lấy danh sách các căn hộ đã có ít nhất một thành viên (is_active true)
    const occupiedFlats = await HouseholdMember.distinct('flat_no', { is_active: true });
    const occupiedSet = new Set(occupiedFlats);

    // Xác định căn hộ trống: flat nằm trong allFlats nhưng không có trong occupiedSet
    const vacantFlats = allFlats.filter(flat => !occupiedSet.has(flat));

    // Tổng số cư dân (đang hoạt động)
    const totalResidents = await HouseholdMember.countDocuments({ is_active: true });

    // Thống kê thêm: số lượng theo giới tính, vai trò, ...
    const genderStats = await HouseholdMember.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const roleStats = await HouseholdMember.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$relationship', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalFlats: allFlats.length,
        occupiedFlatsCount: occupiedSet.size,
        vacantFlatsCount: vacantFlats.length,
        vacantFlatsList: vacantFlats,
        totalResidents,
        genderStats,
        roleStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách căn hộ đã có ít nhất 1 thành viên đang hoạt động
exports.getOccupiedFlats = async (req, res) => {
  try {
    const occupied = await HouseholdMember.distinct('flat_no', { is_active: true });
    res.json({ success: true, data: occupied });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};