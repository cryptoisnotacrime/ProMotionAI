export async function getShopFromSession(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop');

  if (shop) {
    sessionStorage.setItem('shopify_shop', shop);
    return shop;
  }

  const storedShop = sessionStorage.getItem('shopify_shop');
  return storedShop;
}

export function setShopifyHeaders(): Record<string, string> {
  const shop = sessionStorage.getItem('shopify_shop');

  if (!shop) {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    if (shopParam) {
      sessionStorage.setItem('shopify_shop', shopParam);
      return { 'x-shopify-shop': shopParam };
    }
  }

  return shop ? { 'x-shopify-shop': shop } : {};
}

export function clearShopSession(): void {
  sessionStorage.removeItem('shopify_shop');
}
