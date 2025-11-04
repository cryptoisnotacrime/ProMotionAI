export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  tags?: string;
  vendor?: string;
  product_type?: string;
  body_html?: string;
}

export interface ShopifyImage {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
}

export class ProductsService {
  static async fetchProducts(shop: string, accessToken: string): Promise<ShopifyProduct[]> {
    const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
    const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/shopify-products?shop=${encodeURIComponent(shop)}&limit=250`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.products || [];
  }

  static async fetchProductById(
    shop: string,
    accessToken: string,
    productId: string
  ): Promise<ShopifyProduct> {
    const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
    const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/shopify-products?shop=${encodeURIComponent(shop)}&product_id=${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.product;
  }
}
