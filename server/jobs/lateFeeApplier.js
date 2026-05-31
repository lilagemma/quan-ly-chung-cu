const ServiceFee = require('../models/ServiceFee');

const SERVICE_FEE_LATE_AMOUNT = 100000;

const applyLateFees = async () => {
  try {
    const now = new Date();

    console.log('Checking for overdue service fee invoices...');

    const overdueServiceFees = await ServiceFee.find({
      status: 'pending',
      due_date: { $lt: now },
      'items.type': { $ne: 'phat_qua_han' }
    });

    let updated = 0;
    let errors = 0;

    for (const fee of overdueServiceFees) {
      try {
        fee.items.push({
          type: 'phat_qua_han',
          description: 'Phi phat qua han thanh toan',
          quantity: 1,
          unit_price: SERVICE_FEE_LATE_AMOUNT,
          amount: SERVICE_FEE_LATE_AMOUNT
        });
        fee.total_amount = fee.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        fee.status = 'overdue';
        await fee.save();

        console.log(`Applied service fee late charge to flat ${fee.flat_no} for ${fee.month}/${fee.year}`);
        updated++;
      } catch (err) {
        console.error(`Error applying service fee late charge to flat ${fee.flat_no}:`, err.message);
        errors++;
      }
    }

    console.log('Late fee application complete:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);

    return { updated, errors };
  } catch (error) {
    console.error('Error in applyLateFees:', error);
    throw error;
  }
};

const checkAndApplyLateFees = async () => applyLateFees();

module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};
