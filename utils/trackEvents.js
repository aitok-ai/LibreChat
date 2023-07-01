const ReactGA = require('react-ga');

const trackingId = 'G-KVV9QJKG5K';
const debug = process.env.NODE_ENV !== 'production';
const gaOptions = {
  anonymizeIp: true
};

ReactGA.initialize(trackingId, {
  debug,
  gaOptions
});

const trackEvent = (category, action, label) => {
  ReactGA.event({
    category,
    action,
    label
  });
};

module.exports = { trackEvent }; 
