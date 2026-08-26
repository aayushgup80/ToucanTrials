const ToucanScores = {

    async saveRun({
        levelId,
        completionTimeMs,
        coinsCollected
    }) {

        const user =
            await ToucanAuth.getUser();

        if (!user) {

            console.log(
                "Guest run: not saving."
            );

            return {
                saved: false,
                reason: "not_authenticated"
            };
        }


        const safeTime =
            Math.max(
                0,
                Math.floor(
                    Number(completionTimeMs) || 0
                )
            );


        const safeCoins =
            Math.max(
                0,
                Math.floor(
                    Number(coinsCollected) || 0
                )
            );


        const {
            data,
            error
        } = await supabaseClient
            .from("runs")
            .insert({

                user_id: user.id,

                level_id: levelId,

                completion_time_ms:
                    safeTime,

                coins_collected:
                    safeCoins,

                completed:
                    true

            })
            .select()
            .single();


        if (error) {
            throw error;
        }


        return {
            saved: true,
            run: data
        };

    },


    async getPersonalBest(levelId) {

        const user =
            await ToucanAuth.getUser();

        if (!user) {
            return null;
        }


        const {
            data,
            error
        } = await supabaseClient
            .rpc(
                "get_personal_best",
                {
                    p_level_id: levelId
                }
            );


        if (error) {
            throw error;
        }


        return data;

    },


    async getTotalCoins() {

        const user =
            await ToucanAuth.getUser();

        if (!user) {
            return 0;
        }


        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("total_coins")
            .eq("id", user.id)
            .single();


        if (error) {
            throw error;
        }


        return Number(
            data.total_coins || 0
        );

    }

};


window.ToucanScores =
    ToucanScores;