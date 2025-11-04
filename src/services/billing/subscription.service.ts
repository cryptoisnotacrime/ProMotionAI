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
}
