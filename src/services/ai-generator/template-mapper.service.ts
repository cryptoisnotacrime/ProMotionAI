import {
  CAMERA_MOVEMENTS,
  LENS_EFFECTS,
  LIGHTING_MOODS,
  BACKGROUNDS,
  TONES,
  VISUAL_STYLES,
  VideoOption
} from '../../constants/video-generation';

interface TemplateMappingRules {
  keywords: string[];
  value: string;
}

const CAMERA_MAPPING: TemplateMappingRules[] = [
  { keywords: ['static', 'locked', 'fixed', 'still', 'stationary'], value: 'static' },
  { keywords: ['handheld', 'hand-held', 'shaky', 'operator', 'vlog'], value: 'handheld' },
  { keywords: ['dolly in', 'push in', 'move closer', 'approach', 'advancing'], value: 'dolly_in' },
  { keywords: ['dolly out', 'pull back', 'move away', 'retreat', 'revealing'], value: 'dolly_out' },
  { keywords: ['orbit', 'rotate', '360', 'circular', 'revolve', 'around'], value: 'orbit' },
  { keywords: ['pan left', 'panning left', 'sweep left'], value: 'pan_left' },
  { keywords: ['pan right', 'panning right', 'sweep right'], value: 'pan_right' },
  { keywords: ['tilt up', 'tilting up', 'angle up'], value: 'tilt_up' },
  { keywords: ['tilt down', 'tilting down', 'angle down'], value: 'tilt_down' },
  { keywords: ['truck left', 'tracking left', 'strafe left'], value: 'truck_left' },
  { keywords: ['truck right', 'tracking right', 'strafe right'], value: 'truck_right' },
  { keywords: ['zoom in', 'zooming in', 'close up'], value: 'zoom_in' },
  { keywords: ['zoom out', 'zooming out', 'wide'], value: 'zoom_out' },
  { keywords: ['crane', 'jib', 'boom'], value: 'crane_shot' },
  { keywords: ['aerial', 'drone', 'overhead', 'bird'], value: 'aerial_drone' },
  { keywords: ['whip pan', 'fast pan', 'rapid pan'], value: 'whip_pan' },
  { keywords: ['arc', 'semi-circle'], value: 'arc_shot' },
  { keywords: ['pedestal up', 'rise up'], value: 'pedestal_up' },
  { keywords: ['pedestal down', 'lower down'], value: 'pedestal_down' },
];

const VISUAL_MAPPING: TemplateMappingRules[] = [
  { keywords: ['cinematic', 'film', 'movie', 'dramatic composition'], value: 'cinematic' },
  { keywords: ['luxury', 'premium', 'elegant', 'high-end', 'refined'], value: 'luxury' },
  { keywords: ['minimal', 'minimalist', 'clean', 'simple'], value: 'minimal' },
  { keywords: ['lifestyle', 'real', 'authentic', 'natural', 'everyday'], value: 'lifestyle' },
  { keywords: ['commercial', 'advertising', 'polished', 'professional'], value: 'commercial' },
  { keywords: ['documentary', 'realistic', 'genuine', 'candid'], value: 'documentary' },
  { keywords: ['modern', 'contemporary', 'current', 'trendy'], value: 'modern' },
  { keywords: ['vintage', 'retro', 'classic', 'old-school'], value: 'vintage' },
  { keywords: ['mobile', 'phone', 'selfie', 'ugc', 'user-generated'], value: 'documentary' },
];

const LIGHTING_MAPPING: TemplateMappingRules[] = [
  { keywords: ['golden hour', 'golden', 'sunset', 'sunrise', 'warm sunlight'], value: 'golden_hour' },
  { keywords: ['natural', 'daylight', 'window', 'ambient'], value: 'natural_light' },
  { keywords: ['neon', 'electric', 'colored', 'vibrant lights'], value: 'neon_glow' },
  { keywords: ['dramatic', 'contrast', 'shadow', 'moody', 'dark'], value: 'dramatic' },
  { keywords: ['soft', 'diffused', 'gentle', 'even', 'flattering'], value: 'soft_diffused' },
  { keywords: ['spotlight', 'focused', 'beam', 'stage'], value: 'spotlight' },
  { keywords: ['backlit', 'backlight', 'silhouette', 'behind'], value: 'backlit' },
  { keywords: ['rim light', 'edge light', 'outline', 'halo'], value: 'rim_light' },
  { keywords: ['volumetric', 'god rays', 'light rays', 'atmospheric'], value: 'volumetric' },
  { keywords: ['ring light', 'ring-light', 'circular light'], value: 'soft_diffused' },
];

const BACKGROUND_MAPPING: TemplateMappingRules[] = [
  { keywords: ['studio', 'seamless', 'backdrop', 'controlled', 'neutral'], value: 'studio' },
  { keywords: ['outdoor', 'outside', 'exterior', 'garden', 'park'], value: 'outdoor' },
  { keywords: ['lifestyle', 'home', 'bedroom', 'living', 'cafe', 'real world'], value: 'lifestyle' },
  { keywords: ['abstract', 'geometric', 'shapes', 'gradient', 'artistic'], value: 'abstract' },
  { keywords: ['natural', 'nature', 'forest', 'organic', 'environment'], value: 'natural' },
  { keywords: ['urban', 'city', 'street', 'architecture', 'building'], value: 'urban' },
  { keywords: ['minimal', 'simple', 'plain', 'white', 'clean'], value: 'minimal' },
];

const TONE_MAPPING: TemplateMappingRules[] = [
  { keywords: ['luxury', 'elegant', 'sophisticated', 'premium', 'high-end'], value: 'luxury' },
  { keywords: ['bold', 'confident', 'striking', 'dramatic', 'powerful'], value: 'bold' },
  { keywords: ['minimal', 'simple', 'clean', 'understated', 'refined'], value: 'minimal' },
  { keywords: ['warm', 'friendly', 'inviting', 'comfortable', 'cozy'], value: 'warm' },
  { keywords: ['futuristic', 'modern', 'tech', 'innovative', 'advanced'], value: 'futuristic' },
  { keywords: ['playful', 'fun', 'energetic', 'lighthearted', 'vibrant'], value: 'playful' },
];

const LENS_MAPPING: TemplateMappingRules[] = [
  { keywords: ['wide angle', 'wide-angle', 'broad', 'expansive'], value: 'wide_angle' },
  { keywords: ['telephoto', 'narrow', 'compressed'], value: 'telephoto' },
  { keywords: ['shallow', 'bokeh', 'blur', 'depth of field', 'dof'], value: 'shallow_dof' },
  { keywords: ['deep', 'sharp', 'focus', 'crisp'], value: 'deep_dof' },
  { keywords: ['lens flare', 'flare', 'sun flare', 'light streak'], value: 'lens_flare' },
  { keywords: ['rack focus', 'focus shift', 'focus pull'], value: 'rack_focus' },
  { keywords: ['fisheye', 'distorted', 'curved'], value: 'fisheye' },
  { keywords: ['vertigo', 'dolly zoom', 'hitchcock'], value: 'vertigo_effect' },
];

function findBestMatch(templateValue: string, mappingRules: TemplateMappingRules[]): string | null {
  const lowerValue = templateValue.toLowerCase();

  for (const rule of mappingRules) {
    for (const keyword of rule.keywords) {
      if (lowerValue.includes(keyword)) {
        return rule.value;
      }
    }
  }

  return null;
}

function fallbackMatch(templateValue: string, constantArray: VideoOption[]): string {
  const normalized = templateValue.toLowerCase().replace(/\s+/g, '_');

  const exactMatch = constantArray.find(item =>
    item.value === normalized ||
    item.label.toLowerCase() === templateValue.toLowerCase() ||
    item.value.replace(/_/g, ' ') === templateValue.toLowerCase()
  );

  if (exactMatch) {
    return exactMatch.value;
  }

  return constantArray[0]?.value || normalized;
}

export class TemplateMappingService {
  static mapCameraMovement(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, CAMERA_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, CAMERA_MOVEMENTS);
  }

  static mapVisualStyle(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, VISUAL_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, VISUAL_STYLES);
  }

  static mapLighting(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, LIGHTING_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, LIGHTING_MOODS);
  }

  static mapBackground(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, BACKGROUND_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, BACKGROUNDS);
  }

  static mapTone(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, TONE_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, TONES);
  }

  static mapLensEffect(templateValue: string): string {
    const keywordMatch = findBestMatch(templateValue, LENS_MAPPING);
    if (keywordMatch) return keywordMatch;

    return fallbackMatch(templateValue, LENS_EFFECTS);
  }

  static getCategoryDefaults(category: string): {
    visualStyle: string;
    camera: string;
    lighting: string;
    background: string;
    tone: string;
    lensEffect: string;
  } {
    const defaults = {
      UGC: {
        visualStyle: 'documentary',
        camera: 'handheld',
        lighting: 'natural_light',
        background: 'lifestyle',
        tone: 'warm',
        lensEffect: 'shallow_dof',
      },
      'Cinematic Reveal': {
        visualStyle: 'cinematic',
        camera: 'dolly_in',
        lighting: 'dramatic',
        background: 'studio',
        tone: 'luxury',
        lensEffect: 'shallow_dof',
      },
      'Lifestyle Connection': {
        visualStyle: 'lifestyle',
        camera: 'static',
        lighting: 'natural_light',
        background: 'lifestyle',
        tone: 'warm',
        lensEffect: 'deep_dof',
      },
    };

    return defaults[category as keyof typeof defaults] || defaults['Lifestyle Connection'];
  }
}
