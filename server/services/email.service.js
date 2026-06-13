const brevoClient = require("../config/brevo");
const transporter = require("../config/mail");

/**
 * Format month number to month name (Vietnamese)
 */
const getMonthName = (month) => {
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  return months[month - 1] || "Không rõ";
};

/**
 * Format date to readable string (Vietnamese locale)
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format amount to Vietnamese Dong
 */
const formatAmount = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Send payment confirmation email
 */
exports.sendPaymentConfirmation = async (data) => {
  try {
    const {
      email,
      name,
      flat_no,
      amount,
      month,
      year,
      transaction_id,
      payment_date,
    } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDate = new Date(payment_date).toLocaleString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Xác nhận thanh toán - Phí dịch vụ tháng ${monthName} ${year}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận thanh toán</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Xác nhận thanh toán</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Kính gửi <strong>${name}</strong>,</p>
            
            <p>Cảm ơn bạn đã thanh toán! Khoản phí dịch vụ của bạn đã được nhận thành công.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Chi tiết thanh toán</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Tháng:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${monthName} ${year}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Số tiền đã thanh toán:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #22c55e; font-size: 18px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Mã giao dịch:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; font-family: monospace; font-size: 12px;">${transaction_id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Ngày thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
              <span style="color: #22c55e; font-size: 24px;">✓</span>
              <p style="margin: 5px 0 0 0; color: #166534; font-weight: bold;">Thanh toán thành công</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Vui lòng lưu email này để đối chiếu. Nếu bạn có bất kỳ câu hỏi nào liên quan đến thanh toán này, vui lòng liên hệ văn phòng chung cư.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              Đây là email tự động từ Hệ thống quản lý MyCT2.<br>
              Vui lòng không phản hồi email này.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Xác nhận thanh toán - MyCT2
        
        Kính gửi ${name},
        
        Cảm ơn bạn đã thanh toán! Khoản phí dịch vụ của bạn đã được nhận thành công.
        
        Chi tiết thanh toán:
        - Căn hộ: ${flat_no}
        - Tháng: ${monthName} ${year}
        - Số tiền đã thanh toán: ${formattedAmount}
        - Mã giao dịch: ${transaction_id}
        - Ngày thanh toán: ${formattedDate}
        
        Vui lòng lưu email này để đối chiếu.
        
        Cảm ơn bạn,
        MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email xác nhận thanh toán:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận thanh toán:", error);
    throw error;
  }
};

/**
 * Send service fee reminder email
 */
exports.sendServiceFeeReminder = async (data) => {
  try {
    const {
      email,
      name,
      flat_no,
      amount,
      month,
      year,
      due_date,
      is_overdue = false,
    } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = new Date(due_date).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subject = is_overdue
      ? `[QUÁ HẠN] Thanh toán phí dịch vụ tháng ${monthName} ${year}`
      : `Nhắc nhở: Thanh toán phí dịch vụ tháng ${monthName} ${year}`;

    const urgencyColor = is_overdue ? "#ef4444" : "#f59e0b";
    const urgencyText = is_overdue ? "QUÁ HẠN" : "NHẮC NHỞ";

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${urgencyColor}; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">${urgencyText}: Thanh toán phí dịch vụ</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Kính gửi <strong>${name}</strong>,</p>
            
            <p>Đây là ${is_overdue ? "thông báo cuối cùng" : "lời nhắc nhở thân thiện"} rằng khoản phí dịch vụ của bạn cho tháng <strong>${monthName} ${year}</strong> ${is_overdue ? "đã quá hạn" : "đang chờ thanh toán"}.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Số tiền cần thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: ${urgencyColor};">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Hạn thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>
            
            ${is_overdue ? '<p style="color: #ef4444;"><strong>Lưu ý:</strong> Phí phạt quá hạn 100.000 ₫ đã được áp dụng cho tài khoản của bạn.</p>' : ""}
            
            <p>Vui lòng đăng nhập vào Cổng thông tin quản lý chung cư để thực hiện thanh toán.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Hệ thống quản lý MyCT2
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ${urgencyText}: Thanh toán phí dịch vụ - MyCT2
        
        Kính gửi ${name},
        
        Đây là ${is_overdue ? "thông báo cuối cùng" : "lời nhắc nhở"} rằng khoản phí dịch vụ của bạn cho tháng ${monthName} ${year} ${is_overdue ? "đã quá hạn" : "đang chờ thanh toán"}.
        
        Căn hộ: ${flat_no}
        Số tiền cần thanh toán: ${formattedAmount}
        Hạn thanh toán: ${formattedDueDate}
        
        ${is_overdue ? "Lưu ý: Phí phạt quá hạn 100.000 ₫ đã được áp dụng." : ""}
        
        Vui lòng đăng nhập để thanh toán.
        
        Cảm ơn bạn,
        MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email nhắc nhở phí dịch vụ:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email nhắc nhở phí dịch vụ:", error);
    throw error;
  }
};

/**
 * Send service fee invoice email
 */
exports.sendServiceFeeInvoice = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, due_date } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = formatDate(due_date);

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Hóa đơn phí dịch vụ - ${monthName} ${year} | MyCT2`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Hóa đơn phí dịch vụ</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Kính gửi <strong>${name}</strong>,</p>
            
            <p>Hóa đơn phí dịch vụ của bạn cho tháng <strong>${monthName} ${year}</strong> đã được tạo.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px;">Chi tiết hóa đơn</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Kỳ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${monthName} ${year}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Số tiền cần thanh toán:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #0D9488; font-size: 20px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Hạn thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Quan trọng:</strong> Phí phạt quá hạn 100.000 ₫ sẽ được áp dụng nếu thanh toán không được nhận trước hạn.
              </p>
            </div>
            
            <p>Vui lòng đăng nhập vào Cổng thông tin quản lý chung cư để thực hiện thanh toán.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/service-fees" 
                 style="background: #0D9488; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Thanh toán ngay
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Đây là email tự động từ Hệ thống quản lý MyCT2.<br>
              Vui lòng không phản hồi email này.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Hóa đơn phí dịch vụ - ${monthName} ${year}
        MyCT2
        
        Kính gửi ${name},
        
        Hóa đơn phí dịch vụ của bạn cho tháng ${monthName} ${year} đã được tạo.
        
        Chi tiết hóa đơn:
        - Căn hộ: ${flat_no}
        - Kỳ: ${monthName} ${year}
        - Số tiền cần thanh toán: ${formattedAmount}
        - Hạn thanh toán: ${formattedDueDate}
        
        Quan trọng: Phí phạt quá hạn 100.000 ₫ sẽ được áp dụng nếu thanh toán không được nhận trước hạn.
        
        Vui lòng đăng nhập để thanh toán.
        
        Cảm ơn bạn,
        MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email hóa đơn phí dịch vụ:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email hóa đơn phí dịch vụ:", error);
    throw error;
  }
};

/**
 * Send final warning email (Day 16 - 2 days before late fee)
 */
exports.sendFinalWarning = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, due_date } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = formatDate(due_date);

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `⚠️ CẢNH BÁO CUỐI: Thanh toán phí dịch vụ còn 2 ngày | ${monthName} ${year}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">⚠️ CẢNH BÁO CUỐI</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Thanh toán phí dịch vụ còn 2 ngày</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Kính gửi <strong>${name}</strong>,</p>
            
            <p>Đây là <strong style="color: #ef4444;">LỜI NHẮC CUỐI CÙNG</strong> rằng khoản phí dịch vụ của bạn cho tháng <strong>${monthName} ${year}</strong> vẫn đang chờ thanh toán.</p>
            
            <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">
                ⏰ Chỉ còn 2 ngày trước khi áp dụng phí phạt!
              </p>
            </div>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Số tiền cần thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444; font-size: 20px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Hạn thanh toán:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444;">${formattedDueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Phí phạt sau hạn:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">100.000 ₫</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #dc2626;">
              <strong>Vui lòng thanh toán ngay để tránh bị tính phí phạt.</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/service-fees" 
                 style="background: #ef4444; color: white; padding: 15px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                THANH TOÁN NGAY - Tránh phí phạt
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Hệ thống quản lý MyCT2
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ⚠️ CẢNH BÁO CUỐI: Thanh toán phí dịch vụ còn 2 ngày
        MyCT2
        
        Kính gửi ${name},
        
        Đây là LỜI NHẮC CUỐI CÙNG rằng khoản phí dịch vụ của bạn cho tháng ${monthName} ${year} vẫn đang chờ thanh toán.
        
        ⏰ Chỉ còn 2 ngày trước khi áp dụng phí phạt!
        
        Chi tiết thanh toán:
        - Căn hộ: ${flat_no}
        - Số tiền cần thanh toán: ${formattedAmount}
        - Hạn thanh toán: ${formattedDueDate}
        - Phí phạt sau hạn: 100.000 ₫
        
        Vui lòng thanh toán ngay để tránh bị tính phí phạt.
        
        Cảm ơn bạn,
        MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email cảnh báo cuối:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email cảnh báo cuối:", error);
    throw error;
  }
};

/**
 * Send emergency alert email to all users
 */
exports.sendEmergencyAlert = async (data) => {
  try {
    const {
      email,
      name,
      triggered_by_name,
      triggered_by_flat,
      triggered_by_phone,
      triggered_at,
      notes,
    } = data;

    const formattedTime = new Date(triggered_at).toLocaleString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: "🚨 CẢNH BÁO KHẨN CẤP THANG MÁY - MyCT2",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <span style="font-size: 48px;">🚨</span>
            <h1 style="color: white; margin: 10px 0 0 0;">KHẨN CẤP THANG MÁY</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Có người bị kẹt trong thang máy!</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: white; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #dc2626;">⚠️ Chi tiết khẩn cấp</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Được kích hoạt bởi:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">${triggered_by_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">${triggered_by_flat}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Số điện thoại liên hệ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">
                    <a href="tel:${triggered_by_phone}" style="color: #dc2626; text-decoration: none;">${triggered_by_phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Thời gian:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedTime}</td>
                </tr>
              </table>
              
              ${
                notes
                  ? `
              <div style="margin-top: 15px; padding: 10px; background: #fef2f2; border-radius: 4px;">
                <strong>Ghi chú:</strong> ${notes}
              </div>
              `
                  : ""
              }
            </div>
            
            <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ⚡ CẦN CHÚ Ý NGAY LẬP TỨC
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Nếu bạn ở gần, vui lòng kiểm tra thang máy ngay lập tức.<br>
                Liên hệ bảo vệ tòa nhà hoặc gọi hỗ trợ nếu cần.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Đây là cảnh báo khẩn cấp tự động từ MyCT2.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        🚨 CẢNH BÁO KHẨN CẤP THANG MÁY - MyCT2
        
        CÓ NGƯỜI BỊ KẸT TRONG THANG MÁY!
        
        Chi tiết khẩn cấp:
        - Được kích hoạt bởi: ${triggered_by_name}
        - Căn hộ: ${triggered_by_flat}
        - Số điện thoại liên hệ: ${triggered_by_phone}
        - Thời gian: ${formattedTime}
        ${notes ? `- Ghi chú: ${notes}` : ""}
        
        ⚡ CẦN CHÚ Ý NGAY LẬP TỨC
        
        Nếu bạn ở gần, vui lòng kiểm tra thang máy ngay lập tức.
        Liên hệ bảo vệ tòa nhà hoặc gọi hỗ trợ nếu cần.
        
        - MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email cảnh báo khẩn cấp:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email cảnh báo khẩn cấp:", error);
    throw error;
  }
};

/**
 * Send emergency resolved email to all users
 */
exports.sendEmergencyResolved = async (data) => {
  try {
    const {
      email,
      name,
      resolved_by_name,
      resolved_by_flat,
      resolved_at,
      triggered_by_name,
      triggered_by_flat,
      triggered_at,
    } = data;

    const formattedResolvedTime = new Date(resolved_at).toLocaleString(
      "vi-VN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    );

    const formattedTriggeredTime = new Date(triggered_at).toLocaleString(
      "vi-VN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    );

    // Calculate duration
    const durationMs = new Date(resolved_at) - new Date(triggered_at);
    const durationMinutes = Math.round(durationMs / 60000);
    const durationText =
      durationMinutes < 60
        ? `${durationMinutes} phút`
        : `${Math.floor(durationMinutes / 60)} giờ ${durationMinutes % 60} phút`;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: "✅ Đã giải quyết khẩn cấp thang máy - MyCT2",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #16a34a; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <span style="font-size: 48px;">✅</span>
            <h1 style="color: white; margin: 10px 0 0 0;">ĐÃ GIẢI QUYẾT KHẨN CẤP</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Sự cố thang máy đã được xử lý</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border: 2px solid #16a34a; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: white; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #16a34a;">📋 Chi tiết giải quyết</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Được kích hoạt bởi:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${triggered_by_name} (Căn hộ ${triggered_by_flat})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Thời gian kích hoạt:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; text-align: right;">${formattedTriggeredTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Được giải quyết bởi:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${resolved_by_name} (Căn hộ ${resolved_by_flat})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Thời gian giải quyết:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; text-align: right;">${formattedResolvedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Thời gian phản hồi:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #16a34a;">${durationText}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #16a34a; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                🎉 Đã an toàn!
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Sự việc đã được xử lý và mọi người đều an toàn.<br>
                Cảm ơn bạn đã chú ý và hợp tác.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Đây là thông báo tự động từ MyCT2.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ✅ ĐÃ GIẢI QUYẾT KHẨN CẤP THANG MÁY - MyCT2
        
        Sự cố thang máy đã được giải quyết!
        
        Chi tiết giải quyết:
        - Được kích hoạt bởi: ${triggered_by_name} (Căn hộ ${triggered_by_flat})
        - Thời gian kích hoạt: ${formattedTriggeredTime}
        - Được giải quyết bởi: ${resolved_by_name} (Căn hộ ${resolved_by_flat})
        - Thời gian giải quyết: ${formattedResolvedTime}
        - Thời gian phản hồi: ${durationText}
        
        🎉 Đã an toàn! Sự việc đã được xử lý và mọi người đều an toàn.
        
        Cảm ơn bạn đã chú ý và hợp tác.
        
        - MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email thông báo đã giải quyết khẩn cấp:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email thông báo đã giải quyết khẩn cấp:", error);
    throw error;
  }
};

/**
 * Send complaint status update email
 */
exports.sendComplaintStatusUpdate = async (data) => {
  try {
    const {
      email,
      name,
      flat_no,
      description,
      previous_status,
      new_status,
      admin_notes,
      updated_by,
      updated_at,
    } = data;

    const formattedDate = formatDate(updated_at);

    // Status colors and labels (tiếng Việt)
    const statusConfig = {
      open: { color: "#f59e0b", bg: "#fef3c7", label: "Đang chờ", icon: "📋" },
      "in-progress": {
        color: "#3b82f6",
        bg: "#dbeafe",
        label: "Đang xử lý",
        icon: "🔄",
      },
      resolved: {
        color: "#22c55e",
        bg: "#dcfce7",
        label: "Đã giải quyết",
        icon: "✅",
      },
    };

    const newStatusConfig = statusConfig[new_status] || statusConfig["open"];
    const prevStatusConfig =
      statusConfig[previous_status] || statusConfig["open"];

    // Truncate description for email
    const shortDescription =
      description.length > 200
        ? description.substring(0, 200) + "..."
        : description;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Cập nhật khiếu nại: Trạng thái đã thay đổi thành ${newStatusConfig.label}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cập nhật khiếu nại</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Cập nhật khiếu nại</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Kính gửi <strong>${name}</strong>,</p>
            
            <p>Trạng thái khiếu nại của bạn đã được cập nhật. Sau đây là chi tiết:</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Chi tiết khiếu nại</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Căn hộ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Mô tả:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${shortDescription}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Trạng thái cũ:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    <span style="background: ${prevStatusConfig.bg}; color: ${prevStatusConfig.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                      ${prevStatusConfig.icon} ${prevStatusConfig.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Trạng thái mới:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    <span style="background: ${newStatusConfig.bg}; color: ${newStatusConfig.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                      ${newStatusConfig.icon} ${newStatusConfig.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Cập nhật bởi:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${updated_by}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Cập nhật lúc:</td>
                  <td style="padding: 10px 0; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
              
              ${
                admin_notes
                  ? `
              <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0d9488; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold;">Ghi chú của quản trị:</p>
                <p style="margin: 8px 0 0 0; color: #333;">${admin_notes}</p>
              </div>
              `
                  : ""
              }
            </div>
            
            ${
              new_status === "resolved"
                ? `
            <div style="background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ✅ Khiếu nại của bạn đã được giải quyết!
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Cảm ơn bạn đã phản ánh.
              </p>
            </div>
            `
                : `
            <div style="background: ${newStatusConfig.bg}; color: ${newStatusConfig.color}; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                ${newStatusConfig.icon} Khiếu nại của bạn hiện đang ở trạng thái <strong>${newStatusConfig.label}</strong>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 13px;">
                Chúng tôi sẽ tiếp tục cập nhật cho bạn.
              </p>
            </div>
            `
            }
            
            <p style="color: #666; font-size: 14px;">
              Bạn có thể xem chi tiết khiếu nại bằng cách đăng nhập vào cổng thông tin quản lý chung cư.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Đây là thông báo tự động từ MyCT2.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Cập nhật khiếu nại - MyCT2
        
        Kính gửi ${name},
        
        Trạng thái khiếu nại của bạn đã được cập nhật.
        
        Chi tiết khiếu nại:
        - Căn hộ: ${flat_no}
        - Mô tả: ${shortDescription}
        - Trạng thái cũ: ${prevStatusConfig.label}
        - Trạng thái mới: ${newStatusConfig.label}
        - Cập nhật bởi: ${updated_by}
        - Cập nhật lúc: ${formattedDate}
        ${admin_notes ? `- Ghi chú của quản trị: ${admin_notes}` : ""}
        
        ${
          new_status === "resolved"
            ? "Khiếu nại của bạn đã được giải quyết! Cảm ơn bạn đã phản ánh."
            : "Chúng tôi sẽ tiếp tục cập nhật cho bạn."
        }
        
        - MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email cập nhật trạng thái khiếu nại:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email cập nhật trạng thái khiếu nại:", error);
    throw error;
  }
};

/**
 * Send password reset OTP email
 */
exports.sendPasswordResetOTP = async (data) => {
  try {
    const { email, name, otp, expiryMinutes } = data;

    const mailOptions = {
      from: `"MyCT2" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu - MyCT2",

      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã OTP đặt lại mật khẩu</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Yêu cầu đặt lại mật khẩu</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Kính gửi <strong>${name}</strong>,</p>

            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Sử dụng mã OTP dưới đây để tiếp tục:</p>

            <div style="background: #0D9488; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px 0;">Mã OTP của bạn</p>
              <h2 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h2>
            </div>

            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">
                <strong>⏰ Quan trọng:</strong> Mã OTP sẽ hết hạn sau <strong>${expiryMinutes} phút</strong>.
              </p>
            </div>

            <p style="color: #666; font-size: 14px;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>
        </body>
        </html>
      `,

      text: `
Mã OTP đặt lại mật khẩu - MyCT2

Kính gửi ${name},

Mã OTP của bạn: ${otp}

Mã này sẽ hết hạn sau ${expiryMinutes} phút.
      `,
    };

    const response = await transporter.sendMail(mailOptions);

    console.log("Đã gửi email OTP đặt lại mật khẩu:", email);

    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email OTP đặt lại mật khẩu:", error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 */
exports.sendPasswordResetConfirmation = async (data) => {
  try {
    const { email, name } = data;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: "Đã thay đổi mật khẩu thành công - MyCT2",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đã thay đổi mật khẩu</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 MyCT2</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Đã thay đổi mật khẩu</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Kính gửi <strong>${name}</strong>,</p>
            
            <div style="background: #DCFCE7; border: 1px solid #22C55E; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <span style="color: #22C55E; font-size: 40px;">✓</span>
              <p style="margin: 10px 0 0 0; color: #166534; font-weight: bold; font-size: 18px;">Đổi mật khẩu thành công!</p>
            </div>
            
            <p>Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            
            <div style="background: #FEE2E2; border: 1px solid #EF4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991B1B; font-size: 14px;">
                <strong>⚠️ Lưu ý bảo mật:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ văn phòng chung cư ngay lập tức và xem xét bảo mật tài khoản email của bạn.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              Đây là email tự động từ Hệ thống quản lý MyCT2.<br>
              Vui lòng không phản hồi email này.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Đã thay đổi mật khẩu thành công - MyCT2
        
        Kính gửi ${name},
        
        Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
        
        Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ văn phòng chung cư ngay lập tức.
        
        - MyCT2
      `,
      sender: brevoClient.defaultSender,
    };

    const response =
      await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Đã gửi email xác nhận đã đổi mật khẩu:", email);
    return response;
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận đã đổi mật khẩu:", error);
    throw error;
  }
};
