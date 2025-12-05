import { AlertTriangle, X, Zap, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface LowCreditBannerProps {
  creditsRemaining: number;
  planName: string;
  onUpgrade: () => void;
}

type BannerLevel = 'warning' | 'critical' | 'emergency' | null;

export function LowCreditBanner({ creditsRemaining, planName, onUpgrade }: LowCreditBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const getBannerLevel = (): BannerLevel => {
    if (creditsRemaining === 0) return 'emergency';
    if (creditsRemaining <= 10) return 'critical';
    if (creditsRemaining <= 20) return 'warning';
    return null;
  };

  const level = getBannerLevel();

  if (!level || isDismissed) return null;

  const videosRemaining = Math.floor(creditsRemaining / 4);

  const config = {
    warning: {
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-700',
      textColor: 'text-yellow-200',
      iconColor: 'text-yellow-400',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-500',
      title: 'Running Low on Credits',
      message: `You have ${creditsRemaining} credits left (about ${videosRemaining} videos). Consider upgrading to keep creating.`,
    },
    critical: {
      bgColor: 'bg-orange-900/30',
      borderColor: 'border-orange-700',
      textColor: 'text-orange-200',
      iconColor: 'text-orange-400',
      buttonBg: 'bg-orange-600 hover:bg-orange-500',
      title: 'Credits Almost Depleted',
      message: `Only ${creditsRemaining} credits remaining! Upgrade now to avoid interruptions in your video generation.`,
    },
    emergency: {
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-700',
      textColor: 'text-red-200',
      iconColor: 'text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-500',
      title: 'Out of Credits',
      message: 'You have no credits left. Upgrade your plan to continue generating videos.',
    },
  };

  const currentConfig = config[level];
  const canDismiss = level !== 'emergency';

  return (
    <div className={`${currentConfig.bgColor} border ${currentConfig.borderColor} rounded-lg p-4 shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className={`w-5 h-5 ${currentConfig.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${currentConfig.textColor} mb-1`}>
            {currentConfig.title}
          </h3>
          <p className={`text-sm ${currentConfig.textColor}`}>
            {currentConfig.message}
          </p>
          {planName === 'free' && (
            <p className="text-xs mt-2 text-gray-400">
              Upgrade to Basic for 50 credits/month or Pro for 100 credits/month
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUpgrade}
            className={`${currentConfig.buttonBg} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
            <ArrowRight className="w-4 h-4" />
          </button>
          {canDismiss && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
