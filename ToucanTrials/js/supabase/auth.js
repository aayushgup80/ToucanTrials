// ============================================================
// TOUCANTRIALS - AUTHENTICATION
// ============================================================

const ToucanAuth = {

    async signUp(username, email, password) {

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) {
            throw error;
        }

        return data;
    },


    async signIn(email, password) {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        return data;
    },


    async signOut() {

        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

    },


    async getUser() {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            return null;
        }

        return data.user;
    },


    async getSession() {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            return null;
        }

        return data.session;
    }

};