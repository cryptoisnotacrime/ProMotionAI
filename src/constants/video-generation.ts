export interface VideoOption {
  value: string;
  label: string;
  description: string;
  example?: string;
}

export const CAMERA_MOVEMENTS: VideoOption[] = [
  {
    value: 'static',
    label: 'Static Shot',
    description: 'Camera remains completely still with no movement',
    example: 'Static shot of a serene landscape'
  },
  {
    value: 'pan_left',
    label: 'Pan Left',
    description: 'Camera rotates horizontally left from a fixed position',
    example: 'Slow pan left across a city skyline at dusk'
  },
  {
    value: 'pan_right',
    label: 'Pan Right',
    description: 'Camera rotates horizontally right from a fixed position',
    example: 'Pan right revealing the product lineup'
  },
  {
    value: 'tilt_up',
    label: 'Tilt Up',
    description: 'Camera rotates vertically upward from a fixed position',
    example: 'Tilt up from the product base to reveal full height'
  },
  {
    value: 'tilt_down',
    label: 'Tilt Down',
    description: 'Camera rotates vertically downward from a fixed position',
    example: 'Tilt down from the character\'s face to the revealing letter'
  },
  {
    value: 'dolly_in',
    label: 'Dolly In',
    description: 'Camera physically moves closer to the subject',
    example: 'Slow dolly in toward the product on pedestal'
  },
  {
    value: 'dolly_out',
    label: 'Dolly Out',
    description: 'Camera physically moves away from the subject',
    example: 'Dolly out to reveal the complete scene'
  },
  {
    value: 'truck_left',
    label: 'Truck Left',
    description: 'Camera moves horizontally (sideways) to the left, parallel to the subject',
    example: 'Truck left, following the product display'
  },
  {
    value: 'truck_right',
    label: 'Truck Right',
    description: 'Camera moves horizontally (sideways) to the right, parallel to the subject',
    example: 'Truck right, following the character walking along a sidewalk'
  },
  {
    value: 'pedestal_up',
    label: 'Pedestal Up',
    description: 'Camera moves vertically upward while maintaining level perspective',
    example: 'Pedestal up to reveal the full height of the product'
  },
  {
    value: 'pedestal_down',
    label: 'Pedestal Down',
    description: 'Camera moves vertically downward while maintaining level perspective',
    example: 'Pedestal down to ground level with the product'
  },
  {
    value: 'zoom_in',
    label: 'Zoom In',
    description: 'Lens changes focal length to magnify the subject (camera doesn\'t move)',
    example: 'Slow zoom in on product details'
  },
  {
    value: 'zoom_out',
    label: 'Zoom Out',
    description: 'Lens changes focal length to de-magnify the subject (camera doesn\'t move)',
    example: 'Zoom out revealing the full context'
  },
  {
    value: 'crane_shot',
    label: 'Crane Shot',
    description: 'Camera mounted on crane moves vertically or in sweeping arcs',
    example: 'Crane shot revealing a vast scene from above'
  },
  {
    value: 'aerial_drone',
    label: 'Aerial/Drone Shot',
    description: 'High altitude shot with smooth, flying movements',
    example: 'Sweeping aerial drone shot flying over the scene'
  },
  {
    value: 'handheld',
    label: 'Handheld',
    description: 'Camera held by operator with natural, less stable movements for realism',
    example: 'Handheld camera shot during a dynamic marketplace scene'
  },
  {
    value: 'whip_pan',
    label: 'Whip Pan',
    description: 'Extremely fast pan that blurs the image, used as transition',
    example: 'Whip pan from one product to another'
  },
  {
    value: 'arc_shot',
    label: 'Arc Shot',
    description: 'Camera moves in a circular or semi-circular path around the subject',
    example: 'Arc shot around the product on display'
  },
  {
    value: 'orbit',
    label: 'Orbit',
    description: 'Smooth 360-degree rotation around the central subject',
    example: 'Orbit motion around central axis with slight tilt'
  },
];

export const LENS_EFFECTS: VideoOption[] = [
  {
    value: 'wide_angle',
    label: 'Wide-Angle Lens',
    description: 'Captures broader field of view, exaggerates perspective',
    example: 'Wide-angle lens shot of grand interior, emphasizing soaring arches'
  },
  {
    value: 'telephoto',
    label: 'Telephoto Lens',
    description: 'Narrows field of view, compresses perspective, creates shallow depth',
    example: 'Telephoto lens shot capturing distant subject against mountains'
  },
  {
    value: 'shallow_dof',
    label: 'Shallow Depth of Field',
    description: 'Only narrow plane in focus, foreground/background blurred (bokeh effect)',
    example: 'Portrait with shallow depth of field, face sharp against blurred background'
  },
  {
    value: 'deep_dof',
    label: 'Deep Depth of Field',
    description: 'Most or all of image from foreground to background in sharp focus',
    example: 'Landscape with deep depth of field, sharp detail from front to back'
  },
  {
    value: 'lens_flare',
    label: 'Lens Flare',
    description: 'Light source creates streaks, starbursts, or circles in the image',
    example: 'Cinematic lens flare as sun dips below horizon'
  },
  {
    value: 'rack_focus',
    label: 'Rack Focus',
    description: 'Focus shifts from one subject/plane to another within single shot',
    example: 'Rack focus from character\'s face to photograph on wall'
  },
  {
    value: 'fisheye',
    label: 'Fisheye Lens',
    description: 'Ultra-wide lens with extreme barrel distortion, circular panoramic image',
    example: 'Fisheye lens view from inside car, capturing driver and curved dashboard'
  },
  {
    value: 'vertigo_effect',
    label: 'Vertigo Effect (Dolly Zoom)',
    description: 'Dolly and zoom in opposite directions, changes background perspective dramatically',
    example: 'Vertigo effect on character at cliff edge, background rushing away'
  },
];

export const LIGHTING_MOODS: VideoOption[] = [
  {
    value: 'golden_hour',
    label: 'Golden Hour',
    description: 'Warm, soft sunlight during sunrise or sunset',
    example: 'Product bathed in golden hour light'
  },
  {
    value: 'natural_light',
    label: 'Natural Light',
    description: 'Daylight from windows or outdoors, realistic and balanced',
    example: 'Natural window light illuminating the scene'
  },
  {
    value: 'neon_glow',
    label: 'Neon Glow',
    description: 'Vibrant colored lighting with electric aesthetic',
    example: 'Electric blue neon backlight with rim accents'
  },
  {
    value: 'dramatic',
    label: 'Dramatic',
    description: 'High contrast with strong shadows and highlights',
    example: 'Dramatic directional beam creating shadows'
  },
  {
    value: 'soft_diffused',
    label: 'Soft Diffused',
    description: 'Even, gentle lighting without harsh shadows',
    example: 'Soft diffused light with smooth reflections'
  },
  {
    value: 'spotlight',
    label: 'Spotlight',
    description: 'Focused beam of light highlighting specific subject',
    example: 'Soft spotlight from above on product'
  },
  {
    value: 'backlit',
    label: 'Backlit',
    description: 'Light source behind subject creating silhouette or rim light',
    example: 'Backlight diffusion with highlight bloom'
  },
  {
    value: 'rim_light',
    label: 'Rim Light',
    description: 'Edge lighting that outlines the subject',
    example: 'Golden rim light with subtle bloom'
  },
  {
    value: 'volumetric',
    label: 'Volumetric Lighting',
    description: 'Light beams visible through atmosphere (god rays)',
    example: 'Volumetric light rays through misty air'
  },
];

export const VISUAL_STYLES: VideoOption[] = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Film-quality with dramatic composition and lighting',
    example: 'Cinematic lighting with high detail realism'
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Premium, high-end aesthetic with elegant presentation',
    example: 'Luxury minimalism with refined details'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean, simple aesthetic with intentional white space',
    example: 'Minimal studio with clean composition'
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    description: 'Natural, relatable scenes showing authentic use',
    example: 'Warm lifestyle realism with natural setting'
  },
  {
    value: 'commercial',
    label: 'Commercial',
    description: 'Professional advertising aesthetic, polished and clean',
    example: 'High-end commercial tone with perfect lighting'
  },
  {
    value: 'documentary',
    label: 'Documentary',
    description: 'Authentic, realistic style with natural camera work',
    example: 'Warm documentary tone with natural camera shake'
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Contemporary aesthetic with current design trends',
    example: 'Modern neon tech with reflective surfaces'
  },
  {
    value: 'vintage',
    label: 'Vintage',
    description: 'Retro aesthetic with period-appropriate styling',
    example: 'Vintage film grain with warm color grading'
  },
];

export const ASPECT_RATIOS: VideoOption[] = [
  {
    value: '9:16',
    label: '9:16 (Vertical)',
    description: 'Optimized for Instagram Reels, TikTok, YouTube Shorts',
    example: 'Mobile-first vertical video format'
  },
  {
    value: '16:9',
    label: '16:9 (Horizontal)',
    description: 'Standard for YouTube, Facebook, website embeds',
    example: 'Widescreen landscape video format'
  },
];

export const BACKGROUNDS: VideoOption[] = [
  {
    value: 'studio',
    label: 'Studio',
    description: 'Controlled environment with neutral backdrop',
    example: 'Clean studio with seamless white background'
  },
  {
    value: 'outdoor',
    label: 'Outdoor',
    description: 'Natural exterior settings with environmental elements',
    example: 'Outdoor garden scene with natural depth'
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    description: 'Real-world settings like home, cafe, or workplace',
    example: 'Cozy home interior with natural light'
  },
  {
    value: 'abstract',
    label: 'Abstract',
    description: 'Artistic, non-realistic backgrounds with shapes and colors',
    example: 'Abstract gradient with geometric patterns'
  },
  {
    value: 'natural',
    label: 'Natural',
    description: 'Organic outdoor environments',
    example: 'Natural forest setting with dappled sunlight'
  },
  {
    value: 'urban',
    label: 'Urban',
    description: 'City environments with modern architecture',
    example: 'Urban street scene with city lights'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple, uncluttered backgrounds',
    example: 'Pure white gradient with subtle texture'
  },
];

export const TONES: VideoOption[] = [
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Premium, elegant, sophisticated',
    example: 'High-end luxury presentation'
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'Confident, striking, attention-grabbing',
    example: 'Bold dramatic energy'
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean, simple, understated',
    example: 'Minimal refined aesthetic'
  },
  {
    value: 'warm',
    label: 'Warm',
    description: 'Friendly, inviting, comfortable',
    example: 'Warm relatable atmosphere'
  },
  {
    value: 'futuristic',
    label: 'Futuristic',
    description: 'Modern, tech-forward, innovative',
    example: 'Futuristic tech aesthetic'
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Fun, energetic, lighthearted',
    example: 'Playful vibrant energy'
  },
];
