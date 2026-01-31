import mongoose, { Schema } from 'mongoose';
import type { IVideoJob } from '~/types';

const assetSchema = new Schema(
  {
    file_id: { type: String, required: true },
    type: { type: String, required: true },
    path: { type: String },
    bytes: { type: Number },
    mime: { type: String },
    filename: { type: String },
  },
  { _id: false },
);

const stepSchema = new Schema(
  {
    id: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String },
  },
  { _id: false },
);

const audioMixSchema = new Schema(
  {
    preset: { type: String, required: true },
    bgm_db: { type: Number, required: true },
    voice_db: { type: Number, required: true },
    ducking_db: { type: Number, required: true },
    lufs: { type: Number, required: true },
  },
  { _id: false },
);

const tailMarkSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    duration_sec: { type: Number, default: 2 },
    text: { type: String, default: 'Powered by MetaData' },
    logo: { type: String },
  },
  { _id: false },
);

const outputSchema = new Schema(
  {
    video: { type: String, default: null },
    project_zip: { type: String, default: null },
  },
  { _id: false },
);

const videoJobSchema = new Schema<IVideoJob>(
  {
    job_id: { type: String, required: true, unique: true, index: true },
    stream_id: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    template_type: { type: String },
    platform_preset: { type: String },
    aspect_ratio: { type: String, default: '9:16' },
    duration_sec: { type: Number, default: 60 },
    assets: { type: [assetSchema], default: [] },
    prompt: { type: String },
    status: {
      type: String,
      required: true,
      default: 'queued',
    },
    progress: { type: Number, default: 0 },
    steps: { type: [stepSchema], default: [] },
    audio_mix_rule: { type: audioMixSchema },
    tail_mark: { type: tailMarkSchema },
    resolve_project_archive: { type: Boolean, default: true },
    output: { type: outputSchema, default: () => ({}) },
  },
  { timestamps: true },
);

videoJobSchema.index({ createdAt: 1, updatedAt: 1 });

export default videoJobSchema;
