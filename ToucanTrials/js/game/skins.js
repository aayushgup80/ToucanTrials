// ============================================================
// TOUCANTRIALS - PLAYER SKIN SYSTEM
// Browser-safe item definitions + Babylon visual builder
// ============================================================

const PLAYER_SKINS = {
    default_toucan: {
        id: "default_toucan",
        name: "Default Toucan",
        description: "The original ToucanTrials runner.",
        price: 0,
        icon: "🟡",
        bodyColor: [1.0, 0.65, 0.05],
        accentColor: [0.95, 0.20, 0.03],
        beakColor: [0.95, 0.75, 0.10],
        eyeColor: [0.05, 0.05, 0.04],
        bellyColor: [1.0, 0.88, 0.30],
        scale: 1.0,
        speedMultiplier: 1.0,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.0,
        dashCooldownMultiplier: 1.0,
        coinMultiplier: 1.0
    },

    swift_toucan: {
        id: "swift_toucan",
        name: "Swift Toucan",
        description: "A sleek runner built for speed.",
        price: 500,
        icon: "⚡",
        bodyColor: [0.12, 0.55, 1.0],
        accentColor: [0.05, 0.15, 0.35],
        beakColor: [0.95, 0.86, 0.35],
        eyeColor: [0.02, 0.02, 0.04],
        bellyColor: [0.35, 0.82, 1.0],
        scale: 1.02,
        speedMultiplier: 1.10,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.0,
        dashCooldownMultiplier: 1.0,
        coinMultiplier: 1.0
    },

    // These are ready for future DB inventory columns.
    jungle_runner: {
        id: "jungle_runner",
        name: "Jungle Runner",
        description: "A canopy-green expedition skin.",
        price: 750,
        icon: "🌿",
        bodyColor: [0.12, 0.72, 0.30],
        accentColor: [0.03, 0.24, 0.10],
        beakColor: [0.95, 0.80, 0.10],
        eyeColor: [0.02, 0.05, 0.02],
        bellyColor: [0.45, 0.90, 0.55],
        scale: 1.02,
        speedMultiplier: 1.04,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.0,
        dashCooldownMultiplier: 1.0,
        coinMultiplier: 1.0
    },

    sky_runner: {
        id: "sky_runner",
        name: "Sky Runner",
        description: "Lightweight and made for high jumps.",
        price: 900,
        icon: "☁️",
        bodyColor: [0.28, 0.72, 1.0],
        accentColor: [0.08, 0.25, 0.55],
        beakColor: [1.0, 0.70, 0.16],
        eyeColor: [0.02, 0.05, 0.10],
        bellyColor: [0.72, 0.92, 1.0],
        scale: 1.01,
        speedMultiplier: 1.0,
        jumpMultiplier: 1.08,
        dashMultiplier: 1.0,
        dashCooldownMultiplier: 1.0,
        coinMultiplier: 1.0
    },

    shadow_toucan: {
        id: "shadow_toucan",
        name: "Shadow Toucan",
        description: "A dark, charged runner with a stronger dash.",
        price: 1200,
        icon: "🌑",
        bodyColor: [0.08, 0.08, 0.12],
        accentColor: [0.32, 0.05, 0.45],
        beakColor: [0.55, 0.35, 0.95],
        eyeColor: [0.90, 0.35, 1.0],
        bellyColor: [0.18, 0.12, 0.24],
        scale: 1.04,
        speedMultiplier: 1.0,
        jumpMultiplier: 1.0,
        dashMultiplier: 1.10,
        dashCooldownMultiplier: 0.97,
        coinMultiplier: 1.0
    }
};

const PLAYER_TRAILS = {
    default_trail: {
        id: "default_trail",
        name: "No Trail",
        description: "Clean air.",
        price: 0,
        icon: "💨",
        jumpMultiplier: 1.0,
        coinMultiplier: 1.0
    },
    emerald_trail: {
        id: "emerald_trail",
        name: "Emerald Trail",
        description: "Leaves a green path.",
        price: 300,
        icon: "🌿",
        jumpMultiplier: 1.05,
        coinMultiplier: 1.0
    }
};

const PLAYER_EFFECTS = {
    default_effect: {
        id: "default_effect",
        name: "No Effect",
        description: "Standard gameplay.",
        price: 0,
        icon: "✨",
        coinMultiplier: 1.0
    },
    jungle_effect: {
        id: "jungle_effect",
        name: "Jungle Aura",
        description: "A lush aura that boosts coin rewards.",
        price: 1000,
        icon: "🍃",
        coinMultiplier: 1.20
    }
};

function color3FromArray(value, fallback) {
    const rgb = Array.isArray(value) && value.length === 3 ? value : fallback;
    return new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);
}

const PlayerSkinSystem = {
    getEquipped() {
        try {
            const saved = localStorage.getItem("toucanEquipped");
            if (!saved) {
                return {
                    skins: "default_toucan",
                    trails: "default_trail",
                    effects: "default_effect"
                };
            }
            const equipped = JSON.parse(saved);
            return {
                skins: equipped.skins || "default_toucan",
                trails: equipped.trails || "default_trail",
                effects: equipped.effects || "default_effect"
            };
        } catch (error) {
            console.warn("Could not read equipped items:", error);
            return {
                skins: "default_toucan",
                trails: "default_trail",
                effects: "default_effect"
            };
        }
    },

    getEquippedSkin() {
        const equipped = this.getEquipped();
        return PLAYER_SKINS[equipped.skins] || PLAYER_SKINS.default_toucan;
    },

    getActiveBuffs() {
        const equipped = this.getEquipped();
        const skin = PLAYER_SKINS[equipped.skins] || PLAYER_SKINS.default_toucan;
        const trail = PLAYER_TRAILS[equipped.trails] || PLAYER_TRAILS.default_trail;
        const effect = PLAYER_EFFECTS[equipped.effects] || PLAYER_EFFECTS.default_effect;

        return {
            speedMultiplier: (skin.speedMultiplier || 1) * (trail.speedMultiplier || 1) * (effect.speedMultiplier || 1),
            jumpMultiplier: (skin.jumpMultiplier || 1) * (trail.jumpMultiplier || 1) * (effect.jumpMultiplier || 1),
            dashMultiplier: (skin.dashMultiplier || 1) * (trail.dashMultiplier || 1) * (effect.dashMultiplier || 1),
            dashCooldownMultiplier: (skin.dashCooldownMultiplier || 1) * (trail.dashCooldownMultiplier || 1) * (effect.dashCooldownMultiplier || 1),
            coinMultiplier: (skin.coinMultiplier || 1) * (trail.coinMultiplier || 1) * (effect.coinMultiplier || 1)
        };
    },

    applySkin(playerMesh) {
        if (!playerMesh || typeof BABYLON === "undefined") {
            return;
        }

        const skin = this.getEquippedSkin();
        const scene = playerMesh.getScene();

        // Root collision mesh becomes the main rounded body.
        playerMesh.scaling.setAll(skin.scale);
        playerMesh.material.diffuseColor = color3FromArray(skin.bodyColor, [1, 0.65, 0.05]);
        playerMesh.material.emissiveColor = color3FromArray(skin.bodyColor, [0.1, 0.04, 0]);.scale(0.12);

        // Avoid duplicating visuals if applySkin is called more than once.
        const oldVisuals = scene.getMeshByName("playerVisuals");
        if (oldVisuals) oldVisuals.dispose(false, true);

        const visuals = BABYLON.MeshBuilder.CreateTransformNode
            ? new BABYLON.TransformNode("playerVisuals", scene)
            : BABYLON.MeshBuilder.CreateBox("playerVisuals", { size: 0.01 }, scene);
        visuals.parent = playerMesh;
        visuals.position = BABYLON.Vector3.Zero();

        const body = BABYLON.MeshBuilder.CreateSphere("playerBody", {
            diameter: 1.45,
            segments: 24
        }, scene);
        body.parent = visuals;
        body.position.y = 0.05;
        body.scaling.y = 1.18;
        body.material = playerMesh.material;

        const makeMaterial = (name, color, emissiveScale = 0.05) => {
            const mat = new BABYLON.StandardMaterial(name, scene);
            mat.diffuseColor = color3FromArray(color, [1, 1, 1]);
            mat.emissiveColor = color3FromArray(color, [0, 0, 0]).scale(emissiveScale);
            mat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
            return mat;
        };

        const black = new BABYLON.Color3(0.015, 0.015, 0.02);

        // Face / eyes
        const eyeWhiteMat = makeMaterial("playerEyeWhite", [0.98, 0.98, 0.95], 0.02);
        const eyeMat = makeMaterial("playerEye", skin.eyeColor, 0.25);

        [-0.23, 0.23].forEach((x, index) => {
            const eyeWhite = BABYLON.MeshBuilder.CreateSphere(`playerEyeWhite${index}`, {
                diameter: 0.34,
                segments: 16
            }, scene);
            eyeWhite.parent = visuals;
            eyeWhite.position.set(x, 0.42, -0.60);
            eyeWhite.scaling.z = 0.35;
            eyeWhite.material = eyeWhiteMat;

            const eye = BABYLON.MeshBuilder.CreateSphere(`playerPupil${index}`, {
                diameter: 0.15,
                segments: 16
            }, scene);
            eye.parent = visuals;
            eye.position.set(x, 0.43, -0.71);
            eye.scaling.z = 0.35;
            eye.material = eyeMat;
        });

        // Beak
        const beak = BABYLON.MeshBuilder.CreateCylinder("playerBeak", {
            height: 0.48,
            diameterTop: 0.02,
            diameterBottom: 0.34,
            tessellation: 16
        }, scene);
        beak.parent = visuals;
        beak.position.set(0, 0.15, -0.78);
        beak.rotation.x = Math.PI / 2;
        beak.material = makeMaterial("playerBeakMat", skin.beakColor, 0.04);

        // Belly patch
        const belly = BABYLON.MeshBuilder.CreateSphere("playerBelly", {
            diameter: 0.98,
            segments: 20
        }, scene);
        belly.parent = visuals;
        belly.position.set(0, -0.02, -0.48);
        belly.scaling.set(0.8, 0.95, 0.35);
        belly.material = makeMaterial("playerBellyMat", skin.bellyColor, 0.03);

        // Wing accents
        const wingMat = makeMaterial("playerWingMat", skin.accentColor, 0.08);
        [-1, 1].forEach(side => {
            const wing = BABYLON.MeshBuilder.CreateSphere(`playerWing${side}`, {
                diameter: 0.72,
                segments: 18
            }, scene);
            wing.parent = visuals;
            wing.position.set(0.58 * side, 0.0, 0.03);
            wing.scaling.set(0.35, 0.78, 0.95);
            wing.rotation.z = side * 0.2;
            wing.material = wingMat;
        });

        // Hide the old collision box visually; keep it for physics.
        playerMesh.isVisible = false;
        playerMesh.visibility = 0;

        // Active buffs are available immediately to the game.
        window.ToucanActiveBuffs = this.getActiveBuffs();

        console.log(`ToucanTrials skin applied: ${skin.name}`);
    }
};

window.PLAYER_SKINS = PLAYER_SKINS;
window.PLAYER_TRAILS = PLAYER_TRAILS;
window.PLAYER_EFFECTS = PLAYER_EFFECTS;
window.PlayerSkinSystem = PlayerSkinSystem;
