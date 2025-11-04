import { ShopifyProduct } from '../shopify/products.service';

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  style: string;
  motion: string;
}

export function generatePromptSuggestions(product: ShopifyProduct): PromptSuggestion[] {
  const productType = product.product_type?.toLowerCase() || '';
  const title = product.title;
  const tagsString = product.tags || '';
  const tagsArray = tagsString ? tagsString.toLowerCase().split(',').map(t => t.trim()) : [];
  const vendor = product.vendor;
  const description = product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200) || '';

  const hasTag = (keywords: string[]) =>
    tagsArray.some(tag => keywords.some(keyword => tag.includes(keyword)));

  const isApparel = productType.includes('apparel') || productType.includes('clothing') ||
                    hasTag(['fashion', 'apparel', 'clothing', 'shirt', 'dress', 'pants']);

  const isElectronics = productType.includes('electronics') || productType.includes('tech') ||
                        hasTag(['electronics', 'tech', 'gadget', 'device']);

  const isBeauty = productType.includes('beauty') || productType.includes('cosmetic') ||
                   hasTag(['beauty', 'makeup', 'skincare', 'cosmetic']);

  const isFood = productType.includes('food') || productType.includes('beverage') ||
                 hasTag(['food', 'drink', 'beverage', 'snack']);

  const isHome = productType.includes('home') || productType.includes('decor') ||
                 hasTag(['home', 'decor', 'furniture', 'interior']);

  const isJewelry = productType.includes('jewelry') || productType.includes('jewellery') ||
                    hasTag(['jewelry', 'ring', 'necklace', 'bracelet']);

  const suggestions: PromptSuggestion[] = [];

  if (isApparel) {
    suggestions.push(
      {
        id: 'apparel-lifestyle',
        label: 'Lifestyle Showcase',
        prompt: `A lifestyle video featuring the ${title}, showing the garment in motion with natural fabric flow. Soft, natural lighting emphasizes texture and fit. Smooth camera movement captures the product from multiple flattering angles. Professional fashion photography aesthetic with a clean, modern vibe.`,
        style: 'lifestyle',
        motion: 'slow-pan'
      },
      {
        id: 'apparel-detail',
        label: 'Detail Focus',
        prompt: `Close-up detail shots of ${title} highlighting fabric texture, stitching quality, and unique design elements. Cinematic lighting reveals the craftsmanship. Gentle zoom movements draw attention to premium details. High-end fashion commercial style.`,
        style: 'elegant',
        motion: 'zoom-in'
      }
    );
  }

  if (isElectronics) {
    suggestions.push(
      {
        id: 'electronics-tech',
        label: 'Tech Showcase',
        prompt: `Modern tech video of ${title} with sleek, minimalist presentation. Clean white or dark background. Dynamic lighting highlights the product's design and features. Smooth rotation reveals all angles. Professional product photography with a premium tech aesthetic. Emphasize innovation and quality.`,
        style: 'elegant',
        motion: 'rotate'
      },
      {
        id: 'electronics-dynamic',
        label: 'Dynamic Feature',
        prompt: `High-energy video showcasing ${title} with dynamic camera movements. Modern, vibrant setting. Quick cuts and zoom effects highlight key features and capabilities. Tech-forward aesthetic with energetic pacing. Perfect for demonstrating innovation and performance.`,
        style: 'dynamic',
        motion: 'zoom-in'
      }
    );
  }

  if (isBeauty) {
    suggestions.push(
      {
        id: 'beauty-luxe',
        label: 'Luxury Beauty',
        prompt: `Elegant beauty commercial for ${title} with soft, flattering lighting. Dreamy, sophisticated atmosphere with gentle bokeh effects. Slow, graceful camera movements. Premium cosmetics aesthetic emphasizing quality and elegance. Warm, inviting color palette.`,
        style: 'elegant',
        motion: 'slow-pan'
      },
      {
        id: 'beauty-fresh',
        label: 'Fresh & Vibrant',
        prompt: `Fresh, vibrant showcase of ${title} with bright, clean lighting. Modern beauty aesthetic with pops of color. Dynamic reveals highlighting product texture and packaging. Energetic yet elegant presentation perfect for skincare and cosmetics.`,
        style: 'dynamic',
        motion: 'reveal'
      }
    );
  }

  if (isFood) {
    suggestions.push(
      {
        id: 'food-appetizing',
        label: 'Appetizing Showcase',
        prompt: `Mouth-watering food video of ${title} with warm, appetizing lighting. Natural, rustic or modern setting depending on product style. Slow camera movements reveal delicious details. Professional food photography aesthetic that makes viewers crave the product. Rich colors and textures.`,
        style: 'lifestyle',
        motion: 'slow-pan'
      }
    );
  }

  if (isHome) {
    suggestions.push(
      {
        id: 'home-cozy',
        label: 'Cozy Living',
        prompt: `Warm, inviting showcase of ${title} in a beautifully styled home setting. Natural light creates a cozy atmosphere. Smooth camera movements show the product in context. Interior design aesthetic emphasizing comfort and style. Perfect for home decor and furniture.`,
        style: 'lifestyle',
        motion: 'slow-pan'
      }
    );
  }

  if (isJewelry) {
    suggestions.push(
      {
        id: 'jewelry-luxury',
        label: 'Luxury Shine',
        prompt: `Luxurious jewelry video of ${title} with dramatic lighting that captures sparkle and brilliance. Dark, elegant background emphasizes the precious metals and stones. Slow rotation reveals craftsmanship from every angle. High-end jewelry commercial aesthetic. Emphasize elegance and quality.`,
        style: 'elegant',
        motion: 'rotate'
      }
    );
  }

  suggestions.push(
    {
      id: 'showcase-clean',
      label: 'Clean Product Showcase',
      prompt: `Professional product video of ${title} with clean, minimal background. Studio lighting perfectly illuminates every detail. Smooth 360-degree rotation shows all angles. Premium commercial aesthetic emphasizing quality and craftsmanship. Perfect for e-commerce.`,
      style: 'showcase',
      motion: 'rotate'
    },
    {
      id: 'showcase-hero',
      label: 'Hero Shot',
      prompt: `Cinematic hero shot of ${title} with dramatic lighting and composition. ${vendor ? `Reflecting ${vendor}'s brand identity with` : 'Featuring'} premium production values. Slow, deliberate camera movement creates anticipation. High-impact commercial aesthetic perfect for landing pages and ads.`,
      style: 'elegant',
      motion: 'reveal'
    },
    {
      id: 'lifestyle-action',
      label: 'In-Action',
      prompt: `Dynamic lifestyle video showing ${title} in real-world use. Natural, authentic setting with genuine interaction. Camera captures the product from natural, engaging angles. Relatable and aspirational aesthetic that connects with customers emotionally.`,
      style: 'lifestyle',
      motion: 'slow-pan'
    }
  );

  const hasMultipleColors = description.toLowerCase().includes('color') ||
                            description.toLowerCase().includes('available in');

  if (hasMultipleColors && suggestions.length < 6) {
    suggestions.push({
      id: 'variety-showcase',
      label: 'Color Variety',
      prompt: `Showcase video highlighting ${title} with smooth transitions between color options. Clean, modern presentation emphasizes product versatility. Consistent lighting across all variants. Professional e-commerce aesthetic perfect for showing product range.`,
      style: 'showcase',
      motion: 'slow-pan'
    });
  }

  return suggestions.slice(0, 6);
}

export function customizePrompt(
  basePrompt: string,
  product: ShopifyProduct,
  options: {
    emphasizeQuality?: boolean;
    emphasizeBrand?: boolean;
    emphasizeFeatures?: boolean;
  } = {}
): string {
  let prompt = basePrompt;

  if (options.emphasizeQuality) {
    prompt += ' Emphasize premium quality and craftsmanship with detailed close-ups.';
  }

  if (options.emphasizeBrand && product.vendor) {
    prompt += ` Reflect ${product.vendor}'s brand identity and aesthetic throughout the video.`;
  }

  if (options.emphasizeFeatures && product.body_html) {
    const features = extractKeyFeatures(product.body_html);
    if (features.length > 0) {
      prompt += ` Highlight key features: ${features.slice(0, 2).join(' and ')}.`;
    }
  }

  return prompt;
}

function extractKeyFeatures(html: string): string[] {
  const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
  const features: string[] = [];

  const featureKeywords = [
    'waterproof', 'wireless', 'rechargeable', 'organic', 'handmade',
    'sustainable', 'eco-friendly', 'premium', 'luxury', 'professional',
    'durable', 'lightweight', 'portable', 'adjustable', 'versatile'
  ];

  featureKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      features.push(keyword);
    }
  });

  return features;
}
