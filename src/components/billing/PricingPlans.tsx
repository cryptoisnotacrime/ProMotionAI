import { Check, X, Zap, TrendingUp, Crown, Gift } from 'lucide-react';
import { SubscriptionPlan } from '../../lib/supabase';
import { useState } from 'react';

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  currentPlanName: string;
  onSelectPlan: (planName: string, billingCycle: 'monthly' | 'annual') => void;
}

export function PricingPlans({ plans, currentPlanName, onSelectPlan }: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const sortedPlans = [...plans].sort((a, b) => {
    const aPrice = typeof a.monthly_price === 'string' ? parseFloat(a.monthly_price) : a.monthly_price;
    const bPrice = typeof b.monthly_price === 'string' ? parseFloat(b.monthly_price) : b.monthly_price;
    return aPrice - bPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Transform Your Products Into Engaging Videos
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of Shopify merchants using AI to boost conversions with stunning product videos
        </p>

        <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {sortedPlans.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800">No plans available. Please check your database configuration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = plan.plan_name === currentPlanName;
            const isPro = plan.plan_name === 'pro';

            const monthlyPrice = typeof plan.monthly_price === 'string'
              ? parseFloat(plan.monthly_price)
              : plan.monthly_price;
            const annualPrice = typeof plan.annual_price === 'string'
              ? parseFloat(plan.annual_price)
              : plan.annual_price;

            const price = billingCycle === 'annual' && annualPrice > 0
              ? Math.round(annualPrice / 12)
              : monthlyPrice;
            const savings = billingCycle === 'annual' && annualPrice > 0
              ? monthlyPrice * 12 - annualPrice
              : 0;

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                price={price}
                billingCycle={billingCycle}
                savings={savings}
                isCurrentPlan={isCurrentPlan}
                isPro={isPro}
                onSelect={onSelectPlan}
              />
            );
          })}
        </div>
      )}

      <div>
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Compare Plans
        </h3>
        <FeatureComparison plans={sortedPlans} currentPlanName={currentPlanName} />
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="bg-white bg-opacity-20 rounded-full p-4 flex-shrink-0">
            <Zap className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4">Why merchants love ProMotionAI</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">🎬 Professional Quality</div>
                <div className="text-blue-100">AI-powered videos that match your brand</div>
              </div>
              <div>
                <div className="font-semibold mb-1">⚡ Lightning Fast</div>
                <div className="text-blue-100">Generate videos in seconds, not hours</div>
              </div>
              <div>
                <div className="font-semibold mb-1">📈 Proven Results</div>
                <div className="text-blue-100">Average 40% increase in conversion rates</div>
              </div>
              <div>
                <div className="font-semibold mb-1">💰 Cost Effective</div>
                <div className="text-blue-100">No expensive videographers or equipment</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800 text-center">
          <strong>Development Note:</strong> Payment processing integration with Stripe/Shopify Billing is in progress.
          Plan upgrades are currently instant for testing purposes.
        </p>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  price: number;
  billingCycle: 'monthly' | 'annual';
  savings: number;
  isCurrentPlan: boolean;
  isPro: boolean;
  onSelect: (planName: string, billingCycle: 'monthly' | 'annual') => void;
}

function PlanCard({ plan, price, billingCycle, savings, isCurrentPlan, isPro, onSelect }: PlanCardProps) {
  const isFree = plan.plan_name === 'free';

  const getPlanIcon = () => {
    if (isFree) return <Gift className="w-6 h-6 text-gray-600" />;
    if (isPro) return <Crown className="w-6 h-6 text-blue-600" />;
    return <TrendingUp className="w-6 h-6 text-green-600" />;
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-6 relative transition-all hover:shadow-xl ${
        isPro
          ? 'border-blue-600 shadow-lg scale-105 mt-6'
          : isCurrentPlan
          ? 'border-green-500 mt-6'
          : 'border-gray-200'
      }`}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}

      {isCurrentPlan && !isPro && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            CURRENT PLAN
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {getPlanIcon()}
        <h3 className="text-2xl font-bold text-gray-900">{plan.display_name}</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-gray-900">${price.toFixed(0)}</span>
          <span className="text-gray-500 text-base">/month</span>
        </div>
        {billingCycle === 'annual' && savings > 0 && (
          <p className="text-sm text-green-600 font-medium mt-2">
            Save ${savings.toFixed(0)}/year
          </p>
        )}
        {isFree && (
          <p className="text-sm text-gray-500 mt-2">Perfect to get started</p>
        )}
      </div>

      <button
        onClick={() => onSelect(plan.plan_name, billingCycle)}
        disabled={isCurrentPlan}
        className={`w-full py-3 rounded-xl font-semibold transition-all mb-6 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isPro
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105'
            : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : isFree ? 'Get Started Free' : 'Upgrade Now'}
      </button>

      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-blue-600" />
          </div>
          <span>{plan.credits_per_cycle} video credits/month</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-blue-600" />
          </div>
          <span>Up to {plan.max_video_duration}s videos</span>
        </div>
        {Array.isArray(plan.features) && plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-blue-600" />
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FeatureComparisonProps {
  plans: SubscriptionPlan[];
  currentPlanName: string;
}

function FeatureComparison({ plans, currentPlanName }: FeatureComparisonProps) {
  const features = [
    { name: 'Monthly Credits', key: 'credits' },
    { name: 'Max Video Length', key: 'duration' },
    { name: 'Basic AI Prompts', values: { free: true, basic: true, pro: true } },
    { name: 'Advanced AI Prompts', values: { free: false, basic: true, pro: true } },
    { name: 'Style Customization', values: { free: false, basic: true, pro: true } },
    { name: 'Product Focus Control', values: { free: false, basic: true, pro: true } },
    { name: 'Priority Processing', values: { free: false, basic: false, pro: true } },
    { name: 'Custom Branding', values: { free: false, basic: false, pro: true } },
    { name: 'Bulk Generation', values: { free: false, basic: false, pro: true } },
    { name: 'Style Presets', values: { free: false, basic: false, pro: true } },
    { name: 'Add to Shopify Products', values: { free: false, basic: false, pro: true } },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-6 py-4 text-center">
                  <div className="text-sm font-bold text-gray-900">{plan.display_name}</div>
                  {plan.plan_name === currentPlanName && (
                    <div className="text-xs text-green-600 font-semibold mt-1">Current</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.map((feature, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {feature.key === 'credits' ? (
                      <span className="text-sm font-semibold text-gray-900">{plan.credits_per_cycle}</span>
                    ) : feature.key === 'duration' ? (
                      <span className="text-sm font-semibold text-gray-900">{plan.max_video_duration}s</span>
                    ) : feature.values?.[plan.plan_name as keyof typeof feature.values] ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
