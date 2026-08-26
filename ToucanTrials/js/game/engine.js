// ============================================================
// ENGINE INITIALIZATION
// ============================================================

const canvas =
    document.getElementById("gameCanvas");


if (!canvas) {

    throw new Error(
        "ToucanTrials: gameCanvas was not found."
    );

}


const engine =
    new BABYLON.Engine(
        canvas,
        true,
        {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        }
    );

function hideGameLoader() {

    const loader =
        document.getElementById("gameLoader");

    if (!loader) return;

    loader.style.transition =
        "opacity 400ms ease";

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.remove();

    }, 450);
}

// ============================================================
// CREATE SCENE
// ============================================================

const createScene = () => {

    const scene =
        new BABYLON.Scene(engine);


    // BRIGHT SKY
    scene.clearColor =
        new BABYLON.Color4(
            0.4,
            0.7,
            0.9,
            1
        );


    // ========================================================
    // LIGHTING
    // ========================================================

    const ambientLight =
        new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );


    ambientLight.intensity = 1.2;


    ambientLight.diffuse =
        new BABYLON.Color3(
            1,
            1,
            1
        );


    ambientLight.groundColor =
        new BABYLON.Color3(
            0.25,
            0.35,
            0.25
        );


    const sun =
        new BABYLON.DirectionalLight(
            "sun",
            new BABYLON.Vector3(-1, -2, 1),
            scene
        );


    sun.position =
        new BABYLON.Vector3(
            20,
            40,
            -20
        );


    sun.intensity = 1.0;


    // ========================================================
    // PLAYER
    // ========================================================

    const playerMesh =
        BABYLON.MeshBuilder.CreateBox(
            "player",
            {
                width: 1,
                height: 2,
                depth: 1
            },
            scene
        );


    playerMesh.position =
        new BABYLON.Vector3(
            0,
            2.5,
            0
        );


    const playerMaterial =
        new BABYLON.StandardMaterial(
            "playerMaterial",
            scene
        );


    playerMaterial.diffuseColor =
        new BABYLON.Color3(
            1.0,
            0.6,
            0.0
        );


    playerMaterial.emissiveColor =
        new BABYLON.Color3(
            0.3,
            0.12,
            0.0
        );


    playerMaterial.specularColor =
        new BABYLON.Color3(
            0,
            0,
            0
        );


    playerMesh.material =
        playerMaterial;


    return {
        scene,
        playerMesh
    };

};


// ============================================================
// INITIALIZE GAME COMPONENTS
// ============================================================

const { scene, playerMesh } = createScene();


console.log(
    "TOUCANTRIALS ENGINE STARTED"
);

console.log(
    "Scene:",
    scene
);

console.log(
    "Player:",
    playerMesh
);


// 1. Camera
const cameraController =
    new CameraController(
        scene,
        canvas,
        playerMesh
    );


// 2. Input
const inputSystem =
    new InputManager();


// 3. Physics
PhysicsSystem.init(scene);


// 4. Level
LevelSystem.init(scene).then(() => {

    hideGameLoader();

});


// 5. Player
const playerController =
    new PlayerController(
        playerMesh,
        cameraController.camera
    );


playerController.setRespawnPoint(
    new BABYLON.Vector3(
        0,
        3,
        0
    )
);


// ============================================================
// RUN STATE
// ============================================================

const runState = {

    startedAt:
        performance.now(),

    finished:
        false,

    elapsedMs:
        0,

    coins:
        0

};


window.toucanRunState =
    runState;


// ============================================================
// UPDATE HUD
// ============================================================

function updateRunHUD() {

    const timerElement =
        document.getElementById(
            "runTimer"
        );


    const coinElement =
        document.getElementById(
            "coinCounter"
        );


    if (timerElement) {

        const totalSeconds =
            runState.elapsedMs / 1000;


        const minutes =
            Math.floor(
                totalSeconds / 60
            );


        const seconds =
            Math.floor(
                totalSeconds % 60
            );


        const milliseconds =
            Math.floor(
                runState.elapsedMs % 1000
            );


        timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}.` +
            `${String(milliseconds).padStart(3, "0")}`;

    }


    if (coinElement) {

        coinElement.textContent =
            String(runState.coins);

    }

}


// ============================================================
// FINISH RUN
// ============================================================

async function finishRun() {

    if (runState.finished) {
        return;
    }


    runState.finished = true;


    if (window.ToucanScores) {

        try {

            await window.ToucanScores.saveRun({

                levelId:
                    "level_1",

                completionTimeMs:
                    Math.round(
                        runState.elapsedMs
                    ),

                coinsCollected:
                    runState.coins

            });


            console.log(
                `ToucanTrials run saved: ` +
                `${runState.coins} coins, ` +
                `${Math.round(runState.elapsedMs)}ms`
            );


        } catch (error) {

            console.error(
                "Could not save ToucanTrials run:",
                error
            );

        }

    }


    const timerElement =
        document.getElementById(
            "runTimer"
        );


    if (timerElement) {

        timerElement.classList.add(
            "text-emerald-400"
        );

    }

}


// ============================================================
// MAIN GAME LOOP
// ============================================================

scene.onBeforeRenderObservable.add(() => {

    const deltaTime =
        Math.min(
            engine.getDeltaTime() / 1000,
            0.05
        );


    // Player
    playerController.update(
        deltaTime,
        inputSystem
    );


    // ========================================================
    // COINS
    // ========================================================

LevelSystem.collectCoins(
    playerMesh
);

runState.coins =
    LevelSystem.coinCount;


    // ========================================================
    // TIMER
    // ========================================================

    if (!runState.finished) {

        runState.elapsedMs =
            performance.now() -
            runState.startedAt;

    }


    updateRunHUD();


    // ========================================================
    // FINISH DETECTION
    // ========================================================

    if (
        !runState.finished &&
        LevelSystem.finishMesh &&
        LevelSystem.finishMesh.isEnabled()
    ) {

        const distanceToFinish =
            BABYLON.Vector3.Distance(
                playerMesh.position,
                LevelSystem.finishMesh.position
            );


        if (
            distanceToFinish <= 6.5
        ) {

            finishRun();

        }

    }


    // Camera
    cameraController.update();


    // Level animations
    LevelSystem.update(
        deltaTime
    );


    // Input
    inputSystem.postUpdate();

});


// ============================================================
// RENDER LOOP
// ============================================================

console.log(
    "TOUCANTRIALS RENDER LOOP STARTING"
);


engine.runRenderLoop(() => {

    scene.render();

});


// ============================================================
// WINDOW RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {
        engine.resize();
    }
);