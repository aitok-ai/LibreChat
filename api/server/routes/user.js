const express = require('express');
const requireJwtAuth = require('../middleware/requireJwtAuth');

const canDeleteAccount = require('../middleware/canDeleteAccount');
const {
  getUserController,
  updateUserPluginsController,
  followUserController,
  postBiographyController,
  usernameController,
  deleteUserController,
} = require('../controllers/UserController');

const router = express.Router();

router.get('/:userId?', requireJwtAuth, getUserController);
router.post('/plugins', requireJwtAuth, updateUserPluginsController);
router.post('/follow', requireJwtAuth, followUserController);
router.post('/:userId?', requireJwtAuth, postBiographyController);
router.put('/:userId?', requireJwtAuth, usernameController);
router.delete('/delete', requireJwtAuth, canDeleteAccount, deleteUserController);

module.exports = router;
