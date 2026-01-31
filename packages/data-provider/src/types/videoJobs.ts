export type VideoPlatformPreset = 'douyin' | 'tiktok' | 'xiaohongshu' | 'youtube_shorts';

export type TCreateVideoJobRequest = {
  asset_ids: string[];
  template_type?: string;
  platform_preset?: VideoPlatformPreset;
  prompt?: string;
};

export type TCreateVideoJobResponse = {
  job_id: string;
  stream_id: string;
  status: string;
};

export type TVideoJobStatusResponse = {
  job_id: string;
  stream_id?: string;
  status: string;
  progress?: number;
  steps?: Array<{ id: string; status: string; message?: string }>;
  output?: {
    video?: string | null;
    project_zip?: string | null;
  };
  tail_mark?: {
    enabled: boolean;
    duration_sec: number;
    text: string;
    logo?: string;
  };
  template_type?: string;
  platform_preset?: VideoPlatformPreset;
};
