const fs = require('fs/promises');
const path = require('path');
const { logger } = require('@librechat/data-schemas');
const paths = require('~/config/paths');

function getJobOutputDir(jobId) {
  return path.join(paths.uploads, 'video_jobs', jobId);
}

function getOutputPaths(jobId) {
  const dir = getJobOutputDir(jobId);
  return {
    dir,
    videoPath: path.join(dir, `${jobId}.mp4`),
    zipPath: path.join(dir, `${jobId}.zip`),
    metadataPath: path.join(dir, 'metadata.json'),
  };
}

async function ensureOutputDir(jobId) {
  const { dir } = getOutputPaths(jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeMetadata(jobId, metadata) {
  const { metadataPath } = getOutputPaths(jobId);
  await ensureOutputDir(jobId);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  return metadataPath;
}

async function ensurePlaceholderZip(jobId) {
  const { zipPath } = getOutputPaths(jobId);
  await ensureOutputDir(jobId);
  try {
    await fs.access(zipPath);
    return zipPath;
  } catch (error) {
    await fs.writeFile(zipPath, 'placeholder', 'utf8');
    logger.warn('[OutputPackagingService] Created placeholder ZIP', { jobId, zipPath });
    return zipPath;
  }
}

module.exports = {
  getOutputPaths,
  ensureOutputDir,
  writeMetadata,
  ensurePlaceholderZip,
};
