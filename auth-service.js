/**
 * Authentication Service
 * Handles Supabase authentication and user session management
 */

class AuthService {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.sessionKey = 'wahgola_session';
    this.initialized = false;
  }

  /**
   * Initialize Supabase client
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load Supabase config (with cache busting to ensure fresh config)
      const response = await fetch(`/config.js?v=${Date.now()}`);
      const configText = await response.text();
      eval(configText);

      const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SUPABASE_CONFIG || {};

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured - running in offline mode');
        return;
      }

      // Initialize Supabase client with session persistence
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true, // Automatically refresh expired tokens
          detectSessionInUrl: true // Handle OAuth redirects
        }
      });

      // Check for existing session and validate it
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Session validation error:', error);
        // Clear stale session data
        await this.clearStaleSession();
      } else if (session) {
        // Validate session hasn't expired
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt && expiresAt < now) {
          console.log('Session expired, clearing...');
          await this.clearStaleSession();
        } else {
          this.currentUser = session.user;
          await this.syncUserToDatabase();
        }
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          this.currentUser = null;
          await this.clearStaleSession();
          this.onAuthChange?.(null);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (session) {
            this.currentUser = session.user;
            await this.syncUserToDatabase();
            this.onAuthChange?.(this.currentUser);
          }
        } else if (session) {
          this.currentUser = session.user;
          await this.syncUserToDatabase();
          this.onAuthChange?.(this.currentUser);
        } else {
          this.currentUser = null;
          this.onAuthChange?.(null);
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    if (!this.supabase) {
      throw new Error('Authentication not available in offline mode');
    }

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard-v2.html',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email (magic link)
   */
  async signInWithEmail(email) {
    if (!this.supabase) {
      throw new Error('Authentication not available in offline mode');
    }

    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard-v2.html',
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    if (!this.supabase) return;

    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    this.currentUser = null;
    await this.clearStaleSession();
  }

  /**
   * Clear stale session data from localStorage
   */
  async clearStaleSession() {
    // Clear custom session key
    localStorage.removeItem(this.sessionKey);

    // Clear Supabase session keys (they use specific prefixes)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Also clear from sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        sessionStorage.removeItem(key);
      }
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * Also verifies the session is still valid
   */
  async isAuthenticated() {
    if (!this.currentUser || !this.supabase) return false;

    // Verify session is still valid
    const { data: { session } } = await this.supabase.auth.getSession();

    if (!session) {
      // Session expired or invalid
      this.currentUser = null;
      await this.clearStaleSession();
      return false;
    }

    return true;
  }

  /**
   * Synchronous check (without validation)
   * Use this only when you can't await
   */
  isAuthenticatedSync() {
    return !!this.currentUser;
  }

  /**
   * Sync user data to Neon database
   */
  async syncUserToDatabase() {
    if (!this.currentUser) return;

    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          supabaseUserId: this.currentUser.id,
          email: this.currentUser.email,
          displayName: this.currentUser.user_metadata?.full_name || this.currentUser.email,
          avatarUrl: this.currentUser.user_metadata?.avatar_url
        })
      });

      if (!response.ok) {
        console.error('Failed to sync user to database');
      }
    } catch (error) {
      console.error('User sync error:', error);
    }
  }

  /**
   * Get access token for API requests
   */
  async getAccessToken() {
    if (!this.supabase || !this.currentUser) return null;

    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token;
  }

  /**
   * Register auth state change callback
   */
  onAuthStateChange(callback) {
    this.onAuthChange = callback;
  }
}

// Export singleton instance
const authService = new AuthService();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  authService.init().catch(console.error);
}
