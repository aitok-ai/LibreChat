const accessPermissions = require('./accessPermissions');
const assistants = require('./assistants');
const categories = require('./categories');
const endpoints = require('./endpoints');
const staticRoute = require('./static');
const messages = require('./messages');
const memories = require('./memories');
const presets = require('./presets');
const prompts = require('./prompts');
const balance = require('./balance');
const actions = require('./actions');
const banner = require('./banner');
const search = require('./search');
const models = require('./models');
const convos = require('./convos');
const config = require('./config');
const leaderboard = require('./leaderboard');
const files = require('./files');
const webhooks = require('./webhooks');
const share = require('./share');
const agents = require('./agents');
const roles = require('./roles');
const oauth = require('./oauth');
const tags = require('./tags');
const auth = require('./auth');
const keys = require('./keys');
const user = require('./user');
const mcp = require('./mcp');

module.exports = {
  mcp,
  auth,
  keys,
  user,
  tags,
  roles,
  oauth,
  files,
  share,
  banner,
  agents,
  convos,
  search,
  config,
  models,
  prompts,
  leaderboard,
  assistants,
  webhooks,
  actions,
  presets,
  balance,
  messages,
  memories,
  endpoints,
  categories,
  staticRoute,
  accessPermissions,
};
