import { Store } from '../../lib/supabase';

export class SubscriptionValidatorService {
  private static readonly GRACE_PERIOD_DAYS = 7;

  static getEffectivePlanName(store: Store): string {
    if (!store) {
      return 'free';
    }

    const isActive = store.subscription_status === 'active';

    if (isActive) {
      return store.plan_name;
    }

    const billingCycleEnd = new Date(store.billing_cycle_end);
    const now = new Date();
    const daysSinceExpiry = Math.floor((now.getTime() - billingCycleEnd.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceExpiry <= this.GRACE_PERIOD_DAYS) {
      return store.plan_name;
    }

    return 'free';
  }

  static isSubscriptionExpired(store: Store): boolean {
    if (!store) {
      return true;
    }

    if (store.subscription_status === 'cancelled') {
      return true;
    }

    const billingCycleEnd = new Date(store.billing_cycle_end);
    const now = new Date();

    return now > billingCycleEnd;
  }

  static getDaysUntilExpiry(store: Store): number {
    if (!store) {
      return 0;
    }

    const billingCycleEnd = new Date(store.billing_cycle_end);
    const now = new Date();

    return Math.floor((billingCycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  static isInGracePeriod(store: Store): boolean {
    if (!store) {
      return false;
    }

    const billingCycleEnd = new Date(store.billing_cycle_end);
    const now = new Date();
    const daysSinceExpiry = Math.floor((now.getTime() - billingCycleEnd.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceExpiry > 0 && daysSinceExpiry <= this.GRACE_PERIOD_DAYS;
  }

  static getSubscriptionStatusMessage(store: Store): { status: string; message: string; color: string } {
    if (!store) {
      return { status: 'inactive', message: 'No subscription', color: 'gray' };
    }

    if (store.subscription_status === 'cancelled') {
      return { status: 'cancelled', message: 'Subscription cancelled', color: 'red' };
    }

    const daysUntilExpiry = this.getDaysUntilExpiry(store);

    if (daysUntilExpiry < 0) {
      if (this.isInGracePeriod(store)) {
        const graceDaysRemaining = this.GRACE_PERIOD_DAYS + daysUntilExpiry;
        return {
          status: 'grace',
          message: `Grace period: ${graceDaysRemaining} day${graceDaysRemaining !== 1 ? 's' : ''} remaining`,
          color: 'yellow'
        };
      }
      return { status: 'expired', message: 'Subscription expired', color: 'red' };
    }

    if (daysUntilExpiry <= 7) {
      return {
        status: 'expiring',
        message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        color: 'yellow'
      };
    }

    return { status: 'active', message: 'Active', color: 'green' };
  }
}
