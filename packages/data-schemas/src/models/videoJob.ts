import videoJobSchema from '~/schema/videoJob';
import type * as t from '~/types';

export function createVideoJobModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.VideoJob || mongoose.model<t.IVideoJob>('VideoJob', videoJobSchema);
}
