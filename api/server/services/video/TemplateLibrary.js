const TEMPLATE_LIBRARY = [
  {
    type: 'talking_head',
    label: 'com_ui_video_template_talking_head',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'hook_title', 'broll_density'],
  },
  {
    type: 'product_review',
    label: 'com_ui_video_template_product_review',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'hook_title', 'broll_density'],
  },
  {
    type: 'storyboard',
    label: 'com_ui_video_template_storyboard',
    duration_sec: 30,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'broll_density'],
  },
  {
    type: 'image_mix',
    label: 'com_ui_video_template_image_mix',
    duration_sec: 15,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'broll_density'],
  },
  {
    type: 'broll_subtitles',
    label: 'com_ui_video_template_broll_subtitles',
    duration_sec: 30,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'broll_density'],
  },
  {
    type: 'beat_cut',
    label: 'com_ui_video_template_beat_cut',
    duration_sec: 15,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'broll_density'],
  },
];

const DEFAULT_TEMPLATE = TEMPLATE_LIBRARY[0];

const getTemplateByType = (type) => TEMPLATE_LIBRARY.find((template) => template.type === type);

module.exports = {
  TEMPLATE_LIBRARY,
  DEFAULT_TEMPLATE,
  getTemplateByType,
};
