import type { Document, Types } from 'mongoose';

export type VideoJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export type VideoJobAsset = {
  file_id: string;
  type: 'video' | 'audio' | 'image' | 'asset';
  path?: string;
  bytes?: number;
  mime?: string;
  filename?: string;
};

export type VideoJobStep = {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
};

export type VideoJobAudioMixRule = {
  preset: 'douyin' | 'tiktok' | 'xiaohongshu' | 'youtube_shorts' | 'default';
  bgm_db: number;
  voice_db: number;
  ducking_db: number;
  lufs: number;
};

export type VideoJobTailMark = {
  enabled: boolean;
  duration_sec: number;
  text: string;
  logo?: string;
};

export type VideoJobOutput = {
  video?: string | null;
  project_zip?: string | null;
};

export type VideoJob = {
  job_id: string;
  stream_id?: string;
  user: Types.ObjectId;
  template_type?: string;
  platform_preset?: 'douyin' | 'tiktok' | 'xiaohongshu' | 'youtube_shorts';
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  duration_sec?: number;
  assets: VideoJobAsset[];
  prompt?: string;
  status: VideoJobStatus;
  progress?: number;
  steps?: VideoJobStep[];
  audio_mix_rule?: VideoJobAudioMixRule;
  tail_mark?: VideoJobTailMark;
  resolve_project_archive?: boolean;
  output?: VideoJobOutput;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IVideoJob = VideoJob &
  Document & {
    _id: Types.ObjectId;
  };
