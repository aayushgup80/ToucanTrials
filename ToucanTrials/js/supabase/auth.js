// ============================================================
// TOUCANTRIALS - AUTHENTICATION + REQUIRED PROFILE
// ============================================================

const ToucanAuth = {
    async signUp(username, email, password) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        if (error) throw error;

        // When email confirmation is disabled, a session exists immediately.
        // Create the profile at the same time so a new account cannot enter
        // the game without a profile row.
        if (data?.user) {
            const { error: profileError } = await supabaseClient.from('profiles').upsert({
                id: data.user.id,
                username: username.trim()
            }, { onConflict: 'id' });
            if (profileError) throw profileError;
        }
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const profile = await this.getProfile(data?.user);
        if (!profile) {
            // Account exists but has no profile: send the player to the
            // mandatory profile setup screen rather than letting them play.
            location.href = 'profile.html';
            throw new Error('PROFILE_REQUIRED');
        }
        return data;
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) return null;
        return data.user;
    },

    async getSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) return null;
        return data.session;
    },

    async getProfile(user = null) {
        user = user || await this.getUser();
        if (!user) return null;
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (error) {
            console.error('Could not read profile:', error);
            return null;
        }
        return data;
    },

    async ensureProfile(username) {
        const user = await this.getUser();
        if (!user) return null;
        const clean = String(username || '').trim();
        if (clean.length < 3 || clean.length > 20) throw new Error('Username must be 3-20 characters.');
        const { data, error } = await supabaseClient.from('profiles').upsert({
            id: user.id,
            username: clean
        }, { onConflict: 'id' }).select().single();
        if (error) throw error;
        return data;
    }
};