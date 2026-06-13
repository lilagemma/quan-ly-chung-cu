const mongoose = require("mongoose");
const User = require("../models/User");
const HouseholdMember = require("../models/HouseholdMember");
require("dotenv").config({ path: ".env.local" });

const sync = async () => {
  try {
    // Kết nối MongoDB (bỏ các options cũ)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Đã kết nối MongoDB");

    // Lấy tất cả user có role 'resident' hoặc 'manager' (có flat_no)
    const users = await User.find({
      flat_no: { $ne: null, $ne: "" },
      is_active: true,
    });

    let added = 0;
    for (const user of users) {
      // Kiểm tra xem đã có trong HouseholdMember chưa
      const exists = await HouseholdMember.findOne({
        flat_no: user.flat_no,
        is_head: true,
        is_active: true,
      });
      if (!exists) {
        await HouseholdMember.create({
          flat_no: user.flat_no,
          full_name: user.name,
          relationship: "head",
          is_head: true,
          phone: user.phone,
          move_in_date: user.created_at || new Date(),
          is_active: true,
          user_id: user._id, // liên kết với user
          note: "Tự động đồng bộ từ user",
        });
        console.log(
          `✅ Đã thêm chủ hộ cho căn hộ ${user.flat_no} - ${user.name}`,
        );
        added++;
      } else {
        console.log(`⏭️ Căn hộ ${user.flat_no} đã có chủ hộ, bỏ qua`);
      }
    }
    console.log(`Hoàn thành. Đã thêm ${added} chủ hộ mới.`);
    process.exit(0);
  } catch (err) {
    console.error("Lỗi:", err);
    process.exit(1);
  }
};
sync();
