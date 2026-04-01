const mongoose = require('mongoose');

/**
 * Duplicate messages for a new conversation
 * @param {Object} params - Parameters
 * @param {string} params.newConversationId - The new conversation ID
 * @param {Object} params.msgData - Message data to duplicate
 * @returns {Promise<Array>} - Array of new message IDs
 */
async function duplicateMessages({ newConversationId, msgData }) {
  const Message = mongoose.models.Message;
  if (!Message || !msgData) {
    return [];
  }

  const newMessageIds = [];
  const messageMap = new Map();

  for (const message of msgData) {
    const oldMessageId = message._id;
    const newMessage = new Message({
      ...message,
      _id: new mongoose.Types.ObjectId(),
      conversationId: newConversationId,
    });

    await newMessage.save();
    newMessageIds.push(newMessage._id);
    messageMap.set(oldMessageId.toString(), newMessage._id);
  }

  return newMessageIds;
}

module.exports = {
  duplicateMessages,
};
