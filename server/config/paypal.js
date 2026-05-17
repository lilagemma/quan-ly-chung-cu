const paypal = require("@paypal/checkout-server-sdk");

// Sandbox environment (dev)
function environment() {
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
  );
}

// Client instance (giống "razorpay instance")
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client, paypal };
