export enum QueryKeys {
  messages = 'messages',
  allConversations = 'allConversations',
  conversation = 'conversation',
  searchEnabled = 'searchEnabled',
  user = 'user',
  name = 'name', // user key name
  models = 'models',
  balance = 'balance',
  endpoints = 'endpoints',
  presets = 'presets',
  searchResults = 'searchResults',
  tokenCount = 'tokenCount',
  availablePlugins = 'availablePlugins',
  startupConfig = 'startupConfig',
  assistants = 'assistants',
  assistant = 'assistant',
  userById = 'userById',
  recommendations = 'recommendations',
  numOfReferrals = 'numOfReferrals',
  likedConversations = 'likedConversations',
  publicConversatons = 'publicConversatons',
  endpointsConfigOverride = 'endpointsConfigOverride',
  files = 'files',
}

export enum MutationKeys {
  imageUpload = 'imageUpload',
  fileDelete = 'fileDelete',
  updatePreset = 'updatePreset',
  deletePreset = 'deletePreset',
  logoutUser = 'logoutUser',
  avatarUpload = 'avatarUpload',
}