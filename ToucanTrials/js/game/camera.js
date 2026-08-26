// ============================================================
// CAMERA CONTROLLER
// ============================================================

class CameraController {

    constructor(scene, canvas, targetMesh) {
        this.scene = scene;
        this.canvas = canvas;
        this.targetMesh = targetMesh;

        // Initialize Babylon ArcRotateCamera
        // alpha: Math.PI (behind player looking towards +Z)
        // beta: Math.PI / 3 (60 degree down angle)
        // radius: 14 units distance
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI,
            Math.PI / 3,
            14,
            targetMesh ? targetMesh.position.clone().add(new BABYLON.Vector3(0, 1, 0)) : new BABYLON.Vector3(0, 1, 0),
            scene
        );

        // ----------------------------------------------------
        // REMOVE DEFAULT POINTER INPUTS
        // ----------------------------------------------------
        // This stops Babylon's default pointer listener from overriding
        // left-clicks or pan inputs.
        this.camera.inputs.removeByType("ArcRotateCameraPointersInput");

        // Keep built-in mouse wheel zoom
        this.camera.inputs.addMouseWheel();
        this.camera.attachControl(canvas, false);

        // ----------------------------------------------------
        // CAMERA LIMITS & TUNING
        // ----------------------------------------------------
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 25;
        this.camera.lowerBetaLimit = 0.15; // Stops camera from clipping below player ground
        this.camera.upperBetaLimit = Math.PI / 2.05; // ~87 degrees (stops top-down flip)
        this.camera.wheelPrecision = 40; // Smooth zoom response

        // ----------------------------------------------------
        // DRAG STATE & ROTATION
        // ----------------------------------------------------
        this.isRotating = false;
        this.activePointerId = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.sensitivity = 0.0045;

        this.initInputListeners();
    }

    initInputListeners() {
        // Prevent default browser context menu on RMB
        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        // ----------------------------------------------------
        // POINTER DOWN (Only RMB = Button 2)
        // ----------------------------------------------------
        this.canvas.addEventListener("pointerdown", (event) => {
            if (event.button !== 2) {
                return; // Left click and middle click are completely ignored
            }

            event.preventDefault();
            this.isRotating = true;
            this.activePointerId = event.pointerId;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;

            // Capture pointer so mouse moves outside canvas are tracked reliably
            try {
                this.canvas.setPointerCapture(event.pointerId);
            } catch (err) {
                // Fallback for browsers without pointer capture support
            }
        });

        // ----------------------------------------------------
        // POINTER MOVE (Rotates Camera while RMB is held)
        // ----------------------------------------------------
        window.addEventListener("pointermove", (event) => {
            if (!this.isRotating || event.pointerId !== this.activePointerId) {
                return;
            }

            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;

            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;

            // Horizontal rotation (Orbit around player)
            this.camera.alpha -= deltaX * this.sensitivity;

            // Vertical rotation (Elevation angle)
            this.camera.beta -= deltaY * this.sensitivity;

            // Enforce beta bounds
            this.camera.beta = Math.max(
                this.camera.lowerBetaLimit,
                Math.min(this.camera.upperBetaLimit, this.camera.beta)
            );
        });

        // ----------------------------------------------------
        // POINTER UP / CANCEL / BLUR
        // ----------------------------------------------------
        const stopRotating = (event) => {
            if (this.isRotating && (event.button === 2 || event.pointerId === this.activePointerId)) {
                this.isRotating = false;

                if (this.activePointerId !== null) {
                    try {
                        this.canvas.releasePointerCapture(this.activePointerId);
                    } catch (err) {}
                    this.activePointerId = null;
                }
            }
        };

        window.addEventListener("pointerup", stopRotating);
        window.addEventListener("pointercancel", stopRotating);
        window.addEventListener("blur", () => {
            this.isRotating = false;
            this.activePointerId = null;
        });
    }

    // --------------------------------------------------------
    // UPDATE TARGET FOCUS
    // --------------------------------------------------------
    update() {
        if (this.targetMesh) {
            // Smoothly track target position + eye offset
            this.camera.target.x = this.targetMesh.position.x;
            this.camera.target.y = this.targetMesh.position.y + 0.8;
            this.camera.target.z = this.targetMesh.position.z;
        }
    }

}