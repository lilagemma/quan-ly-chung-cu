const cron = require('node-cron');
const { applyLateFees } = require('./lateFeeApplier');

const initCronJobs = () => {
  console.log('Initializing cron jobs...');

  cron.schedule('0 0 * * *', async () => {
    console.log('Running: Apply late fees to overdue service fee invoices');
    try {
      await applyLateFees();
    } catch (err) {
      console.error('Cron job failed - applyLateFees:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  });

  console.log('Cron jobs initialized:');
  console.log('   - Service fee late charge application: Daily at 00:00');
};

module.exports = initCronJobs;
