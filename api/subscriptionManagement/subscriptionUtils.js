const PaymentRefUserId = require('../models/paymentReference.js'); // Store paymentreference and userID
const Payment = require('../models/payments.js');

function getStripeLocale(req) {
  const browserLanguage = req.headers['accept-language'].split(',')[0];
  let stripeLocale = 'en'; // Default to English

  if (browserLanguage.startsWith('zh')) {
    stripeLocale = 'zh'; // Simplified Chinese for 'zh' language codes
  }

  return stripeLocale;
}

function translate(planId, locale) {
  const translations = {
    'zh': {
      'month': '订阅 - 月',
      'quarter': '订阅 - 季度',
      'year': '订阅 - 年'
    },
    // other locales as needed
  };

  // If locale is English or translation is not found, return the default text
  if (locale === 'en' || !translations[locale] || !translations[locale][planId]) {
    return `Subscription - ${planId}`;
  }

  // Return the translation for the given planId and locale
  return translations[locale][planId];
}

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
  getStripeLocale,
  translate,
  calcExpiryDate,
  createPaymentRecord,
  getUserSessionFromReference
};