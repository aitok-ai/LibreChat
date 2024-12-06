// const { updateUserPluginsService } = require('../services/UserService');
// const { updateUserPluginAuth, deleteUserPluginAuth } = require('../services/PluginService');
// const User = require('../../models/User');
const {
  //User,
  Session,
  Balance,
  getFiles,
  deleteFiles,
  deleteConvos,
  deletePresets,
  deleteMessages,
  deleteUserById,
} = require('~/models');
const User = require('~/models/User');
const { updateUserPluginAuth, deleteUserPluginAuth } = require('~/server/services/PluginService');
const { updateUserPluginsService, deleteUserKey } = require('~/server/services/UserService');
const { verifyEmail, resendVerificationEmail } = require('~/server/services/AuthService');
const { processDeleteRequest } = require('~/server/services/Files/process');
const { deleteAllSharedLinks } = require('~/models/Share');
const { deleteToolCalls } = require('~/models/ToolCall');
const { Transaction } = require('~/models/Transaction');
const { logger } = require('~/config');
const { getUserMessageQuotaUsagePastDays } = require('../middleware/messageQuota');

const getUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === undefined || userId === req.user.id) {
      // information about the current user
      const monthlyQuotaConsumed = await getUserMessageQuotaUsagePastDays(req.user, 30); // This value might be dynamic based on your application logic

      // Extend req.user with the new field
      const response = {
        ...req.user,
        monthlyQuotaConsumed: monthlyQuotaConsumed,
      };
      res.status(200).send(response);
    } else {
      // information about another user, without even authentification.
      // TODO: this might be a security issue
      const user = await User.findById(userId).exec();
      const id = user._id;
      const name = user.name;
      const username = user.username;
      const followers = user.followers;
      const following = user.following;
      const biography = user.biography;
      res.status(200).send({ id, name, username, followers, following, biography });
    }
  } catch (error) {
    console.log(error);
    return { message: 'Error getting user' };
  }
};

// update biography
const postBiographyController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { biography } = req.body;

    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update biography' });
    }

    const updatedFields = {};
    if (biography !== undefined) {
      updatedFields.biography = biography;
      // updatedFields.profession = profession;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating biography' });
  }
};

// update User name
const usernameController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update username' });
    }

    const updatedFields = {};
    if (username !== undefined) {
      updatedFields.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('in controller', updatedUser);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating biography' });
  }
};

const getTermsStatusController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ termsAccepted: !!user.termsAccepted });
  } catch (error) {
    logger.error('Error fetching terms acceptance status:', error);
    res.status(500).json({ message: 'Error fetching terms acceptance status' });
  }
};

const acceptTermsController = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { termsAccepted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Terms accepted successfully' });
  } catch (error) {
    logger.error('Error accepting terms:', error);
    res.status(500).json({ message: 'Error accepting terms' });
  }
};

const deleteUserFiles = async (req) => {
  try {
    const userFiles = await getFiles({ user: req.user.id });
    await processDeleteRequest({
      req,
      files: userFiles,
    });
  } catch (error) {
    logger.error('[deleteUserFiles]', error);
  }
};

const updateUserPluginsController = async (req, res) => {
  const { user } = req;
  const { pluginKey, action, auth, isEntityTool } = req.body;
  let authService;
  try {
    if (!isEntityTool) {
      const userPluginsService = await updateUserPluginsService(user, pluginKey, action);

      if (userPluginsService instanceof Error) {
        logger.error('[userPluginsService]', userPluginsService);
        const { status, message } = userPluginsService;
        res.status(status).send({ message });
      }
    }

    if (auth) {
      const keys = Object.keys(auth);
      const values = Object.values(auth);
      if (action === 'install' && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          authService = await updateUserPluginAuth(user.id, keys[i], pluginKey, values[i]);
          if (authService instanceof Error) {
            logger.error('[authService]', authService);
            const { status, message } = authService;
            res.status(status).send({ message });
          }
        }
      }
      if (action === 'uninstall' && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          authService = await deleteUserPluginAuth(user.id, keys[i]);
          if (authService instanceof Error) {
            logger.error('[authService]', authService);
            const { status, message } = authService;
            res.status(status).send({ message });
          }
        }
      }
    }

    res.status(200).send();
  } catch (err) {
    logger.error('[updateUserPluginsController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const followUserController = async (req, res) => {
  try {
    const { user, isFollowing, otherUser } = req.body.arg;

    let dbResponse;
    const userUpdate = {};
    const otherUserUpdate = {};

    // Build the updates
    userUpdate[`following.${otherUser.id}`] = {
      name: otherUser.name,
      username: otherUser.username,
    };
    otherUserUpdate[`followers.${user.id}`] = { name: user.name, username: user.username };

    // Updates to the DB
    if (isFollowing) {
      await User.findByIdAndUpdate(user.id, { $set: userUpdate }, { new: true, upsert: false });
      dbResponse = await User.findByIdAndUpdate(
        otherUser.id,
        { $set: otherUserUpdate },
        { new: true, upsert: false },
      );
    } else {
      await User.findByIdAndUpdate(user.id, { $unset: userUpdate }, { new: true, upsert: false });
      dbResponse = await User.findByIdAndUpdate(
        otherUser.id,
        { $unset: otherUserUpdate },
        { new: true, upsert: false },
      );
    }
    // Returns the updated profile page user
    const id = dbResponse._id;
    const name = dbResponse.name;
    const username = dbResponse.username;
    const followers = dbResponse.followers;
    const following = dbResponse.following;
    res.status(200).send({ id, name, username, followers, following });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
const deleteUserController = async (req, res) => {
  const { user } = req;

  try {
    await deleteMessages({ user: user.id }); // delete user messages
    await Session.deleteMany({ user: user.id }); // delete user sessions
    await Transaction.deleteMany({ user: user.id }); // delete user transactions
    await deleteUserKey({ userId: user.id, all: true }); // delete user keys
    await Balance.deleteMany({ user: user._id }); // delete user balances
    await deletePresets(user.id); // delete user presets
    /* TODO: Delete Assistant Threads */
    await deleteConvos(user.id); // delete user convos
    await deleteUserPluginAuth(user.id, null, true); // delete user plugin auth
    await deleteUserById(user.id); // delete user
    await deleteAllSharedLinks(user.id); // delete user shared links
    await deleteUserFiles(req); // delete user files
    await deleteFiles(null, user.id); // delete database files in case of orphaned files from previous steps
    await deleteToolCalls(user.id); // delete user tool calls
    /* TODO: queue job for cleaning actions and assistants of non-existant users */
    logger.info(`User deleted account. Email: ${user.email} ID: ${user.id}`);
    res.status(200).send({ message: 'User deleted' });
  } catch (err) {
    logger.error('[deleteUserController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const verifyEmailController = async (req, res) => {
  try {
    const verifyEmailService = await verifyEmail(req);
    if (verifyEmailService instanceof Error) {
      return res.status(400).json(verifyEmailService);
    } else {
      return res.status(200).json(verifyEmailService);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const resendVerificationController = async (req, res) => {
  try {
    const result = await resendVerificationEmail(req);
    if (result instanceof Error) {
      return res.status(400).json(result);
    } else {
      return res.status(200).json(result);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = {
  getUserController,
  followUserController,
  postBiographyController,
  usernameController,
  getTermsStatusController,
  acceptTermsController,
  deleteUserController,
  verifyEmailController,
  updateUserPluginsController,
  resendVerificationController,
};
