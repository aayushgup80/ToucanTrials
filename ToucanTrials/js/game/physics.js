// ============================================================
// MATH UTILITIES
// ============================================================

console.log("PHYSICS.JS LOADED");

const MathUtils = {

    moveTowards(current, target, maxDelta) {

        if (Math.abs(target - current) <= maxDelta) {
            return target;
        }

        return current +
            Math.sign(target - current) *
            maxDelta;
    },

    lerpAngle(current, target, t) {

        let delta = target - current;

        while (delta > Math.PI) {
            delta -= Math.PI * 2;
        }

        while (delta < -Math.PI) {
            delta += Math.PI * 2;
        }

        return current +
            delta *
            Math.min(t, 1.0);
    }

};


console.log("CREATING PHYSICS SYSTEM");

const PhysicsSystem = {

    platforms: [],

    init(scene) {

        this.platforms = [];

    },

    registerPlatform(mesh) {

        if (
            mesh &&
            !this.platforms.includes(mesh)
        ) {

            this.platforms.push(mesh);

        }

    },

    checkGroundCollision(playerController) {
        const player = playerController.mesh;
        playerController.grounded = false;

        player.computeWorldMatrix(true);
        const pBounds = player.getBoundingInfo().boundingBox;

        for (const platform of this.platforms) {
            if (!platform || !platform.isEnabled()) {
                continue;
            }

            platform.computeWorldMatrix(true);
            const bBounds = platform.getBoundingInfo().boundingBox;

            const pMin = pBounds.minimumWorld;
            const pMax = pBounds.maximumWorld;

            const bMin = bBounds.minimumWorld;
            const bMax = bBounds.maximumWorld;

            // ------------------------------------------------
            // OVERLAP CHECK (AABB)
            // ------------------------------------------------
            const overlapX = Math.min(pMax.x - bMin.x, bMax.x - pMin.x);
            const overlapY = Math.min(pMax.y - bMin.y, bMax.y - pMin.y);
            const overlapZ = Math.min(pMax.z - bMin.z, bMax.z - pMin.z);

            if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {

                const playerCenterY = (pMin.y + pMax.y) / 2;
                const platformCenterY = (bMin.y + bMax.y) / 2;

                const playerCenterX = (pMin.x + pMax.x) / 2;
                const platformCenterX = (bMin.x + bMax.x) / 2;

                const playerCenterZ = (pMin.z + pMax.z) / 2;
                const platformCenterZ = (bMin.z + bMax.z) / 2;

                // --------------------------------------------
                // RESOLVE PENETRATION ALONG MINIMUM OVERLAP AXIS
                // --------------------------------------------

                if (overlapY <= overlapX && overlapY <= overlapZ) {

                    // Standing on Top of Platform
                    if (playerCenterY >= platformCenterY) {
                        player.position.y += overlapY;

                        if (playerController.velocity.y < 0) {
                            playerController.velocity.y = 0;
                        }

                        playerController.grounded = true;
                    }
                    // Hitting Ceiling From Below
                    else {
                        player.position.y -= overlapY;

                        if (playerController.velocity.y > 0) {
                            playerController.velocity.y = 0;
                        }
                    }

                }
                else if (overlapX <= overlapZ) {

                    if (playerCenterX >= platformCenterX) {
                        player.position.x += overlapX;
                    } else {
                        player.position.x -= overlapX;
                    }

                    playerController.velocity.x = 0;

                }
                else {

                    if (playerCenterZ >= platformCenterZ) {
                        player.position.z += overlapZ;
                    } else {
                        player.position.z -= overlapZ;
                    }

                    playerController.velocity.z = 0;

                }

                // Update bounding info for subsequent iterations in the frame
                player.computeWorldMatrix(true);
            }
        }
    }

};

