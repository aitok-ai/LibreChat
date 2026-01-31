const { GenerationJobManager } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { File, VideoJob } = require('~/db/models');
const {
  getOutputPaths,
  writeMetadata,
  ensurePlaceholderZip,
} = require('./video/OutputPackagingService');
const { DEFAULT_TEMPLATE, getTemplateByType } = require('./video/TemplateLibrary');

const PER_FILE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
const TOTAL_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'audio/mpeg',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'image/jpeg',
  'image/png',
]);

function generateId(prefix = 'job') {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;
}

class VideoJobService {
  static getAudioMixRule(platformPreset = 'default') {
    switch (platformPreset) {
      case 'douyin':
      case 'tiktok':
        return { preset: platformPreset, bgm_db: -16, voice_db: -4, ducking_db: -8, lufs: -14 };
      case 'xiaohongshu':
        return { preset: platformPreset, bgm_db: -18, voice_db: -3, ducking_db: -10, lufs: -13 };
      case 'youtube_shorts':
        return { preset: platformPreset, bgm_db: -15, voice_db: -5, ducking_db: -6, lufs: -15 };
      default:
        return { preset: 'default', bgm_db: -12, voice_db: -3, ducking_db: -6, lufs: -14 };
    }
  }

  static ensureAssetsWithinLimits(files) {
    let totalBytes = 0;
    for (const file of files) {
      if (typeof file.bytes !== 'number') {
        throw new Error('Missing file size metadata');
      }
      if (file.bytes > PER_FILE_LIMIT_BYTES) {
        throw new Error('Asset exceeds per-file size limit');
      }
      totalBytes += file.bytes;
    }
    if (totalBytes > TOTAL_LIMIT_BYTES) {
      throw new Error('Assets exceed total allowed size');
    }
  }

  static mapAssetType(mime) {
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('image/')) return 'image';
    return 'asset';
  }

  static async createVideoJob({ userId, asset_ids, template_type, platform_preset, prompt }) {
    if (!userId) {
      throw new Error('Missing user context');
    }
    if (!Array.isArray(asset_ids) || asset_ids.length === 0) {
      throw new Error('Assets are required');
    }

    const files = await File.find({
      file_id: { $in: asset_ids },
      user: userId,
    }).lean();

    if (files.length !== asset_ids.length) {
      throw new Error('One or more assets not found');
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported asset type');
      }
    }

    this.ensureAssetsWithinLimits(files);

    const selectedTemplate = getTemplateByType(template_type) ?? DEFAULT_TEMPLATE;
    const job_id = generateId('video');
    const stream_id = job_id;
    const audioMix = this.getAudioMixRule(platform_preset);

    const outputPaths = getOutputPaths(job_id);

    const doc = new VideoJob({
      job_id,
      stream_id,
      user: userId,
      template_type: selectedTemplate.type,
      platform_preset,
      aspect_ratio: selectedTemplate.aspect_ratio,
      duration_sec: selectedTemplate.duration_sec,
      assets: files.map((file) => ({
        file_id: file.file_id,
        type: this.mapAssetType(file.type),
        path: file.filepath,
        bytes: file.bytes,
        mime: file.type,
        filename: file.filename,
      })),
      prompt,
      status: 'queued',
      progress: 0,
      steps: [],
      audio_mix_rule: audioMix,
      tail_mark: { enabled: true, duration_sec: 2, text: 'Powered by MetaData', logo: 'default' },
      resolve_project_archive: true,
      output: { video: outputPaths.videoPath, project_zip: outputPaths.zipPath },
    });

    await doc.save();

    await GenerationJobManager.createJob(stream_id, userId, stream_id);
    await GenerationJobManager.updateMetadata(stream_id, {
      jobType: 'video',
      jobId: job_id,
      template_type,
      platform_preset,
    });

    await writeMetadata(job_id, {
      job_id,
      stream_id,
      template_type: selectedTemplate.type,
      platform_preset,
      assets: doc.assets,
    });

    logger.info('[VideoJobService] Created video job', { job_id, stream_id, userId });
    return { job_id, stream_id, status: doc.status };
  }

  static async getVideoJob(id) {
    const d = await VideoJob.findOne({ job_id: id }).lean();
    if (!d) return null;
    return {
      job_id: d.job_id,
      stream_id: d.stream_id,
      status: d.status,
      progress: d.progress || 0,
      steps: d.steps || [],
      output: d.output || {},
      tail_mark: d.tail_mark,
      template_type: d.template_type,
      platform_preset: d.platform_preset,
    };
  }

  static async cancelVideoJob(id) {
    const d = await VideoJob.findOne({ job_id: id });
    if (!d) return false;
    if (d.status === 'completed' || d.status === 'canceled') return false;
    if (d.stream_id) {
      await GenerationJobManager.abortJob(d.stream_id);
    }
    d.status = 'canceled';
    await d.save();
    return true;
  }

  static async getOutputZipPath(id) {
    const d = await VideoJob.findOne({ job_id: id }).lean();
    if (!d) return null;
    if (d.output?.project_zip) {
      return d.output.project_zip;
    }
    const zipPath = await ensurePlaceholderZip(id);
    await VideoJob.updateOne({ job_id: id }, { $set: { 'output.project_zip': zipPath } });
    return zipPath;
  }
}

module.exports = VideoJobService;
