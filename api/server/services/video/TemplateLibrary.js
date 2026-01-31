const TEMPLATE_LIBRARY = [
  {
    type: 'talking_head',
    label: '口播/解说',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['subtitle_style', 'hook_title', 'broll_density'],
  },
  {
    type: 'product_review',
    label: '种草/好物推荐',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['highlight_count', 'cut_speed', 'cta_style'],
  },
  {
    type: 'storyboard',
    label: '剧情/分镜剪辑',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['scene_count', 'transition_style', 'title_cards'],
  },
  {
    type: 'image_mix',
    label: '图文混剪',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['image_hold_sec', 'zoom_strength', 'caption_position'],
  },
  {
    type: 'broll_subtitles',
    label: 'B-roll + 字幕',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['subtitle_rhythm', 'clip_length', 'font_weight'],
  },
  {
    type: 'beat_cut',
    label: '节奏卡点剪辑',
    duration_sec: 60,
    aspect_ratio: '9:16',
    knobs: ['beat_strength', 'clip_length', 'transition_style'],
  },
];

const DEFAULT_TEMPLATE = TEMPLATE_LIBRARY[0];

const getTemplateByType = (type) => TEMPLATE_LIBRARY.find((template) => template.type === type);

module.exports = {
  TEMPLATE_LIBRARY,
  DEFAULT_TEMPLATE,
  getTemplateByType,
};
