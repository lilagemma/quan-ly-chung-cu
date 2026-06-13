const ServiceFee = require("../models/ServiceFee");

const SERVICE_FEE_LATE_AMOUNT = 100000;

const applyLateFees = async () => {
  try {
    const now = new Date();

    console.log("Đang kiểm tra các hóa đơn dịch vụ quá hạn...");

    const overdueServiceFees = await ServiceFee.find({
      status: "pending",
      due_date: { $lt: now },
      "items.type": { $ne: "phat_qua_han" },
    });

    let updated = 0;
    let errors = 0;

    for (const fee of overdueServiceFees) {
      try {
        fee.items.push({
          type: "phat_qua_han",
          description: "Phí phạt quá hạn thanh toán",
          quantity: 1,
          unit_price: SERVICE_FEE_LATE_AMOUNT,
          amount: SERVICE_FEE_LATE_AMOUNT,
        });
        fee.total_amount = fee.items.reduce(
          (sum, item) => sum + (item.amount || 0),
          0,
        );
        fee.status = "overdue";
        await fee.save();

        console.log(
          `Đã áp dụng phí phạt quá hạn cho căn hộ ${fee.flat_no} kỳ ${fee.month}/${fee.year}`,
        );
        updated++;
      } catch (err) {
        console.error(
          `Lỗi khi áp dụng phí phạt quá hạn cho căn hộ ${fee.flat_no}:`,
          err.message,
        );
        errors++;
      }
    }

    console.log("Hoàn tất áp dụng phí phạt quá hạn:");
    console.log(`   Đã cập nhật: ${updated}`);
    console.log(`   Lỗi: ${errors}`);

    return { updated, errors };
  } catch (error) {
    console.error("Lỗi trong applyLateFees:", error);
    throw error;
  }
};

const checkAndApplyLateFees = async () => applyLateFees();

module.exports = {
  applyLateFees,
  checkAndApplyLateFees,
};
