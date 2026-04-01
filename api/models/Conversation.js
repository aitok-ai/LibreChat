const mongoose = require('mongoose');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');

/**
 * Get recent conversations for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of recent conversations
 */
async function getRecentConvos(userId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return [];
  }
  return Conversation.find({ user: userId }).sort({ updatedAt: -1 }).limit(20).lean();
}

/**
 * Get the hottest (most viewed) conversation for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - The hottest conversation or null
 */
async function getHottestConvo(userId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return null;
  }
  return Conversation.findOne({ user: userId }).sort({ viewCount: -1 }).lean();
}

/**
 * Get a shared conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The shared conversation or null
 */
async function getSharedConvo(conversationId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return null;
  }
  return Conversation.findOne({ conversationId, isPrivate: false }).lean();
}

/**
 * Get liked conversations for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of liked conversations
 */
async function getLikedConvos(userId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return [];
  }
  return Conversation.find({ user: userId, liked: true }).sort({ updatedAt: -1 }).lean();
}

/**
 * Get public conversations for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of public conversations
 */
async function getPublicConvos(userId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return [];
  }
  return Conversation.find({ user: userId, isPrivate: false }).sort({ updatedAt: -1 }).lean();
}

/**
 * Get conversations from followed users
 * @param {Array<string>} following - Array of user IDs being followed
 * @returns {Promise<Array>} - Array of conversations from followed users
 */
async function getFollowingConvos(following) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation || !following || following.length === 0) {
    return [];
  }
  return Conversation.find({ user: { $in: following }, isPrivate: false })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
}

/**
 * Increase the view count for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The updated conversation or null
 */
async function increaseConvoViewCount(conversationId) {
  const Conversation = mongoose.models.Conversation;
  if (!Conversation) {
    return null;
  }
  return Conversation.findOneAndUpdate(
    { conversationId },
    { $inc: { viewCount: 1 } },
    { new: true },
  ).lean();
}

module.exports = {
  getRecentConvos,
  getHottestConvo,
  getSharedConvo,
  getLikedConvos,
  getPublicConvos,
  getFollowingConvos,
  increaseConvoViewCount,
};
