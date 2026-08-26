// ============================================================
// ENGINE INITIALIZATION
// ============================================================

const canvas = document.getElementById("gameCanvas");
if (!canvas) throw new Error("ToucanTrials: gameCanvas was not found.");

const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
});

function hideGameLoader() {
    const loader = document.getElementById("gameLoader");
    if (!loader) return;
    loader.style.transition = "opacity 400ms ease";
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 450);
}

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.4, 0.7, 0.9, 1);

    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 1.2;
    ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight.groundColor = new BABYLON.Color3(0.25, 0.35, 0.25);

    const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, 1), scene);
    sun.position = new BABYLON.Vector3(20, 40, -20);
    sun.intensity = 1.0;

    const playerMesh = BABYLON.MeshBuilder.CreateBox("player", { width: 1, height: 2, depth: 1 }, scene);
    playerMesh.position = new BABYLON.Vector3(0, 2.5, 0);

    const playerMaterial = new BABYLON.StandardMaterial("playerMaterial", scene);
    playerMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.6, 0.0);
    playerMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.12, 0.0);
    playerMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    playerMesh.material = playerMaterial;

    return { scene, playerMesh };
};

// ============================================================
// MOBILE CONTROLS
// ============================================================
// Deliberately visible on desktop too, for testing and users
// who prefer touch-style controls with a mouse.
// ============================================================

function createMobileControls(inputSystem, cameraController) {
    if (document.getElementById("mobileControls")) return;

    const root = document.createElement("div");
    root.id = "mobileControls";
    root.style.cssText = "position:fixed;inset:0;z-index:40;pointer-events:none;touch-action:none;font-family:Arial,sans-serif;";
    root.innerHTML = `
        <div id="mobileJoystick" style="position:absolute;left:24px;bottom:28px;width:132px;height:132px;border:2px solid rgba(255,255,255,.25);border-radius:50%;background:rgba(0,0,0,.28);backdrop-filter:blur(6px);pointer-events:auto;cursor:pointer;">
            <div id="mobileStick" style="position:absolute;left:41px;top:41px;width:46px;height:46px;border-radius:50%;background:rgba(251,191,36,.85);box-shadow:0 4px 18px rgba(0,0,0,.35);"></div>
        </div>
        <div style="position:absolute;right:22px;bottom:26px;display:flex;gap:14px;align-items:flex-end;pointer-events:auto;">
            <button id="mobileDash" style="width:76px;height:76px;border-radius:50%;border:2px solid rgba(255,255,255,.2);background:rgba(0,0,0,.42);color:white;font-weight:900;font-size:11px;letter-spacing:.08em;cursor:pointer;">DASH</button>
            <button id="mobileJump" style="width:92px;height:92px;border-radius:50%;border:2px solid rgba(251,191,36,.45);background:rgba(251,191,36,.25);color:#fef3c7;font-weight:900;font-size:13px;letter-spacing:.08em;cursor:pointer;">JUMP</button>
        </div>
        <div style="position:absolute;right:20px;top:92px;color:rgba(255,255,255,.38);font-size:10px;text-transform:uppercase;letter-spacing:.12em;">Drag right side to look</div>`;
    document.body.appendChild(root);

    const joystick = document.getElementById("mobileJoystick");
    const stick = document.getElementById("mobileStick");
    const jump = document.getElementById("mobileJump");
    const dash = document.getElementById("mobileDash");
    const keys = inputSystem.keys;

    const setMovement = (x, y) => {
        const dead = 0.22;
        keys.a = x < -dead;
        keys.d = x > dead;
        keys.w = y < -dead;
        keys.s = y > dead;
    };

    let joyId = null;
    const resetJoystick = () => {
        joyId = null;
        setMovement(0, 0);
        stick.style.transform = "translate(0,0)";
    };

    const updateJoystick = event => {
        const rect = joystick.getBoundingClientRect();
        let dx = event.clientX - (rect.left + rect.width / 2);
        let dy = event.clientY - (rect.top + rect.height / 2);
        const max = 43;
        const length = Math.hypot(dx, dy);
        if (length > max) {
            dx = dx / length * max;
            dy = dy / length * max;
        }
        stick.style.transform = `translate(${dx}px,${dy}px)`;
        setMovement(dx / max, dy / max);
    };

    joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        joyId = event.pointerId;
        joystick.setPointerCapture?.(joyId);
        updateJoystick(event);
    });
    joystick.addEventListener("pointermove", event => {
        if (event.pointerId !== joyId) return;
        event.preventDefault();
        updateJoystick(event);
    });
    joystick.addEventListener("pointerup", event => {
        if (event.pointerId === joyId) resetJoystick();
    });
    joystick.addEventListener("pointercancel", resetJoystick);
    joystick.addEventListener("pointerleave", event => {
        if (joyId === null) return;
        if (event.pointerType === "mouse") resetJoystick();
    });

    const tapAction = (button, key) => {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            keys[key] = true;
            button.style.transform = "scale(.92)";
        });
        const release = () => {
            keys[key] = false;
            button.style.transform = "scale(1)";
        };
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
    };
    tapAction(jump, "space");
    tapAction(dash, "shift");

    // Right-side drag camera control works with mouse OR touch.
    let cameraTouch = null;
    root.addEventListener("pointerdown", event => {
        if (event.target === joystick || event.target === stick || event.target === jump || event.target === dash) return;
        if (event.clientX < innerWidth * 0.42 || event.clientY > innerHeight - 145) return;
        cameraTouch = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    root.addEventListener("pointermove", event => {
        if (!cameraTouch || event.pointerId !== cameraTouch.id) return;
        const dx = event.clientX - cameraTouch.x;
        const dy = event.clientY - cameraTouch.y;
        cameraTouch.x = event.clientX;
        cameraTouch.y = event.clientY;
        cameraController.camera.alpha -= dx * 0.006;
        cameraController.camera.beta = Math.max(
            cameraController.camera.lowerBetaLimit,
            Math.min(cameraController.camera.upperBetaLimit, cameraController.camera.beta - dy * 0.006)
        );
    });
    root.addEventListener("pointerup", event => {
        if (cameraTouch?.id === event.pointerId) cameraTouch = null;
    });
    root.addEventListener("pointercancel", () => { cameraTouch = null; });
}

// ============================================================
// COIN COLLECTION SAFETY
// ============================================================

function installSafeCoinCollector() {
    if (!window.LevelSystem) return;

    // A respawn is allowed to restore any coin that was NOT
    // confirmed by Supabase. Confirmed coins stay hidden.
    LevelSystem.onPlayerRespawn = function() {
        for (const coin of this.coins || []) {
            if (!coin) continue;
            const confirmed = this.collectedCoinIds?.has(coin.name);
            const pending = this.coinCollectionInFlight?.has(coin.name);

            if (confirmed || pending) {
                coin.metadata.collected = true;
                coin.setEnabled(false);
            } else {
                coin.metadata.collected = false;
                coin.setEnabled(true);
            }
        }
    };

    LevelSystem.collectCoins = async function(playerMesh) {
        if (!playerMesh || !this.coins?.length) return 0;
        if (!this.coinCollectionInFlight) this.coinCollectionInFlight = new Set();
        if (!this.collectedCoinIds) this.collectedCoinIds = new Set();

        let gained = 0;
        const radius = 1.35;

        for (const coin of this.coins) {
            if (!coin || !coin.isEnabled?.() || coin.metadata?.collected) continue;
            if (this.coinCollectionInFlight.has(coin.name)) continue;
            if (BABYLON.Vector3.Distance(playerMesh.position, coin.position) > radius) continue;

            this.coinCollectionInFlight.add(coin.name);
            coin.metadata.collected = true;
            coin.setEnabled(false);

            try {
                const { data, error } = await supabaseClient.rpc("collect_coin", {
                    p_level_id: this.levelId || "level_1",
                    p_coin_id: coin.name
                });
                if (error) throw error;

                const result = Array.isArray(data) ? data[0] : data;

                if (result?.collected === true) {
                    this.collectedCoinIds.add(coin.name);
                    this.coinCount = (this.coinCount || 0) + 1;
                    gained++;
                    console.log(`Coin collected: ${coin.name}`);
                } else {
                    // Database says it is still on the 24h cooldown.
                    this.collectedCoinIds.add(coin.name);
                    console.log(`Coin ${coin.name} is on cooldown.`);
                }
            } catch (error) {
                console.error(`Could not collect ${coin.name}:`, error);
                // Request failed, so this coin remains collectible.
                this.collectedCoinIds.delete(coin.name);
                coin.metadata.collected = false;
                coin.setEnabled(true);
            } finally {
                this.coinCollectionInFlight.delete(coin.name);
            }
        }

        return gained;
    };
}

// ============================================================
// INITIALIZE
// ============================================================

const { scene, playerMesh } = createScene();
const cameraController = new CameraController(scene, canvas, playerMesh);
const inputSystem = new InputManager();
PhysicsSystem.init(scene);
installSafeCoinCollector();
Promise.resolve(LevelSystem.init(scene)).then(() => hideGameLoader());

const playerController = new PlayerController(playerMesh, cameraController.camera);
playerController.setRespawnPoint(new BABYLON.Vector3(0, 3, 0));
createMobileControls(inputSystem, cameraController);

const runState = {
    startedAt: performance.now(),
    finished: false,
    elapsedMs: 0,
    coins: 0
};
window.toucanRunState = runState;

function updateRunHUD() {
    const timerElement = document.getElementById("runTimer");
    const coinElement = document.getElementById("coinCounter");
    if (timerElement) {
        const total = runState.elapsedMs / 1000;
        timerElement.textContent = `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(Math.floor(total % 60)).padStart(2,"0")}.${String(Math.floor(runState.elapsedMs % 1000)).padStart(3,"0")}`;
    }
    if (coinElement) coinElement.textContent = String(runState.coins);
}

async function finishRun() {
    if (runState.finished) return;
    runState.finished = true;
    if (window.ToucanScores) {
        try {
            await window.ToucanScores.saveRun({
                levelId: "level_1",
                completionTimeMs: Math.round(runState.elapsedMs),
                coinsCollected: runState.coins
            });
        } catch (error) {
            console.error("Could not save ToucanTrials run:", error);
        }
    }
    const timerElement = document.getElementById("runTimer");
    if (timerElement) timerElement.classList.add("text-emerald-400");
}

scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    playerController.update(dt, inputSystem);
    LevelSystem.collectCoins(playerMesh);
    runState.coins = LevelSystem.coinCount || 0;
    if (!runState.finished) runState.elapsedMs = performance.now() - runState.startedAt;
    updateRunHUD();

    if (!runState.finished && LevelSystem.finishMesh && LevelSystem.finishMesh.isEnabled()) {
        if (BABYLON.Vector3.Distance(playerMesh.position, LevelSystem.finishMesh.position) <= 6.5) finishRun();
    }

    cameraController.update();
    LevelSystem.update(dt);
    inputSystem.postUpdate();
});

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());