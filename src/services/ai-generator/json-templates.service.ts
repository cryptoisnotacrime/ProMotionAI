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
  // Return ALL templates so users can see what's available with upgrades
  return allTemplates;
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
  // Helper function to remove URLs from text
  const removeUrls = (text: string): string => {
    // Remove all URLs (http://, https://, ftp://, etc.)
    return text.replace(/https?:\/\/[^\s)]+/gi, '').replace(/\s+/g, ' ').trim();
  };

  // Build comprehensive Veo 3 prompt from template structure
  const parts: string[] = [];

  // Main description with variables filled
  let description = template.description;
  Object.entries(variables).forEach(([key, value]) => {
    description = description.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(removeUrls(description));

  // Visual style
  parts.push(`Visual style: ${template.visual_style}`);

  // Camera movement
  parts.push(`Camera: ${template.camera}`);

  // Main subject with variables
  let mainSubject = template.main_subject;
  Object.entries(variables).forEach(([key, value]) => {
    mainSubject = mainSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Main subject: ${removeUrls(mainSubject)}`);

  // Background
  let background = template.background;
  Object.entries(variables).forEach(([key, value]) => {
    background = background.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Background: ${removeUrls(background)}`);

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
  parts.push(`Opening: ${removeUrls(hook)}`);

  // Finale - what happens at the end
  let finale = template.finale;
  Object.entries(variables).forEach(([key, value]) => {
    finale = finale.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  parts.push(`Ending: ${removeUrls(finale)}`);

  // Important constraints - positive framing
  parts.push('CRITICAL: Silent video format with visual storytelling only');
  parts.push('People remain silent with natural expressions');
  parts.push('Clean visuals without text overlays or subtitles');

  // Negative prompt - descriptive terms only (no instructive language per Google guidelines)
  parts.push(`Negative elements to exclude: ${template.negative_prompt}, people talking or speaking, dialogue, voiceover, audio indicators, mouth movements indicating speech`);

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
