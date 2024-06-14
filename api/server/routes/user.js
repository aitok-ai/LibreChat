const express = require('express');
const { requireJwtAuth, canDeleteAccount, verifyEmailLimiter } = require('~/server/middleware');
const {
  getUserController,
  deleteUserController,
  verifyEmailController,
  updateUserPluginsController,
  resendVerificationController,
  followUserController,
  postBiographyController,
  usernameController,
} = require('~/server/controllers/UserController');

const router = express.Router();

router.get('/:userId?', requireJwtAuth, getUserController);
router.post('/plugins', requireJwtAuth, updateUserPluginsController);
router.post('/follow', requireJwtAuth, followUserController);
router.post('/:userId?', requireJwtAuth, postBiographyController);
router.put('/:userId?', requireJwtAuth, usernameController);
router.delete('/delete', requireJwtAuth, canDeleteAccount, deleteUserController);
router.post('/verify', verifyEmailController);
router.post('/verify/resend', verifyEmailLimiter, resendVerificationController);

module.exports = router;
