// ============================================================
// TOUCANTRIALS - PLAYER SKIN SYSTEM
// ============================================================

const PLAYER_SKINS = {

    // --------------------------------------------------------
    // DEFAULT
    // --------------------------------------------------------
    default_toucan: {
        id: "default_toucan",
        name: "Default Toucan",

        bodyColor: new BABYLON.Color3(1.0, 0.65, 0.05),
        emissiveColor: new BABYLON.Color3(0.12, 0.04, 0.0),

        scale: 1.0,

        // Buffs
        speedMultiplier: 1.0,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.0
    },

    // --------------------------------------------------------
    // FIRST SKIN
    // --------------------------------------------------------
    jungle_runner: {
        id: "jungle_runner",
        name: "Jungle Runner",

        bodyColor: new BABYLON.Color3(0.15, 0.8, 0.35),
        emissiveColor: new BABYLON.Color3(0.02, 0.12, 0.04),

        scale: 1.02,

        // Small speed buff
        speedMultiplier: 1.08,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.0
    },

    // --------------------------------------------------------
    // SECOND SKIN
    // --------------------------------------------------------
    sky_runner: {
        id: "sky_runner",
        name: "Sky Runner",

        bodyColor: new BABYLON.Color3(0.2, 0.55, 1.0),
        emissiveColor: new BABYLON.Color3(0.02, 0.06, 0.15),

        scale: 1.02,

        // Small jump buff
        speedMultiplier: 1.0,
        jumpMultiplier: 1.08,
        dashMultiplier: 1.0
    },

    // --------------------------------------------------------
    // THIRD SKIN
    // --------------------------------------------------------
    shadow_toucan: {
        id: "shadow_toucan",
        name: "Shadow Toucan",

        bodyColor: new BABYLON.Color3(0.12, 0.12, 0.16),
        emissiveColor: new BABYLON.Color3(0.15, 0.02, 0.2),

        scale: 1.04,

        // Small dash buff
        speedMultiplier: 1.0,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.10
    }
};


// ============================================================
// SKIN MANAGER
// ============================================================

const PlayerSkinSystem = {

    getEquippedSkin() {

        try {

            const saved = localStorage.getItem("toucanEquipped");

            if (!saved) {
                return "default_toucan";
            }

            const equipped = JSON.parse(saved);

            return equipped.skins || "default_toucan";

        } catch (error) {

            console.warn(
                "Could not read equipped skin:",
                error
            );

            return "default_toucan";
        }
    },


    getSkin(skinId) {

        return PLAYER_SKINS[skinId] ||
               PLAYER_SKINS.default_toucan;

    },


    applySkin(playerMesh, skinId = null) {

        if (!playerMesh) {
            console.warn("PlayerSkinSystem: player mesh missing.");
            return;
        }

        const equippedSkin =
            skinId || this.getEquippedSkin();

        const skin =
            this.getSkin(equippedSkin);


        // ----------------------------------------------------
        // APPLY MATERIAL
        // ----------------------------------------------------

        if (playerMesh.material) {

            playerMesh.material.diffuseColor =
                skin.bodyColor.clone();

            playerMesh.material.emissiveColor =
                skin.emissiveColor.clone();
        }


        // ----------------------------------------------------
        // APPLY SCALE
        // ----------------------------------------------------

        playerMesh.scaling.setAll(skin.scale);


        console.log(
            `Skin applied: ${skin.name}`
        );
    },


    getActiveBuffs(skinId = null) {

        const equippedSkin =
            skinId || this.getEquippedSkin();

        const skin =
            this.getSkin(equippedSkin);

        return {

            speedMultiplier:
                skin.speedMultiplier,

            jumpMultiplier:
                skin.jumpMultiplier,

            dashMultiplier:
                skin.dashMultiplier
        };
    }
};


// Make available globally
window.PLAYER_SKINS = PLAYER_SKINS;
window.PlayerSkinSystem = PlayerSkinSystem;