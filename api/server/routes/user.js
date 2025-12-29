const express = require('express');
const {
  updateUserPluginsController,
  resendVerificationController,
  followUserController,
  postBiographyController,
  usernameController,
  getTermsStatusController,
  acceptTermsController,
  verifyEmailController,
  deleteUserController,
  getUserController,
} = require('~/server/controllers/UserController');
const {
  verifyEmailLimiter,
  configMiddleware,
  canDeleteAccount,
  requireJwtAuth,
} = require('~/server/middleware');

const settings = require('./settings');

const router = express.Router();

// Settings routes
router.use('/settings', settings);

// Routes without userId parameter (must come before parameterized routes)
router.get('/', requireJwtAuth, getUserController);
router.get('/terms', requireJwtAuth, getTermsStatusController);
router.post('/terms/accept', requireJwtAuth, acceptTermsController);
router.post('/plugins', requireJwtAuth, updateUserPluginsController);
router.post('/follow', requireJwtAuth, followUserController);
router.delete('/delete', requireJwtAuth, canDeleteAccount, configMiddleware, deleteUserController);
router.post('/verify', verifyEmailController);
router.post('/verify/resend', verifyEmailLimiter, resendVerificationController);

// Routes with userId parameter (must come after specific routes to avoid conflicts)
router.get('/:userId', requireJwtAuth, getUserController);
router.post('/:userId', requireJwtAuth, postBiographyController);
router.put('/:userId', requireJwtAuth, usernameController);

module.exports = router;
