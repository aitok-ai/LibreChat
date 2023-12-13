const PaymentRefUserId = require('../models/paymentReference.js'); // Store paymentreference and userID
const Payment = require('../models/payments.js');

const calcExpiryDate = (planType) => {
  const subscriptionStartDate = new Date();
  let expirationDate = new Date(subscriptionStartDate);

  switch (planType) {
    case 'month':
      expirationDate.setDate(subscriptionStartDate.getDate() + 31);
      break;
    case 'quarter':
      expirationDate.setDate(subscriptionStartDate.getDate() + 31 * 3);
      break;
    case 'year':
      expirationDate.setDate(subscriptionStartDate.getDate() + 31 * 12);
      break;
    default:
      throw new Error('Invalid plan type');
  }

  return {
    subscriptionStartDate,
    expirationDate
  };
};

async function createPaymentRecord(
  userId,
  planId,
  amount,
  currency,
  paymentId,
  paymentReference,
  paymentMethod,
  paymentStatus,
  subscriptionStartDate,
  expirationDate
) {
  const paymentRecord = new Payment({
    userId,
    planId,
    amount,
    currency,
    paymentId,
    paymentReference,
    paymentMethod,
    paymentStatus,
    subscriptionStartDate,
    expirationDate
  });

  await paymentRecord.save();
}

async function getUserSessionFromReference(paymentReference) {
  try {
    const paymentRefUserId = await PaymentRefUserId.findPaymentRefUserId({ paymentReference });
    if (paymentRefUserId) {
      return { userId: paymentRefUserId.userId };
    } else {
      console.error('[getUserSessionFromReference] Payment reference not found.');
      return null;
    }
  } catch (err) {
    console.error(`[getUserSessionFromReference] Error: ${err}`);
    throw err;
  }
}

module.exports = {
  calcExpiryDate,
  createPaymentRecord,
  getUserSessionFromReference
};