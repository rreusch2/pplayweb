// Web-based RevenueCat integration for user ID linking
// This ensures web users are properly linked to RevenueCat before purchases

interface RevenueCatConfig {
  publicApiKey: string;
}

class RevenueCatWebService {
  private config: RevenueCatConfig | null = null;
  private initialized = false;

  /**
   * Initialize RevenueCat for web
   * This should be called when user signs up or signs in
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Get RevenueCat public API key from environment
      const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️ RevenueCat Web API key not configured');
        return;
      }

      this.config = { publicApiKey: apiKey };
      
      // Create RevenueCat customer via API to establish user ID link
      await this.createOrUpdateCustomer(userId);
      
      this.initialized = true;
      console.log('✅ RevenueCat Web initialized for user:', userId);
      
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat Web:', error);
      // Don't throw - this shouldn't break the signup flow
    }
  }

  /**
   * Create or update a RevenueCat customer to establish user ID mapping
   */
  private async createOrUpdateCustomer(userId: string): Promise<void> {
    try {
      console.log('🔗 Linking user to RevenueCat:', userId);
      
      // Call our backend to create/update RevenueCat customer
      const response = await fetch('/api/revenuecat/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`RevenueCat API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ RevenueCat customer created/updated:', data);
      
    } catch (error) {
      console.error('❌ Failed to create RevenueCat customer:', error);
      throw error;
    }
  }

  /**
   * Update user's RevenueCat customer ID in Supabase profile
   */
  async updateProfileWithRevenueCatId(userId: string, revenueCatId: string): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('profiles')
        .update({ 
          revenuecat_customer_id: revenueCatId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to update profile with RevenueCat ID:', error);
      } else {
        console.log('✅ Profile updated with RevenueCat ID:', revenueCatId);
      }
    } catch (error) {
      console.error('❌ Error updating profile with RevenueCat ID:', error);
    }
  }

  /**
   * Check if RevenueCat is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const revenueCatWeb = new RevenueCatWebService();
export default revenueCatWeb;
