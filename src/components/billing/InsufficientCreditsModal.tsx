import { X, Zap, Check, TrendingUp, Crown, AlertCircle } from 'lucide-react';
import { SubscriptionPlan } from '../../lib/supabase';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  creditsNeeded: number;
  creditsAvailable: number;
  plans: SubscriptionPlan[];
  onUpgrade: (planName: string) => void;
  daysUntilRefill?: number;
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentPlan,
  creditsNeeded,
  creditsAvailable,
  plans,
  onUpgrade,
  daysUntilRefill,
}: InsufficientCreditsModalProps) {
  if (!isOpen) return null;

  const sortedPlans = [...plans]
    .filter(p => p.plan_name !== currentPlan)
    .sort((a, b) => {
      const aPrice = typeof a.monthly_price === 'string' ? parseFloat(a.monthly_price) : a.monthly_price;
      const bPrice = typeof b.monthly_price === 'string' ? parseFloat(b.monthly_price) : b.monthly_price;
      return aPrice - bPrice;
    });

  const shortfall = creditsNeeded - creditsAvailable;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Insufficient Credits</h2>
              <p className="text-sm text-gray-600">You need {shortfall} more credits to generate this video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-blue-900">{creditsAvailable} credits</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="capitalize">{currentPlan}</span> Plan
                  {daysUntilRefill && daysUntilRefill > 0 && (
                    <> • Credits refill in {daysUntilRefill} days</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 mb-1">Video Cost</p>
                <p className="text-2xl font-bold text-gray-900">{creditsNeeded} credits</p>
                <p className="text-sm text-red-600 mt-1 font-medium">
                  Short by {shortfall} credits
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upgrade to Continue</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose a plan that fits your needs and start creating more videos immediately.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedPlans.map((plan) => {
                const monthlyPrice = typeof plan.monthly_price === 'string'
                  ? parseFloat(plan.monthly_price)
                  : plan.monthly_price;
                const isPro = plan.plan_name === 'pro';
                const videosYouCouldMake = Math.floor(plan.credits_per_cycle / 4);

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-lg border-2 p-4 ${
                      isPro ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                    }`}
                  >
                    {isPro && (
                      <div className="mb-2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      {isPro ? (
                        <Crown className="w-5 h-5 text-blue-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      )}
                      <h4 className="text-lg font-bold text-gray-900">{plan.display_name}</h4>
                    </div>

                    <div className="mb-3">
                      <span className="text-3xl font-bold text-gray-900">${monthlyPrice}</span>
                      <span className="text-gray-500">/month</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium">{plan.credits_per_cycle} credits/month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>~{videosYouCouldMake} videos per month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Up to {plan.max_video_duration}s videos</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgrade(plan.plan_name)}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                        isPro
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Upgrade to {plan.display_name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-700 hover:text-gray-900 font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
