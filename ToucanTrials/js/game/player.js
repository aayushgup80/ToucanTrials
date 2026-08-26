// ============================================================
// INPUT MANAGER
// ============================================================
console.log("PHYSICS.JS LOADED");
class InputManager {
    constructor() {
        this.keys = {
            w:false,a:false,s:false,d:false,
            arrowup:false,arrowdown:false,arrowleft:false,arrowright:false,
            space:false,spaceJustPressed:false,
            shift:false,shiftJustPressed:false
        };
        this.previousKeys = { space:false, shift:false };

        window.addEventListener("keydown", event => {
            const key = event.key.toLowerCase();
            if (key === " ") { this.keys.space = true; event.preventDefault(); }
            else if (key === "shift") { this.keys.shift = true; event.preventDefault(); }
            else if (key in this.keys) this.keys[key] = true;
        });

        window.addEventListener("keyup", event => {
            const key = event.key.toLowerCase();
            if (key === " ") this.keys.space = false;
            else if (key === "shift") this.keys.shift = false;
            else if (key in this.keys) this.keys[key] = false;
        });
    }

    postUpdate() {
        this.keys.spaceJustPressed = this.keys.space && !this.previousKeys.space;
        this.keys.shiftJustPressed = this.keys.shift && !this.previousKeys.shift;
        this.previousKeys.space = this.keys.space;
        this.previousKeys.shift = this.keys.shift;
    }
}

// ============================================================
// PLAYER CONTROLLER
// ============================================================
class PlayerController {
    constructor(playerMesh, camera) {
        this.mesh = playerMesh;
        this.camera = camera;
        this.moveSpeed = 12;
        this.acceleration = 65;
        this.deceleration = 85;
        this.airControl = 0.55;
        this.rotationSpeed = 16;
        this.jumpForce = 13;
        this.gravity = -36;
        this.dashSpeed = 32;
        this.dashDuration = 0.16;
        this.dashCooldown = 0.75;
        this.fallLimit = -18;
        this.respawnPoint = new BABYLON.Vector3(0, 3, 0);
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.grounded = false;
        this.canDoubleJump = false;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.state = "IDLE";
    }

    setRespawnPoint(position) {
        this.respawnPoint.copyFrom(position);
    }

    update(dt, input) {
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.isDashing = false;
        }

        let moveDir = this.getMovementDirection(input);

        if (input.keys.shiftJustPressed && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;
            if (moveDir.lengthSquared() === 0) {
                moveDir = new BABYLON.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
            } else moveDir.normalize();
            this.velocity.x = moveDir.x * this.dashSpeed;
            this.velocity.z = moveDir.z * this.dashSpeed;
            this.velocity.y = 0;
        }

        if (!this.isDashing) {
            const targetVelX = moveDir.x * this.moveSpeed;
            const targetVelZ = moveDir.z * this.moveSpeed;
            let accel = moveDir.lengthSquared() > 0 ? this.acceleration : this.deceleration;
            if (!this.grounded) accel *= this.airControl;
            this.velocity.x = MathUtils.moveTowards(this.velocity.x, targetVelX, accel * dt);
            this.velocity.z = MathUtils.moveTowards(this.velocity.z, targetVelZ, accel * dt);
            this.velocity.y += this.gravity * dt;
        }

        if (this.grounded) this.canDoubleJump = true;

        if (input.keys.spaceJustPressed) {
            if (this.grounded) {
                this.velocity.y = this.jumpForce;
                this.grounded = false;
            } else if (this.canDoubleJump && !this.isDashing) {
                this.velocity.y = this.jumpForce * 0.92;
                this.canDoubleJump = false;
            }
        }

        this.mesh.position.x += this.velocity.x * dt;
        this.mesh.position.z += this.velocity.z * dt;
        this.mesh.position.y += this.velocity.y * dt;

        PhysicsSystem.checkGroundCollision(this);

        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1) {
            const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
            this.mesh.rotation.y = MathUtils.lerpAngle(this.mesh.rotation.y, targetRotation, this.rotationSpeed * dt);
        }

        this.updateState();

        if (this.mesh.position.y < this.fallLimit) this.respawn();
    }

    getMovementDirection(input) {
        let forward = 0;
        let right = 0;
        if (input.keys.w || input.keys.arrowup) forward += 1;
        if (input.keys.s || input.keys.arrowdown) forward -= 1;
        if (input.keys.d || input.keys.arrowright) right += 1;
        if (input.keys.a || input.keys.arrowleft) right -= 1;

        const camForward = this.camera.getForwardRay().direction.clone();
        const camRight = this.camera.getDirection(BABYLON.Axis.X).clone();
        camForward.y = 0;
        camRight.y = 0;
        camForward.normalize();
        camRight.normalize();

        const movement = camForward.scale(forward).add(camRight.scale(right));
        if (movement.lengthSquared() > 0) movement.normalize();
        return movement;
    }

    updateState() {
        if (this.isDashing) this.state = "DASHING";
        else if (!this.grounded && this.velocity.y > 0) this.state = "JUMPING";
        else if (!this.grounded && this.velocity.y <= 0) this.state = "FALLING";
        else if (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.z) > 0.5) this.state = "RUNNING";
        else this.state = "IDLE";
    }

    respawn() {
        this.mesh.position.copyFrom(this.respawnPoint);
        this.velocity.setAll(0);
        this.grounded = false;
        this.canDoubleJump = true;
        this.isDashing = false;
        this.dashTimer = 0;

        // Death only resets PLAYER state. It must never reset coins.
        if (window.LevelSystem && typeof window.LevelSystem.onPlayerRespawn === "function") {
            window.LevelSystem.onPlayerRespawn();
        }
    }
}
