import { supabase, Store, CreditTransaction } from '../../lib/supabase';

export class CreditsService {
  static async checkCredits(storeId: string): Promise<number> {
    const { data, error } = await supabase
      .from('stores')
      .select('credits_remaining')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check credits: ${error.message}`);
    }

    return data?.credits_remaining || 0;
  }

  static async deductCredits(
    storeId: string,
    amount: number,
    videoId?: string,
    description?: string
  ): Promise<void> {
    const currentCredits = await this.checkCredits(storeId);

    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    const newCredits = currentCredits - amount;

    const { error: updateError } = await supabase
      .from('stores')
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (updateError) {
      throw new Error(`Failed to deduct credits: ${updateError.message}`);
    }

    await this.recordTransaction({
      store_id: storeId,
      video_id: videoId,
      transaction_type: 'usage',
      credits_amount: -amount,
      credits_before: currentCredits,
      credits_after: newCredits,
      description: description || 'Video generation credit usage',
    });
  }

  static async addCredits(
    storeId: string,
    amount: number,
    type: 'purchase' | 'grant' | 'refund' = 'grant',
    description?: string
  ): Promise<void> {
    const currentCredits = await this.checkCredits(storeId);
    const newCredits = currentCredits + amount;

    const { error: updateError } = await supabase
      .from('stores')
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (updateError) {
      throw new Error(`Failed to add credits: ${updateError.message}`);
    }

    await this.recordTransaction({
      store_id: storeId,
      transaction_type: type,
      credits_amount: amount,
      credits_before: currentCredits,
      credits_after: newCredits,
      description: description || 'Credits added',
    });
  }

  private static async recordTransaction(
    transaction: Omit<CreditTransaction, 'id' | 'created_at' | 'metadata'>
  ): Promise<void> {
    const { error } = await supabase.from('credit_transactions').insert({
      ...transaction,
      metadata: {},
    });

    if (error) {
      console.error('Failed to record transaction:', error);
    }
  }

  static async getTransactionHistory(storeId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data || [];
  }

  static async getStoreInfo(storeId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch store info: ${error.message}`);
    }

    return data;
  }
}
