const LevelSystem = {

    scene: null,
    objects: [],
    finishMesh: null,
    finishRing: null,
    coins: [],
    coinCount: 0,

    // Coins currently being sent to Supabase
    coinCollectionInFlight: new Set(),

    // Database records for coins collected within
    // the last 24 hours
    collectedCoinIds: new Set(),

    levelId: "level_1",

// Array of major checkpoint locations for future progression logic
checkpointPositions: [],

async init(scene) {
    this.scene = scene;
    this.objects = [];
    this.finishMesh = null;
    this.finishRing = null;
    this.checkpointPositions = [];
    this.coins = [];
    this.coinCount = 0;

    this.coinCollectionInFlight = new Set();
    this.collectedCoinIds = new Set();

    // Reset existing platforms in physics system
    PhysicsSystem.platforms.length = 0;

    // Build Level 1 Architecture across 20 distinct gameplay sections
    this.createLevel();
    this.spawnCoins();

    // Load this account's recently collected coins
    // before the player can collect anything.
    await this.loadCollectedCoins();
},

// ========================================================
// MATERIAL FACTORY
// ========================================================
createMaterial(name, color, emissive = { r: 0, g: 0, b: 0 }) {
    const mat = new BABYLON.StandardMaterial(name, this.scene);
    mat.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    mat.emissiveColor = new BABYLON.Color3(emissive.r, emissive.g, emissive.b);
    return mat;
},

// ========================================================
// GEOMETRY BUILDERS
// ========================================================

createPlatform(name, position, size, color) {
    const platform = BABYLON.MeshBuilder.CreateBox(
        name,
        { width: size.x, height: size.y, depth: size.z },
        this.scene
    );

    platform.position = new BABYLON.Vector3(position.x, position.y, position.z);
    platform.material = this.createMaterial(`${name}Mat`, color);

    this.objects.push(platform);
    PhysicsSystem.registerPlatform(platform);

    return platform;
},

createWall(name, position, size, color) {
    const wall = BABYLON.MeshBuilder.CreateBox(
        name,
        { width: size.x, height: size.y, depth: size.z },
        this.scene
    );

    wall.position = new BABYLON.Vector3(position.x, position.y, position.z);
    wall.material = this.createMaterial(`${name}Mat`, color);

    this.objects.push(wall);
    PhysicsSystem.registerPlatform(wall);

    return wall;
},

async loadCollectedCoins() {

    this.collectedCoinIds = new Set();

    const user = await ToucanAuth.getUser();

    // Guest players don't have persistent coin collections.
    if (!user) {
        console.log("Guest player: coins are not persistent.");
        return;
    }

    try {

        const cooldownTime =
            new Date(Date.now() - 24 * 60 * 60 * 1000)
                .toISOString();

        const {
            data,
            error
        } = await supabaseClient
            .from("coin_collections")
            .select("coin_id, collected_at")
            .eq("user_id", user.id)
            .eq("level_id", this.levelId)
            .gt("collected_at", cooldownTime);

        if (error) {
            throw error;
        }

        for (const record of data || []) {
            this.collectedCoinIds.add(record.coin_id);
        }

        console.log(
            `Loaded ${this.collectedCoinIds.size} coins currently on cooldown.`
        );

        // Hide coins that were collected during
        // the previous 24 hours.
        for (const coin of this.coins) {

            if (
                coin &&
                this.collectedCoinIds.has(coin.name)
            ) {
                coin.metadata.collected = true;
                coin.setEnabled(false);
            }
        }

    } catch (error) {

        console.error(
            "Could not load persistent coin data:",
            error
        );
    }
},

createCoin(name, position) {

    const coin = BABYLON.MeshBuilder.CreateCylinder(
        name,
        {
            diameter: 1.15,
            height: 0.22,
            tessellation: 32
        },
        this.scene
    );


    coin.position = position.clone();


    // Make the disc stand upright.
    coin.rotation.z = Math.PI / 2;


    const coinMaterial =
        new BABYLON.StandardMaterial(
            `${name}Mat`,
            this.scene
        );


    coinMaterial.diffuseColor =
        new BABYLON.Color3(
            1.0,
            0.72,
            0.05
        );


    coinMaterial.emissiveColor =
        new BABYLON.Color3(
            0.45,
            0.25,
            0.0
        );


    coinMaterial.specularColor =
        new BABYLON.Color3(
            1.0,
            0.85,
            0.35
        );


    coin.material = coinMaterial;


    coin.metadata = {
        isToucanCoin: true,
        collected: this.collectedCoinIds.has(name),
        baseY: position.y,
        bobPhase: Math.random() * Math.PI * 2
    };

    if (coin.metadata.collected) {
        coin.setEnabled(false);
    }


    this.coins.push(coin);

    return coin;
},


spawnCoins() {

    const candidatePlatforms =
        this.objects.filter((mesh) => {

            if (!mesh || !mesh.name) {
                return false;
            }


            const excluded = [
                "startPlatform",
                "restArea",
                "finishPlatform"
            ];


            if (
                excluded.some(
                    prefix => mesh.name.includes(prefix)
                )
            ) {
                return false;
            }


            if (
                mesh.name.includes("Wall")
            ) {
                return false;
            }


            if (
                mesh.name.startsWith("cp")
            ) {
                return false;
            }


            return (
                mesh.name.includes("_p") ||
                mesh.name.includes("prep") ||
                mesh.name.includes("Target") ||
                mesh.name.includes("target") ||
                mesh.name.includes("step") ||
                mesh.name.includes("leapPlat") ||
                mesh.name.includes("sanctuaryLedge") ||
                mesh.name.includes("stair")
            );

        });


    candidatePlatforms.forEach(
        (platform, index) => {

            // One coin approximately every second platform.
            if (index % 2 !== 0) {
                return;
            }


            platform.computeWorldMatrix(true);


            const bounds =
                platform
                    .getBoundingInfo()
                    .boundingBox;


            const min =
                bounds.minimumWorld;

            const max =
                bounds.maximumWorld;


            const width =
                max.x - min.x;

            const depth =
                max.z - min.z;


            const offsetX =
                width > 2
                    ? ((index % 3) - 1) *
                      Math.min(width * 0.22, 0.8)
                    : 0;


            const offsetZ =
                depth > 2
                    ? (((index + 1) % 3) - 1) *
                      Math.min(depth * 0.22, 0.8)
                    : 0;


            const coinPosition =
                new BABYLON.Vector3(
                    (min.x + max.x) / 2 + offsetX,
                    max.y + 1.25,
                    (min.z + max.z) / 2 + offsetZ
                );


            this.createCoin(
                `coin_${index}`,
                coinPosition
            );

        }
    );
},


async collectCoins(playerMesh) {

    if (
        !playerMesh ||
        this.coins.length === 0
    ) {
        return 0;
    }

    let collectedThisFrame = 0;

    const pickupRadius = 1.35;

    for (const coin of this.coins) {

        if (
            !coin ||
            coin.metadata?.collected ||
            !coin.isEnabled()
        ) {
            continue;
        }

        // Prevent the same coin from being sent
        // to Supabase multiple times while the
        // request is still processing.
        if (this.coinCollectionInFlight.has(coin.name)) {
            continue;
        }

        const distance =
            BABYLON.Vector3.Distance(
                playerMesh.position,
                coin.position
            );

        if (distance <= pickupRadius) {

            // Lock this coin immediately.
            this.coinCollectionInFlight.add(coin.name);

            // Hide it immediately so the player
            // cannot collect it twice.
            coin.metadata.collected = true;
            coin.setEnabled(false);

            try {

                const {
                    data,
                    error
                } = await supabaseClient.rpc(
                    "collect_coin",
                    {
                        p_level_id: this.levelId,
                        p_coin_id: coin.name
                    }
                );

                if (error) {
                    throw error;
                }

                const result =
                    Array.isArray(data)
                        ? data[0]
                        : data;

                if (result?.collected === true) {

                    // Successfully awarded to account.
                    this.coinCount++;
                    collectedThisFrame++;

                    this.collectedCoinIds.add(
                        coin.name
                    );

                    console.log(
                        `Coin collected: ${coin.name}`
                    );

                } else {

                    // Coin was still on cooldown.
                    // Keep it hidden.
                    console.log(
                        `Coin ${coin.name} is still on cooldown.`
                    );
                }

            } catch (error) {

                console.error(
                    `Could not collect ${coin.name}:`,
                    error
                );

                // If the database request failed,
                // allow the player to try again.
                coin.metadata.collected = false;
                coin.setEnabled(true);

            } finally {

                this.coinCollectionInFlight.delete(
                    coin.name
                );
            }
        }
    }

    return collectedThisFrame;
},

createCheckpoint(name, position, size) {
    const checkpointPad = BABYLON.MeshBuilder.CreateCylinder(
        name,
        { diameter: size.x, height: 0.4 },
        this.scene
    );

    checkpointPad.position = new BABYLON.Vector3(position.x, position.y + 0.2, position.z);
    checkpointPad.material = this.createMaterial(
        `${name}Mat`,
        { r: 0.2, g: 0.8, b: 0.9 },
        { r: 0.05, g: 0.25, b: 0.35 }
    );

    this.objects.push(checkpointPad);
    PhysicsSystem.registerPlatform(checkpointPad);

    // Track checkpoint vector
    this.checkpointPositions.push(new BABYLON.Vector3(position.x, position.y + 1.5, position.z));

    return checkpointPad;
},

createFinish(name, position, size) {
    // Base Sanctuary Platform
    const finishPad = BABYLON.MeshBuilder.CreateCylinder(
        `${name}Base`,
        { diameter: size.x, height: 1.0 },
        this.scene
    );
    finishPad.position = new BABYLON.Vector3(position.x, position.y, position.z);
    finishPad.material = this.createMaterial(
        `${name}Mat`,
        { r: 0.95, g: 0.75, b: 0.1 },
        { r: 0.4, g: 0.3, b: 0.0 }
    );

    this.objects.push(finishPad);
    PhysicsSystem.registerPlatform(finishPad);

    // Rotating Goal Beacon Ring
    this.finishRing = BABYLON.MeshBuilder.CreateTorus(
        `${name}Ring`,
        { diameter: size.x * 0.75, thickness: 0.4, tessellation: 32 },
        this.scene
    );
    this.finishRing.position = new BABYLON.Vector3(position.x, position.y + 3.0, position.z);
    this.finishRing.material = this.createMaterial(
        `${name}RingMat`,
        { r: 1.0, g: 0.84, b: 0.0 },
        { r: 0.6, g: 0.5, b: 0.0 }
    );

    this.finishMesh = finishPad;

    // Final goal position stored as last checkpoint
    this.checkpointPositions.push(new BABYLON.Vector3(position.x, position.y + 2.0, position.z));

    return finishPad;
},

// ========================================================
// EXPANDED LEVEL 1 ARCHITECTURE (20 SECTIONS)
// ========================================================

createLevel() {

    // Color Palette for Visual Distinction Across Sections
    const C_START  = { r: 0.15, g: 0.48, b: 0.25 };  // Emerald Jungle Entrance
    const C_WOOD   = { r: 0.42, g: 0.26, b: 0.14 };  // Dense Jungle Wood
    const C_ELEV   = { r: 0.22, g: 0.55, b: 0.65 };  // Ravine Stream Teal
    const C_HIGH   = { r: 0.85, g: 0.55, b: 0.15 };  // Bamboo Canopy Gold
    const C_DASH   = { r: 0.45, g: 0.25, b: 0.65 };  // Void Cliff Violet
    const C_ROCK   = { r: 0.22, g: 0.24, b: 0.28 };  // Cliff Stone / Walls
    const C_RUINS  = { r: 0.35, g: 0.45, b: 0.38 };  // Ancient Ruins Moss
    const C_TEMPLE = { r: 0.78, g: 0.25, b: 0.18 };  // High Sanctuary Terracotta

    // ----------------------------------------------------
    // START PLATFORM (Tutorial Safe Zone)
    // ----------------------------------------------------
    this.createPlatform("startPlatform", { x: 0, y: 0, z: 0 }, { x: 12, y: 1, z: 12 }, C_START);
    this.createWall("startWallBack", { x: 0, y: 2.5, z: -6 }, { x: 12, y: 4, z: 1 }, C_ROCK);

    // ----------------------------------------------------
    // SECTION 1 — EASY MOVEMENT TUTORIAL (Flat ground & turns)
    // ----------------------------------------------------
    this.createPlatform("sec1_p1", { x: 0, y: 0, z: 12 }, { x: 6, y: 1, z: 8 }, C_WOOD);
    this.createPlatform("sec1_p2", { x: 0, y: 0.5, z: 22 }, { x: 6, y: 1, z: 8 }, C_WOOD);
    this.createPlatform("sec1_p3", { x: 0, y: 1.0, z: 32 }, { x: 6, y: 1, z: 8 }, C_WOOD);

    // ----------------------------------------------------
    // SECTION 2 — BASIC JUMPS (Small 3-4 unit gaps)
    // ----------------------------------------------------
    this.createPlatform("sec2_p1", { x: 0, y: 1.5, z: 43 }, { x: 6, y: 1, z: 6 }, C_WOOD);
    this.createPlatform("sec2_p2", { x: 0, y: 2.0, z: 52 }, { x: 6, y: 1, z: 6 }, C_WOOD);
    this.createPlatform("sec2_p3", { x: 0, y: 2.5, z: 61 }, { x: 6, y: 1, z: 6 }, C_WOOD);

    // ----------------------------------------------------
    // SECTION 3 — SMALL GAPS & GRADUAL ELEVATION
    // ----------------------------------------------------
    this.createPlatform("sec3_p1", { x: -2, y: 3.5, z: 70 }, { x: 5, y: 1, z: 5 }, C_ELEV);
    this.createPlatform("sec3_p2", { x: 2, y: 4.5, z: 78 }, { x: 5, y: 1, z: 5 }, C_ELEV);
    this.createPlatform("sec3_p3", { x: 0, y: 5.5, z: 86 }, { x: 5, y: 1, z: 5 }, C_ELEV);

    // ----------------------------------------------------
    // SECTION 4 — HIGHER PLATFORMS (Ascending steps)
    // ----------------------------------------------------
    this.createPlatform("sec4_p1", { x: 0, y: 7.0, z: 95 }, { x: 5, y: 1, z: 5 }, C_ELEV);
    this.createPlatform("sec4_p2", { x: 0, y: 8.5, z: 104 }, { x: 5, y: 1, z: 5 }, C_ELEV);

    // ----------------------------------------------------
    // SECTION 5 — FIRST DOUBLE-JUMP CHALLENGE (Mandatory DJ #1)
    // Heights delta = +4.0u; Single jump maximum height is ~2.35u.
    // ----------------------------------------------------
    this.createPlatform("sec5_prep", { x: 0, y: 9.0, z: 112 }, { x: 6, y: 1, z: 6 }, C_WOOD);
    this.createPlatform("sec5_highTarget", { x: 0, y: 13.0, z: 122 }, { x: 6, y: 1, z: 6 }, C_HIGH);

    // REST AREA 1 & CHECKPOINT 1 (Jungle Canopy Overlook)
    this.createPlatform("sec5_restArea", { x: 0, y: 13.0, z: 132 }, { x: 10, y: 1, z: 10 }, C_START);
    this.createCheckpoint("cp1", { x: 0, y: 13.0, z: 132 }, { x: 4, y: 0.4, z: 4 });

    // ----------------------------------------------------
    // SECTION 6 — LONGER AIRBORNE MOVEMENT (Over Deep Ravine)
    // Wall blocks forward Z path -> forces 90° Right Camera Turn (#1)
    // ----------------------------------------------------
    this.createWall("sec6_turnWall", { x: 0, y: 17.0, z: 140 }, { x: 10, y: 8, z: 1 }, C_ROCK);

    this.createPlatform("sec6_p1", { x: 12, y: 13.5, z: 132 }, { x: 5, y: 1, z: 5 }, C_WOOD);
    this.createPlatform("sec6_p2", { x: 21, y: 14.0, z: 132 }, { x: 5, y: 1, z: 5 }, C_WOOD);
    this.createPlatform("sec6_p3", { x: 30, y: 14.5, z: 132 }, { x: 5, y: 1, z: 5 }, C_WOOD);

    // ----------------------------------------------------
    // SECTION 7 — MAJOR CAMERA DIRECTION CHANGE (Zigzag across Ravine)
    // ----------------------------------------------------
    this.createPlatform("sec7_p1", { x: 40, y: 15.5, z: 136 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createPlatform("sec7_p2", { x: 48, y: 16.5, z: 142 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createPlatform("sec7_p3", { x: 56, y: 17.5, z: 148 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createWall("sec7_turnWall", { x: 62, y: 21.0, z: 152 }, { x: 1, y: 8, z: 10 }, C_ROCK);

    // ----------------------------------------------------
    // SECTION 8 — ADVANCED DOUBLE-JUMP SECTION (Mandatory DJ #2 & #3)
    // High steep ascending pillars over void gap
    // ----------------------------------------------------
    this.createPlatform("sec8_p1", { x: 67, y: 18.0, z: 148 }, { x: 4, y: 1, z: 4 }, C_HIGH);
    this.createPlatform("sec8_p2", { x: 77, y: 21.5, z: 148 }, { x: 4, y: 1, z: 4 }, C_HIGH);
    this.createPlatform("sec8_p3", { x: 87, y: 25.0, z: 148 }, { x: 4, y: 1, z: 4 }, C_HIGH);

    // REST AREA 2 & CHECKPOINT 2 (Ravine Crest)
    this.createPlatform("sec8_restArea", { x: 98, y: 25.0, z: 148 }, { x: 10, y: 1, z: 10 }, C_START);
    this.createCheckpoint("cp2", { x: 98, y: 25.0, z: 148 }, { x: 4, y: 0.4, z: 4 });

    // ----------------------------------------------------
    // SECTION 9 — FIRST DASH-FOCUSED SECTION (Mandatory Dash #1)
    // Turn South (-Z direction). Wide 10-unit horizontal flat gap.
    // ----------------------------------------------------
    this.createWall("sec9_turnWall", { x: 104, y: 29.0, z: 148 }, { x: 1, y: 8, z: 10 }, C_ROCK); // Camera Turn #2

    this.createPlatform("sec9_p1", { x: 98, y: 25.0, z: 136 }, { x: 6, y: 1, z: 6 }, C_DASH);
    this.createPlatform("sec9_dashTarget", { x: 98, y: 25.0, z: 122 }, { x: 6, y: 1, z: 6 }, C_DASH);

    // ----------------------------------------------------
    // SECTION 10 — JUMP + DASH (Mandatory Dash #2)
    // 12-unit horizontal leap over open mountain drop
    // ----------------------------------------------------
    this.createPlatform("sec10_p1", { x: 98, y: 26.0, z: 110 }, { x: 5, y: 1, z: 5 }, C_DASH);
    this.createPlatform("sec10_dashTarget", { x: 98, y: 27.0, z: 96 }, { x: 5, y: 1, z: 5 }, C_DASH);

    // ----------------------------------------------------
    // SECTION 11 — DOUBLE JUMP + DASH (Mandatory Combo #1)
    // 14-unit horizontal distance + 2-unit elevation gain
    // ----------------------------------------------------
    this.createPlatform("sec11_prep", { x: 98, y: 28.0, z: 84 }, { x: 5, y: 1, z: 5 }, C_DASH);
    this.createPlatform("sec11_comboTarget", { x: 98, y: 30.0, z: 68 }, { x: 6, y: 1, z: 6 }, C_DASH);

    // REST AREA 3 & CHECKPOINT 3 (Cliff Overlook Platform)
    this.createPlatform("sec11_restArea", { x: 98, y: 30.0, z: 54 }, { x: 10, y: 1, z: 10 }, C_START);
    this.createCheckpoint("cp3", { x: 98, y: 30.0, z: 54 }, { x: 4, y: 0.4, z: 4 });

    // ----------------------------------------------------
    // SECTION 12 — VERTICAL CLIMB (Mandatory DJ #4)
    // Turn West (-X direction). Staircase climbing +15 vertical units.
    // ----------------------------------------------------
    this.createWall("sec12_turnWall", { x: 98, y: 34.0, z: 46 }, { x: 10, y: 8, z: 1 }, C_ROCK); // Camera Turn #3

    this.createPlatform("sec12_step1", { x: 88, y: 33.0, z: 54 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createPlatform("sec12_step2", { x: 80, y: 36.5, z: 54 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createPlatform("sec12_step3", { x: 72, y: 40.0, z: 54 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createPlatform("sec12_step4", { x: 64, y: 43.5, z: 54 }, { x: 4, y: 1, z: 4 }, C_ELEV);

    // ----------------------------------------------------
    // SECTION 13 — PRECISION PLATFORMING (Waterfall Crest)
    // Narrow 2.5x2.5 landing stones suspended high above level start
    // ----------------------------------------------------
    this.createPlatform("sec13_p1", { x: 54, y: 44.0, z: 54 }, { x: 2.5, y: 1, z: 2.5 }, C_HIGH);
    this.createPlatform("sec13_p2", { x: 45, y: 44.5, z: 54 }, { x: 2.5, y: 1, z: 2.5 }, C_HIGH);
    this.createPlatform("sec13_p3", { x: 36, y: 45.0, z: 54 }, { x: 2.5, y: 1, z: 2.5 }, C_HIGH);

    // ----------------------------------------------------
    // SECTION 14 — CAMERA ROTATION + JUMPING (Camera Turn #4 - Double ZigZag)
    // ----------------------------------------------------
    this.createPlatform("sec14_p1", { x: 28, y: 45.5, z: 54 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createWall("sec14_wall1", { x: 22, y: 48.0, z: 54 }, { x: 1, y: 6, z: 6 }, C_ROCK); // Force turn North (+Z)

    this.createPlatform("sec14_p2", { x: 28, y: 46.5, z: 64 }, { x: 4, y: 1, z: 4 }, C_ELEV);
    this.createWall("sec14_wall2", { x: 28, y: 49.0, z: 70 }, { x: 6, y: 6, z: 1 }, C_ROCK); // Force turn West (-X)

    this.createPlatform("sec14_p3", { x: 18, y: 47.5, z: 64 }, { x: 5, y: 1, z: 5 }, C_ELEV);

    // REST AREA 4 & CHECKPOINT 4 (Waterfall Headwaters)
    this.createPlatform("sec14_restArea", { x: 6, y: 47.5, z: 64 }, { x: 10, y: 1, z: 10 }, C_START);
    this.createCheckpoint("cp4", { x: 6, y: 47.5, z: 64 }, { x: 4, y: 0.4, z: 4 });

    // ----------------------------------------------------
    // SECTION 15 — DASH CHAIN (Mandatory Dash #3 & #4)
    // Turn North (+Z direction). Chain of 3 long gaps requiring successive dashes.
    // ----------------------------------------------------
    this.createWall("sec15_turnWall", { x: 0, y: 51.0, z: 64 }, { x: 1, y: 8, z: 10 }, C_ROCK); // Camera Turn #5

    this.createPlatform("sec15_p1", { x: 6, y: 48.5, z: 76 }, { x: 5, y: 1, z: 5 }, C_DASH);
    this.createPlatform("sec15_p2", { x: 6, y: 49.5, z: 90 }, { x: 5, y: 1, z: 5 }, C_RUINS);
    this.createPlatform("sec15_p3", { x: 6, y: 50.5, z: 104 }, { x: 5, y: 1, z: 5 }, C_DASH);
    this.createPlatform("sec15_p4", { x: 6, y: 51.5, z: 118 }, { x: 5, y: 1, z: 5 }, C_RUINS);

    // ----------------------------------------------------
    // SECTION 16 — ADVANCED COMBINATION SECTION (Mandatory Combo #2)
    // Jump + Double Jump + Air Dash over wide Ruin Gate
    // ----------------------------------------------------
    this.createPlatform("sec16_prep", { x: 6, y: 52.5, z: 130 }, { x: 4, y: 1, z: 4 }, C_RUINS);
    this.createPlatform("sec16_target", { x: 6, y: 55.5, z: 144 }, { x: 5, y: 1, z: 5 }, C_DASH);

    // REST AREA 5 & CHECKPOINT 5 (Ruins High Terrace)
    this.createPlatform("sec16_restArea", { x: 6, y: 55.5, z: 158 }, { x: 10, y: 1, z: 10 }, C_START);
    this.createCheckpoint("cp5", { x: 6, y: 55.5, z: 158 }, { x: 4, y: 0.4, z: 4 });

    // ----------------------------------------------------
    // SECTION 17 — LONG DIFFICULT TRAVERSAL (Mandatory DJ #5)
    // Turn East (+X direction). High canopy tree-top leaps with elevation steps.
    // ----------------------------------------------------
    this.createWall("sec17_turnWall", { x: 6, y: 59.0, z: 164 }, { x: 10, y: 8, z: 1 }, C_ROCK); // Camera Turn #6

    this.createPlatform("sec17_p1", { x: 18, y: 56.5, z: 158 }, { x: 4, y: 1, z: 4 }, C_WOOD);
    this.createPlatform("sec17_p2", { x: 28, y: 60.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_HIGH);
    this.createPlatform("sec17_p3", { x: 38, y: 63.5, z: 158 }, { x: 4, y: 1, z: 4 }, C_HIGH);
    this.createPlatform("sec17_p4", { x: 48, y: 64.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_WOOD);

    // ----------------------------------------------------
    // SECTION 18 — FINAL GAUNTLET (Mandatory Combo #3 & Dash #5)
    // Isolated floating islands over the abyssal void
    // ----------------------------------------------------
    this.createPlatform("sec18_p1", { x: 58, y: 65.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_DASH);
    this.createPlatform("sec18_p2", { x: 72, y: 67.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_DASH);
    this.createPlatform("sec18_p3", { x: 84, y: 68.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_TEMPLE);

    // ----------------------------------------------------
    // SECTION 19 — FINAL APPROACH (Mandatory Combo #4)
    // The ultimate leap onto the grand stair steps of the sanctuary
    // ----------------------------------------------------
    this.createPlatform("sec19_leapPlat", { x: 94, y: 69.0, z: 158 }, { x: 5, y: 1, z: 5 }, C_TEMPLE);
    this.createPlatform("sec19_sanctuaryLedge", { x: 108, y: 71.0, z: 158 }, { x: 5, y: 1, z: 5 }, C_DASH);

    this.createPlatform("sec19_stair1", { x: 116, y: 72.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_TEMPLE);
    this.createPlatform("sec19_stair2", { x: 122, y: 73.0, z: 158 }, { x: 4, y: 1, z: 4 }, C_TEMPLE);

    // ----------------------------------------------------
    // SECTION 20 — FINISH (Grand Sun Sanctuary Summit)
    // ----------------------------------------------------
    this.createFinish("finishPlatform", { x: 134, y: 74.0, z: 158 }, { x: 12, y: 1, z: 12 });
    this.createCheckpoint("cp6", { x: 134, y: 74.0, z: 158 }, { x: 5, y: 0.4, z: 5 });
},

// ========================================================
// ANIMATE LEVEL ELEMENTS
// ========================================================
update(dt) {

    if (this.finishRing) {

        this.finishRing.rotation.y +=
            dt * 1.5;

        this.finishRing.rotation.x +=
            dt * 0.5;
    }


    for (const coin of this.coins) {

        if (
            !coin ||
            !coin.isEnabled()
        ) {
            continue;
        }


        // Coin rotation.
        coin.rotation.y +=
            dt * 5.0;


        // Small floating/bobbing effect.
        coin.position.y =
            coin.metadata.baseY +
            Math.sin(
                performance.now() * 0.004 +
                coin.metadata.bobPhase
            ) * 0.12;

    }

}

};