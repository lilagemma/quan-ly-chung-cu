const admin = require("../config/firebaseAdmin"); // đường dẫn chính xác

exports.sendPushNotification = async (tokens, title, body) => {
  if (!tokens || tokens.length === 0) {
    console.log("⚠️ Hàm gửi nhận được mảng token rỗng.");
    return;
  }

  const message = {
    notification: { title, body },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `📢 Kết quả gửi FCM: Thành công ${response.successCount} / Thất bại ${response.failureCount}`,
    );
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Lỗi token ${tokens[idx]}: ${resp.error.message}`);
        }
      });
    }
  } catch (error) {
    console.error("💥 Lỗi hệ thống khi gửi FCM:", error);
  }
};
