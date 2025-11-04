import { ShopifyProduct } from '../shopify/products.service';
import { Store } from '../../lib/supabase';
import { TemplateInput } from './template.service';

export interface PrefillData {
  callToAction?: string;
  customNotes?: string;
  brandName?: string;
}

export function extractProductInsights(product: ShopifyProduct): {
  suggestedNotes?: string;
} {
  const title = product.title?.toLowerCase() || '';
  const description = product.body_html?.toLowerCase().replace(/<[^>]*>/g, ' ') || '';
  const combined = `${title} ${description}`;

  let suggestedNotes: string | undefined;

  if (combined.includes('luxury') || combined.includes('premium') || combined.includes('elegant')) {
    suggestedNotes = 'Emphasize premium quality and elegant presentation';
  } else if (combined.includes('new') || combined.includes('introducing') || combined.includes('launch')) {
    suggestedNotes = 'Highlight newness and innovation';
  } else if (combined.includes('sale') || combined.includes('discount') || combined.includes('deal')) {
    suggestedNotes = 'Create urgency and excitement';
  } else if (combined.includes('handmade') || combined.includes('artisan') || combined.includes('craft')) {
    suggestedNotes = 'Show craftsmanship details and authentic textures';
  } else if (combined.includes('eco') || combined.includes('sustainable') || combined.includes('organic')) {
    suggestedNotes = 'Emphasize natural elements and eco-friendly aspects';
  } else if (combined.includes('limited') || combined.includes('exclusive')) {
    suggestedNotes = 'Create FOMO with exclusive feel';
  }

  return {
    suggestedNotes,
  };
}

export function prefillFromStoreSettings(store: Store, product: ShopifyProduct): Partial<TemplateInput> {
  const productInsights = extractProductInsights(product);

  const brandName = store.default_brand_name ||
                    (store.shopify_domain ? store.shopify_domain.split('.')[0] : '');

  let callToAction = store.default_call_to_action;
  if (!callToAction && store.shopify_domain) {
    const cleanDomain = store.shopify_domain.replace('.myshopify.com', '');
    if (store.instagram_handle) {
      callToAction = `Shop now @${store.instagram_handle}`;
    } else if (store.tiktok_handle) {
      callToAction = `Find us on TikTok @${store.tiktok_handle}`;
    } else {
      callToAction = `Shop now at ${cleanDomain}.com`;
    }
  }

  let customNotes = productInsights.suggestedNotes;
  if (store.brand_description) {
    customNotes = customNotes
      ? `${customNotes}. Brand style: ${store.brand_description}`
      : store.brand_description;
  }

  return {
    brand_name: brandName,
    final_call_to_action: callToAction,
    custom_notes: customNotes,
  };
}
