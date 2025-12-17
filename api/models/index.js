const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
const { comparePassword } = require('./userMethods');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
  getMessagesCount,
  likeMessage,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos, likeConvo } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { File } = require('~/db/models');

const seedDatabase = async () => {
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  await methods.ensureDefaultCategories();
};

module.exports = {
  ...methods,
  seedDatabase,
  comparePassword,

  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
  likeMessage,

  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,
  likeConvo,

  getMessagesCount,
  getPreset,
  getPresets,
  savePreset,
  deletePresets,

  Files: File,
};
