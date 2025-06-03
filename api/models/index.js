const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
const { comparePassword } = require('./userMethods');
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
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

module.exports = {
  ...methods,
  comparePassword,
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,

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
};
