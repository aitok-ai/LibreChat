const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { fileConfig: defaultFileConfig, mergeFileConfig } = require('librechat-data-provider');
const getCustomConfig = require('~/server/services/Config/getCustomConfig');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 检查路径设置是否存在
    if (!req.app.locals.paths || !req.app.locals.paths.uploads) {
      return cb(new Error('The path for file uploads is not defined. Please refresh webpage.'));
    }
    // 检查是否有已验证的用户
    if (!req.user || !req.user.id) {
      return cb(new Error('User is not authenticated. Please refresh webpage.'));
    }
    const outputPath = path.join(req.app.locals.paths.uploads, 'temp', req.user.id);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    cb(null, outputPath);
  },
  filename: function (req, file, cb) {
    req.file_id = crypto.randomUUID();
    file.originalname = decodeURIComponent(file.originalname);
    cb(null, `${file.originalname}`);
  },
});

const importFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/json') {
    cb(null, true);
  } else if (path.extname(file.originalname).toLowerCase() === '.json') {
    cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed'), false);
  }
};

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error('No file provided'), false);
  }

  if (!defaultFileConfig.checkType(file.mimetype)) {
    return cb(new Error('Unsupported file type: ' + file.mimetype), false);
  }

  cb(null, true);
};

const createMulterInstance = async () => {
  const customConfig = await getCustomConfig();
  const fileConfig = mergeFileConfig(customConfig?.fileConfig);
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: fileConfig.serverFileSizeLimit },
  });
};

module.exports = { createMulterInstance, storage, importFileFilter };
