const {
  comparePassword,
  deleteUserById,
  generateToken,
  getUserById,
  updateUser,
  createUser,
  countUsers,
  findUser,
} = require('./userMethods');
// const { getConvoTitle, getConvo, saveConvo, deleteConvos, likeConvo } = require('./Conversation');
// const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
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
const {
  createSession,
  findSession,
  updateExpiration,
  deleteSession,
  deleteAllUserSessions,
  generateRefreshToken,
  countActiveSessions,
} = require('./Session');
const { getConvoTitle, getConvo, saveConvo, deleteConvos, likeConvo } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { createToken, findToken, updateToken, deleteTokens } = require('./Token');
const Balance = require('./Balance');
const User = require('./User');
const Key = require('./Key');

module.exports = {
  comparePassword,
  deleteUserById,
  generateToken,
  getUserById,
  updateUser,
  createUser,
  countUsers,
  findUser,

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

  createToken,
  findToken,
  updateToken,
  deleteTokens,

  createSession,
  findSession,
  updateExpiration,
  deleteSession,
  deleteAllUserSessions,
  generateRefreshToken,
  countActiveSessions,

  User,
  Key,
  Balance,
};
