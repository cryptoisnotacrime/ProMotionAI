import { useState, useEffect } from 'react';
import { ConnectShopify } from './components/auth/ConnectShopify';
import { ShopifyAppBridge } from './components/auth/ShopifyAppBridge';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProductGrid } from './components/product-selector/ProductGrid';
import { SteppedGenerationModal } from './components/product-selector/SteppedGenerationModal';
import { VideoLibrary } from './components/video-library/VideoLibrary';
import { PricingPlans } from './components/billing/PricingPlans';
import { LowCreditBanner } from './components/billing/LowCreditBanner';
import { Settings } from './components/settings/Settings';
import { BusinessDNAOnboarding } from './components/onboarding/BusinessDNAOnboarding';
import { ShopifyAuthService } from './services/shopify/auth.service';
import { ProductsService, ShopifyProduct } from './services/shopify/products.service';
import { VideoGenerationService } from './services/ai-generator/video.service';
import { CreditsService } from './services/billing/credits.service';
import { SubscriptionService } from './services/billing/subscription.service';
import { SubscriptionValidatorService } from './services/billing/subscription-validator.service';
import { AddVideoToShopifyService } from './services/shopify/add-video.service';
import { BrandDNAService } from './services/onboarding/brand-dna.service';
import { Store, GeneratedVideo, SubscriptionPlan } from './lib/supabase';
import { SHOPIFY_CONFIG } from './config/shopify';

type View = 'dashboard' | 'products' | 'library' | 'billing' | 'settings';

function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{
    product: ShopifyProduct;
    imageUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filteredProductId, setFilteredProductId] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (!store) return;

    const processingVideos = videos.filter(
      (v) => v.generation_status === 'processing' || v.generation_status === 'pending'
    );

    if (processingVideos.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        // Poll each processing video to check if Veo job is complete
        for (const video of processingVideos) {
          if (video.veo_job_id) {
            try {
              await VideoGenerationService.pollVideoStatus(video.id);
            } catch (error) {
              console.error(`Failed to poll video ${video.id}:`, error);
            }
          }
        }

        // Refresh videos list
        const updatedVideos = await VideoGenerationService.getVideosByStore(store.id);
        setVideos(updatedVideos);

        const updatedStore = await CreditsService.getStoreInfo(store.id);
        if (updatedStore) {
          setStore(updatedStore);
        }
      } catch (error) {
        console.error('Failed to refresh videos:', error);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [store, videos]);

  const initializeApp = async () => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const host = params.get('host');
    const installed = params.get('installed');
    const embedded = params.get('embedded') === '1' || !!host;
    const hmac = params.get('hmac');
    const sessionToken = params.get('session');
    const chargeId = params.get('charge_id');

    setIsEmbedded(embedded);

    console.log('Initializing app with params:', {
      shop,
      host,
      embedded,
      installed,
      hmac: !!hmac,
      sessionToken: !!sessionToken,
      chargeId: !!chargeId,
      allParams: Object.fromEntries(params.entries()),
      fullUrl: window.location.href
    });

    // Handle billing confirmation callback from Shopify
    if (shop && chargeId) {
      console.log('Handling billing confirmation for charge:', chargeId);
      setIsLoading(true);
      try {
        await SubscriptionService.confirmSubscription(shop, chargeId);
        console.log('Subscription confirmed successfully');

        // Reload store data to get updated subscription status
        const existingStore = await ShopifyAuthService.getStoreByDomain(shop);
        if (existingStore) {
          setStore(existingStore);
          await loadStoreData(existingStore.id, shop, existingStore.access_token || '');
        }

        // Clean up URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('charge_id');
        window.history.replaceState({}, '', cleanUrl.toString());

        // Navigate to billing view to show success
        setCurrentView('billing');
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Failed to confirm subscription:', error);
        setIsLoading(false);
        alert('Failed to confirm subscription. Please try again or contact support.');
      }
    }

    if (shop) {
      try {
        console.log('Looking up store for shop:', shop);

        // If embedded and no 'installed' flag, always initiate OAuth
        // This ensures fresh authentication on app reinstall
        if (embedded && host && !installed) {
          console.log('Embedded app without installed flag - initiating OAuth');

          try {
            const authUrl = await ShopifyAuthService.initiateOAuth(shop, host);
            console.log('Redirecting to OAuth URL');

            const redirectModule = await import('@shopify/app-bridge/actions');
            if ((window as any).shopifyApp) {
              const redirect = redirectModule.Redirect.create((window as any).shopifyApp);
              redirect.dispatch(redirectModule.Redirect.Action.REMOTE, authUrl);
            } else {
              window.open(authUrl, '_top');
            }
          } catch (authError) {
            console.error('Failed to get auth URL:', authError);
            alert('Failed to connect to Shopify. Please check your setup and try again.');
            setIsEmbedded(false);
          }
          return;
        }

        const existingStore = await ShopifyAuthService.getStoreByDomain(shop);
        console.log('Existing store:', existingStore, 'Has token:', !!existingStore?.access_token);

        if (existingStore && existingStore.access_token && installed === 'true') {
          console.log('Store found with access token - loading app');
          setStore(existingStore);

          // Check if onboarding is needed
          const hasCompletedOnboarding = await BrandDNAService.hasCompletedOnboarding(existingStore.id);
          if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
          }

          try {
            await loadStoreData(existingStore.id, shop, existingStore.access_token);
          } catch (error: any) {
            console.error('Failed to load store data:', error);
            // If we get a 401 or 403, the token is invalid - trigger OAuth
            const errorMsg = error?.message || '';
            if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Unauthorized')) {
              console.log('Token invalid, triggering OAuth...');
              if (embedded && host) {
                try {
                  const authUrl = await ShopifyAuthService.initiateOAuth(shop, host);
                  const redirectModule = await import('@shopify/app-bridge/actions');
                  if ((window as any).shopifyApp) {
                    const redirect = redirectModule.Redirect.create((window as any).shopifyApp);
                    redirect.dispatch(redirectModule.Redirect.Action.REMOTE, authUrl);
                  } else {
                    window.open(authUrl, '_top');
                  }
                  return;
                } catch (oauthError) {
                  console.error('Failed to trigger OAuth:', oauthError);
                }
              }
            }
            // Don't throw - show connect page instead
            setIsEmbedded(false);
            return;
          }

          // Clean up URL parameters after successful load
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('installed');
          window.history.replaceState({}, '', cleanUrl.toString());
        } else if (installed === 'true') {
          // Just finished OAuth but store not found yet - retry with multiple attempts
          console.log('Installation complete, retrying store lookup...');
          let retryStore = null;
          let attempts = 0;
          const maxAttempts = 5;

          while (!retryStore && attempts < maxAttempts) {
            attempts++;
            console.log(`Store lookup attempt ${attempts}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            retryStore = await ShopifyAuthService.getStoreByDomain(shop);
            if (retryStore && retryStore.access_token) {
              console.log('Store found successfully!');
              break;
            }
          }

          if (retryStore && retryStore.access_token) {
            setStore(retryStore);
            await loadStoreData(retryStore.id, shop, retryStore.access_token);

            // Clean up URL
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('installed');
            window.history.replaceState({}, '', cleanUrl.toString());
          } else {
            console.error('Store still not found after installation - OAuth may have failed');
            alert('Failed to complete Shopify installation. Please check your Shopify app credentials in Supabase Edge Functions and try again.');
            setIsEmbedded(false);
          }
        } else {
          console.log('Not embedded or missing host - showing connect page');
          setIsEmbedded(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // On error, show the connect page instead of infinite spinner
        setIsEmbedded(false);
      }
    } else {
      console.log('No shop parameter - showing connect page');
      setIsEmbedded(false);
    }
  };

  const handleShopifyCallback = async (shop: string, code: string) => {
    try {
      setIsLoading(true);
      const accessToken = await ShopifyAuthService.exchangeCodeForToken({ shop, code });
      const storeInfo = await ShopifyAuthService.getStoreInfo(shop, accessToken);
      const savedStore = await ShopifyAuthService.saveStoreToDatabase(storeInfo, accessToken);
      setStore(savedStore);
      await loadStoreData(savedStore.id, shop, accessToken);
      window.history.replaceState({}, '', '/');
    } catch (error) {
      console.error('Failed to connect store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingStore = async (shopDomain?: string) => {
    if (shopDomain) {
      const existingStore = await ShopifyAuthService.getStoreByDomain(shopDomain);
      if (existingStore) {
        setStore(existingStore);
        await loadStoreData(existingStore.id, shopDomain, existingStore.access_token || '');
        return;
      }
    }

    const mockShop = 'demo-store.myshopify.com';
    const existingStore = await ShopifyAuthService.getStoreByDomain(mockShop);

    if (existingStore) {
      setStore(existingStore);
      await loadStoreData(existingStore.id, mockShop, existingStore.access_token || '');
    }
  };

  const loadStoreData = async (storeId: string, shop: string, accessToken: string) => {
    const [videosData, plansData] = await Promise.all([
      VideoGenerationService.getVideosByStore(storeId),
      SubscriptionService.getAvailablePlans(),
    ]);

    setVideos(videosData);
    setPlans(plansData);

    if (accessToken) {
      const productsData = await ProductsService.fetchProducts(shop, accessToken);
      setProducts(productsData);
    }
  };

  const handleProductSelect = (product: ShopifyProduct, imageUrl: string) => {
    setSelectedProduct({ product, imageUrl });
  };

  const handleGenerateVideo = async (
    prompt: string,
    duration: number,
    aspectRatio: string,
    templateId?: string,
    templateInputs?: Record<string, any>,
    imageUrls?: string[],
    imageMode?: 'first-last-frame' | 'multiple-angles',
    resolution?: '720p' | '1080p'
  ) => {
    if (!store || !selectedProduct) return;

    try {
      setIsGenerating(true);

      await VideoGenerationService.generateVideo({
        storeId: store.id,
        productId: selectedProduct.product.id,
        productTitle: selectedProduct.product.title,
        imageUrls: imageUrls || [selectedProduct.imageUrl],
        imageMode,
        prompt,
        durationSeconds: duration,
        aspectRatio,
        templateId,
        templateInputs,
        resolution: resolution || '720p',
      });

      const updatedStore = await CreditsService.getStoreInfo(store.id);
      if (updatedStore) {
        setStore(updatedStore);
      }

      const updatedVideos = await VideoGenerationService.getVideosByStore(store.id);
      setVideos(updatedVideos);

      setSelectedProduct(null);
      setCurrentView('library');
    } catch (error) {
      console.error('Failed to generate video:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await VideoGenerationService.deleteVideo(videoId);
      setVideos(videos.filter((v) => v.id !== videoId));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const handleAddToShopify = async (videoId: string) => {
    if (!store) return;
    try {
      await AddVideoToShopifyService.addVideoToProduct(videoId, store.id);
      const updatedVideos = await VideoGenerationService.getVideosByStore(store.id);
      setVideos(updatedVideos);
      alert('Video successfully added to your Shopify product!');
    } catch (error) {
      console.error('Failed to add video to Shopify:', error);
      throw error;
    }
  };

  const handleRefreshVideos = async () => {
    if (!store) return;
    const updatedVideos = await VideoGenerationService.getVideosByStore(store.id);
    setVideos(updatedVideos);
  };

  const handleUpgradePlan = async (planName: string, billingCycle: 'monthly' | 'annual') => {
    if (!store) return;

    try {
      const shop = sessionStorage.getItem('shopify_shop') || store.shop_domain;

      const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL?.startsWith('base64:')
        ? atob(import.meta.env.VITE_Bolt_Database_URL.substring(7))
        : import.meta.env.VITE_Bolt_Database_URL;
      const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY?.startsWith('base64:')
        ? atob(import.meta.env.VITE_Bolt_Database_ANON_KEY.substring(7))
        : import.meta.env.VITE_Bolt_Database_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ shop, planName })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error from create-subscription:', response.status, errorText);
        throw new Error(`Server error: ${response.status}. ${errorText}`);
      }

      const result = await response.json();
      console.log('Create subscription result:', result);

      if (result.error) {
        console.error('Subscription creation error:', result.error);
        throw new Error(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      }

      // Handle free plan response
      if (result.success && planName === 'free') {
        console.log('Successfully switched to free plan');
        // Reload store data
        const updatedStore = await CreditsService.getStoreInfo(store.id);
        if (updatedStore) {
          setStore(updatedStore);
        }
        alert('Successfully switched to Free plan!');
        return;
      }

      if (result.confirmationUrl) {
        console.log('Redirecting to Shopify billing confirmation:', result.confirmationUrl);
        window.top!.location.href = result.confirmationUrl;
      } else {
        console.error('No confirmation URL in result:', result);
        throw new Error('No confirmation URL received from server');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create subscription: ${errorMessage}`);
    }
  };

  const handleSaveSettings = async (settings: Partial<Store>) => {
    if (!store) return;

    const { supabase } = await import('./lib/supabase');
    const { error } = await supabase
      .from('stores')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', store.id);

    if (error) {
      throw new Error(`Failed to save settings: ${error.message}`);
    }

    const updatedStore = await CreditsService.getStoreInfo(store.id);
    if (updatedStore) {
      setStore(updatedStore);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const host = params.get('host');

  if (!store) {
    if (isEmbedded) {
      return (
        <ShopifyAppBridge apiKey={SHOPIFY_CONFIG.clientId}>
          <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Connecting to Shopify...</h2>
              <p className="text-gray-400 mb-4">Please wait while we authenticate your store.</p>
              <p className="text-sm text-gray-500">
                If this takes too long, please refresh the page.
              </p>
            </div>
          </div>
        </ShopifyAppBridge>
      );
    }
    return <ConnectShopify onConnect={() => {}} />;
  }

  const appContent = (
    <div className="min-h-screen bg-gray-950">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as View)}
        creditsRemaining={store.credits_remaining}
        creditsTotal={store.credits_total}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <LowCreditBanner
          creditsRemaining={store.credits_remaining}
          planName={store.plan_name}
          onUpgrade={() => setCurrentView('billing')}
        />
      </div>

      <main className={currentView === 'billing' ? 'py-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {currentView === 'dashboard' && (
          <Dashboard
            store={store}
            videos={videos}
            onUpgrade={() => setCurrentView('billing')}
            onNavigateToProducts={() => setCurrentView('products')}
            onNavigateToVideoLibrary={() => setCurrentView('library')}
          />
        )}

        {currentView === 'products' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Select a Product</h1>
              <p className="text-gray-400 mt-1">
                Choose a product image to generate a video
              </p>
            </div>
            <ProductGrid
              products={products}
              onSelectProduct={handleProductSelect}
              isLoading={isLoading}
              videos={videos}
              onViewVideos={(productId) => {
                setFilteredProductId(productId);
                setCurrentView('library');
              }}
            />
          </div>
        )}

        {currentView === 'library' && (
          <VideoLibrary
            videos={videos}
            onDelete={handleDeleteVideo}
            onRefresh={handleRefreshVideos}
            onAddToShopify={handleAddToShopify}
            planName={store.plan_name}
            filteredProductId={filteredProductId}
            onClearFilter={() => setFilteredProductId(null)}
          />
        )}

        {currentView === 'billing' && (
          <PricingPlans
            plans={plans}
            currentPlanName={store.plan_name}
            onSelectPlan={handleUpgradePlan}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            store={store}
            onSave={handleSaveSettings}
            onRestartOnboarding={() => setShowOnboarding(true)}
          />
        )}
      </main>

      {selectedProduct && (
        <SteppedGenerationModal
          product={selectedProduct.product}
          imageUrl={selectedProduct.imageUrl}
          creditsAvailable={store.credits_remaining}
          maxDuration={
            plans.find(p => p.plan_name === SubscriptionValidatorService.getEffectivePlanName(store))?.max_video_duration || 4
          }
          planName={SubscriptionValidatorService.getEffectivePlanName(store).charAt(0).toUpperCase() + SubscriptionValidatorService.getEffectivePlanName(store).slice(1)}
          store={store}
          onGenerate={handleGenerateVideo}
          onClose={() => setSelectedProduct(null)}
          isGenerating={isGenerating}
        />
      )}

      {showOnboarding && (
        <BusinessDNAOnboarding
          store={store}
          onComplete={async (brandDNA) => {
            setShowOnboarding(false);
            if (brandDNA) {
              // Reload store data to get updated brand DNA
              const updatedStore = await CreditsService.getStoreInfo(store.id);
              if (updatedStore) {
                setStore(updatedStore);
              }
            }
          }}
        />
      )}
    </div>
  );

  if (isEmbedded && host) {
    return (
      <ShopifyAppBridge apiKey={SHOPIFY_CONFIG.clientId}>
        {appContent}
      </ShopifyAppBridge>
    );
  }

  return appContent;
}

export default App;
