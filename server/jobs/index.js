const cron = require('node-cron');
const { applyLateFees } = require('./lateFeeApplier');

const initCronJobs = () => {
  console.log('Đang khởi tạo các tác vụ cron...');

  cron.schedule('0 0 * * *', async () => {
    console.log("Đang thực thi: Tính phí trễ cho các hóa đơn dịch vụ quá hạn");
    try {
      await applyLateFees();
    } catch (err) {
      console.error("Tác vụ cron thất bại - applyLateFees:", err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  });

  console.log('Các tác vụ cron đã được khởi tạo:');
  console.log(" - Áp dụng phí trễ hóa đơn dịch vụ: Hàng ngày lúc 00:00");
};

module.exports = initCronJobs;
