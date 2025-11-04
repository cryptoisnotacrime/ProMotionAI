import { supabase, SubscriptionPlan } from '../../lib/supabase';

export class SubscriptionService {
  static async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return data || [];
  }

  static async getPlanByName(planName: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_name', planName)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    return data;
  }

  static async upgradePlan(
    storeId: string,
    newPlanName: string,
    billingCycle: 'monthly' | 'annual'
  ): Promise<void> {
    const plan = await this.getPlanByName(newPlanName);

    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + (billingCycle === 'annual' ? 12 : 1));

    const { error } = await supabase
      .from('stores')
      .update({
        plan_name: newPlanName,
        credits_remaining: plan.credits_per_cycle,
        credits_total: plan.credits_per_cycle,
        billing_cycle_start: now.toISOString(),
        billing_cycle_end: cycleEnd.toISOString(),
        subscription_status: 'active',
        updated_at: now.toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to upgrade plan: ${error.message}`);
    }
  }

  static async cancelSubscription(storeId: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  static async renewSubscription(storeId: string): Promise<void> {
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('plan_name')
      .eq('id', storeId)
      .maybeSingle();

    if (fetchError || !store) {
      throw new Error('Store not found');
    }

    const plan = await this.getPlanByName(store.plan_name);

    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    const { error } = await supabase
      .from('stores')
      .update({
        credits_remaining: plan.credits_per_cycle,
        credits_total: plan.credits_per_cycle,
        billing_cycle_start: now.toISOString(),
        billing_cycle_end: cycleEnd.toISOString(),
        subscription_status: 'active',
        updated_at: now.toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to renew subscription: ${error.message}`);
    }
  }

  static async confirmSubscription(shop: string, chargeId: string): Promise<void> {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, access_token, plan_name')
      .eq('shop_domain', shop)
      .maybeSingle();

    if (storeError || !store || !store.access_token) {
      throw new Error('Store not found or missing access token');
    }

    const query = `
      query {
        node(id: "${chargeId}") {
          ... on AppSubscription {
            id
            name
            status
            currentPeriodEnd
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    price {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': store.access_token,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const subscription = result.data?.node;
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new Error('Subscription not active');
    }

    const plan = await this.getPlanByName(store.plan_name);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const cycleEnd = new Date(subscription.currentPeriodEnd || now);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    const { error } = await supabase
      .from('stores')
      .update({
        shopify_subscription_id: chargeId,
        subscription_status: 'active',
        subscription_confirmed_at: now.toISOString(),
        billing_cycle_start: now.toISOString(),
        billing_cycle_end: cycleEnd.toISOString(),
        credits_remaining: plan.credits_per_cycle,
        credits_total: plan.credits_per_cycle,
        updated_at: now.toISOString(),
      })
      .eq('id', store.id);

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }
}
