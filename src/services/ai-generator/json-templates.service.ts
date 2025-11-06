import cinematicTemplates from './templates/Cinematic Reveal Template.json';
import lifestyleTemplates from './templates/Lifestyle Connection Template.json';
import ugcTemplates from './templates/UGC Templates.json';

export interface DetailedTemplate {
  template_name: string;
  description: string;
  visual_style: string;
  camera: string;
  main_subject: string;
  background: string;
  lighting_mood: string;
  color_palette: string;
  hook: string;
  finale: string;
  keywords: string[];
  negative_prompt: string;
  meta: {
    platform: string;
    duration: string;
    aspect_ratio: string;
    tier: string;
    category: string;
  };
}

export interface TemplateFilters {
  tier?: 'Free' | 'Basic' | 'Pro';
  category?: 'Cinematic Reveal' | 'Lifestyle Connection' | 'UGC';
  keywords?: string[];
}

const allTemplates: DetailedTemplate[] = [
  ...cinematicTemplates,
  ...lifestyleTemplates,
  ...ugcTemplates
];

export function getTemplatesByTier(userTier: string): DetailedTemplate[] {
  const tierHierarchy: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'pro': 2
  };

  const userLevel = tierHierarchy[userTier.toLowerCase()] || 0;

  return allTemplates.filter(template => {
    const templateTier = template.meta.tier.toLowerCase();
    const templateLevel = tierHierarchy[templateTier] || 0;
    return templateLevel <= userLevel;
  });
}

export function getTemplatesByCategory(category: string, userTier?: string): DetailedTemplate[] {
  let filtered = allTemplates.filter(t => t.meta.category === category);

  if (userTier) {
    const tierHierarchy: Record<string, number> = {
      'free': 0,
      'basic': 1,
      'pro': 2
    };
    const userLevel = tierHierarchy[userTier.toLowerCase()] || 0;

    filtered = filtered.filter(template => {
      const templateTier = template.meta.tier.toLowerCase();
      const templateLevel = tierHierarchy[templateTier] || 0;
      return templateLevel <= userLevel;
    });
  }

  return filtered;
}

export function getAllTemplates(): DetailedTemplate[] {
  return allTemplates;
}

export function getTemplateByName(name: string): DetailedTemplate | undefined {
  return allTemplates.find(t => t.template_name === name);
}

export function fillTemplateVariables(template: DetailedTemplate, variables: Record<string, string>): string {
  // Build comprehensive Veo 3 prompt from template structure
  const parts: string[] = [];

  // Main description with variables filled
  let description = template.description;
  Object.entries(variables).forEach(([key, value]) => {
    description = description.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  parts.push(description);

  // Visual style
  parts.push(`Visual style: ${template.visual_style}`);

  // Camera movement
  parts.push(`Camera: ${template.camera}`);

  // Main subject with variables
  let mainSubject = template.main_subject;
  Object.entries(variables).forEach(([key, value]) => {
    mainSubject = mainSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Main subject: ${mainSubject}`);

  // Background
  let background = template.background;
  Object.entries(variables).forEach(([key, value]) => {
    background = background.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Background: ${background}`);

  // Lighting
  parts.push(`Lighting: ${template.lighting_mood}`);

  // Color palette
  let colorPalette = template.color_palette;
  Object.entries(variables).forEach(([key, value]) => {
    colorPalette = colorPalette.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Color palette: ${colorPalette}`);

  // Hook - what happens at the start
  let hook = template.hook;
  Object.entries(variables).forEach(([key, value]) => {
    hook = hook.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Opening: ${hook}`);

  // Finale - what happens at the end
  let finale = template.finale;
  Object.entries(variables).forEach(([key, value]) => {
    finale = finale.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Ending: ${finale}`);

  // Important constraints
  parts.push('CRITICAL: This is a silent video with NO AUDIO, NO SPEECH, NO DIALOGUE, NO VOICEOVER');
  parts.push('No people speaking, no mouths moving, no talking');
  parts.push('No text overlays, no subtitles, no captions in the video itself');

  // Negative prompt
  parts.push(`Avoid: ${template.negative_prompt}, no people talking or speaking, no dialogue, no voiceover, no audio indicators`);

  return parts.join('. ');
}

export function getTemplateCategories(): string[] {
  return ['Cinematic Reveal', 'Lifestyle Connection', 'UGC'];
}

export function getRandomTemplateForTier(tier: string, category?: string): DetailedTemplate {
  let availableTemplates = getTemplatesByTier(tier);

  if (category) {
    availableTemplates = availableTemplates.filter(t => t.meta.category === category);
  }

  if (availableTemplates.length === 0) {
    // Fallback to any template if none available for tier
    availableTemplates = allTemplates;
  }

  const randomIndex = Math.floor(Math.random() * availableTemplates.length);
  return availableTemplates[randomIndex];
}
