class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, 0); // Zero gravity as we'll handle it manually
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.celestialBodies = new Map(); // Map of SceneObject ID to physics body
        this.G = 6.67430e-11; // Gravitational constant (m³/kg/s²)

        // Set up collision detection
        this.world.defaultContactMaterial.restitution = 0.1;
        this.world.defaultContactMaterial.friction = 0.1;

        // Contact event listener
        this.world.addEventListener('beginContact', (event) => {
            console.log("test")
            this.handleCollision(event.bodyA, event.bodyB);
        });
    }

    addCelestialBody(sceneObject, params) {
        const {
            mass,
            radius,
            initialVelocity = [0, 0, 0],
            centralBodyId = null,  // ID of the body to orbit around
            orbitalDistance = null,
            orbitalSpeed = null,
            isSmallBody = false,   // Flag for asteroids, debris, etc.
            collisionResponse = true, // Whether body responds to collisions
            position = null        // Optional specific position
        } = params;

        // Create physics body with real-world values
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            velocity: new CANNON.Vec3(...initialVelocity),
            collisionResponse: collisionResponse
        });

        body.sceneObjectId = sceneObject.ID;
        body.isSmallBody = isSmallBody;

        // Set initial position
        if (position) {
            body.position.set(...position);
        } else if (centralBodyId && orbitalDistance) {
            this.setupOrbitingBody(body, centralBodyId, orbitalDistance, orbitalSpeed);
        } else {
            body.position.set(0, 0, 0);
        }

        console.log('Creating physics body:', {
            id: sceneObject.ID,
            mass: params.mass,
            radius: params.radius,
            position: body.position,
            collisionResponse: body.collisionResponse
        });

        // Verify collision detection settings
        console.log('Collision settings:', {
            collisionResponse: body.collisionResponse,
            collisionFilterGroup: body.collisionFilterGroup,
            collisionFilterMask: body.collisionFilterMask,
            type: body.type
        });

        this.world.addBody(body);
        this.celestialBodies.set(sceneObject.ID, body);
        return body;
    }

    setupOrbitingBody(body, centralBodyId, orbitalDistance, customOrbitalSpeed = null) {
        const centralBody = this.celestialBodies.get(centralBodyId);
        if (!centralBody) return;

        // Calculate random angle for position in orbit
        const angle = Math.random() * Math.PI * 2;

        // Set position relative to central body
        body.position.x = centralBody.position.x + orbitalDistance * Math.cos(angle);
        body.position.z = centralBody.position.z + orbitalDistance * Math.sin(angle);
        body.position.y = centralBody.position.y;

        // Calculate orbital velocity
        const orbitalSpeed = customOrbitalSpeed ||
            Math.sqrt(this.G * centralBody.mass / orbitalDistance);

        // Set velocity perpendicular to position vector for circular orbit
        body.velocity.x = -orbitalSpeed * Math.sin(angle);
        body.velocity.z = orbitalSpeed * Math.cos(angle);
        body.velocity.y = 0;

        // Add central body's velocity to maintain relative orbit
        body.velocity.vadd(centralBody.velocity, body.velocity);
    }

    handleCollision(bodyA, bodyB) {
        // Handle different collision scenarios
        const massRatio = bodyA.mass / bodyB.mass;

        if (bodyA.isSmallBody && !bodyB.isSmallBody) {
            // Small body hits large body
            this.absorbBody(bodyB, bodyA);
        } else if (!bodyA.isSmallBody && bodyB.isSmallBody) {
            // Large body hits small body
            this.absorbBody(bodyA, bodyB);
        } else if (massRatio > 100) {
            // Body A much larger - absorbs B
            this.absorbBody(bodyA, bodyB);
        } else if (massRatio < 0.01) {
            // Body B much larger - absorbs A
            this.absorbBody(bodyB, bodyA);
        } else {
            // Similar mass - handle elastic collision
            // Already handled by CANNON.js physics
        }
    }

    absorbBody(largerBody, smallerBody) {
        // Combine masses
        const totalMass = largerBody.mass + smallerBody.mass;

        // Combine velocities based on conservation of momentum
        const newVel = new CANNON.Vec3();
        largerBody.velocity.scale(largerBody.mass, newVel);
        const smallVel = new CANNON.Vec3();
        smallerBody.velocity.scale(smallerBody.mass, smallVel);
        newVel.vadd(smallVel, newVel);
        newVel.scale(1/totalMass, largerBody.velocity);

        // Update larger body
        largerBody.mass = totalMass;

        // Remove smaller body
        this.removeBody(smallerBody.sceneObjectId);

        // Dispatch collision event for visual effects/game logic
        const event = new CustomEvent('celestialCollision', {
            detail: {
                absorberId: largerBody.sceneObjectId,
                absorbedId: smallerBody.sceneObjectId,
                position: smallerBody.position,
                totalMass: totalMass
            }
        });
        window.dispatchEvent(event);
    }

    removeBody(sceneObjectId) {
        const body = this.celestialBodies.get(sceneObjectId);
        if (body) {
            this.world.removeBody(body);
            this.celestialBodies.delete(sceneObjectId);
        }
    }

    updateGravitationalForces() {
        // Reset forces
        this.celestialBodies.forEach(body => {
            body.force.set(0, 0, 0);
        });

        // Calculate gravitational forces between all pairs of bodies
        const bodies = Array.from(this.celestialBodies.values());
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const body1 = bodies[i];
                const body2 = bodies[j];

                const distance = body1.position.distanceTo(body2.position);
                const forceMagnitude = this.G * (body1.mass * body2.mass) / (distance * distance);

                // Calculate force direction
                const forceDir = new CANNON.Vec3();
                body2.position.vsub(body1.position, forceDir);
                forceDir.normalize();
                forceDir.scale(forceMagnitude, forceDir);

                // Apply forces (action-reaction pair)
                body1.force.vadd(forceDir, body1.force);
                forceDir.scale(-1, forceDir);
                body2.force.vadd(forceDir, body2.force);
            }
        }
    }

    update(deltaTime) {
        this.updateGravitationalForces();
        this.world.step(deltaTime);
    }

    getScaledBodyPosition(sceneObjectId) {
        const body = this.celestialBodies.get(sceneObjectId);
        if (body) {
            const scaleFactor = CelestialBodyScript.DISTANCE_SCALE;
            return [
                body.position.x * scaleFactor,
                body.position.y * scaleFactor,
                body.position.z * scaleFactor
            ];
        }
        return null;
    }

    getRealBodyPosition(sceneObjectId) {
        const body = this.celestialBodies.get(sceneObjectId);
        if (body) {
            return [body.position.x, body.position.y, body.position.z];
        }
        return null;
    }

    getBodyVelocity(sceneObjectId) {
        const body = this.celestialBodies.get(sceneObjectId);
        if (body) {
            return [body.velocity.x, body.velocity.y, body.velocity.z];
        }
        return null;
    }

    applyForce(sceneObjectId, force, worldPoint = null) {
        const body = this.celestialBodies.get(sceneObjectId);
        if (body) {
            if (worldPoint) {
                body.applyForce(
                    new CANNON.Vec3(force[0], force[1], force[2]),
                    new CANNON.Vec3(worldPoint[0], worldPoint[1], worldPoint[2])
                );
            } else {
                body.force.vadd(new CANNON.Vec3(force[0], force[1], force[2]), body.force);
            }
        }
    }
}

class PhysicsIntegrationScript extends SceneObjectScript {
    constructor(sceneObject, physicsWorld, params = {}) {
        super(sceneObject);
        this.physicsWorld = physicsWorld;
        this.params = params;
        this.initialized = false;
    }

    Start() {
        super.Start();
        if (!this.initialized) {
            const celestialScript = this.sceneObject.SceneObjectScripts.find(
                script => script instanceof CelestialBodyScript
            );

            if (celestialScript) {
                const params = {
                    mass: celestialScript.mass,
                    radius: celestialScript.radius,
                    isSmallBody: this.params.isSmallBody || false,
                    collisionResponse: this.params.collisionResponse !== false,
                    ...this.params
                };

                if (celestialScript instanceof PlanetScript && celestialScript.centralStar) {
                    params.centralBodyId = celestialScript.centralStar.sceneObject.ID;
                    params.orbitalDistance = celestialScript.orbitalDistance;
                }

                this.physicsBody = this.physicsWorld.addCelestialBody(
                    this.sceneObject,
                    params
                );

                this.initialized = true;

                // Listen for collision events
                window.addEventListener('celestialCollision', (event) => {
                    if (event.detail.absorbedId === this.sceneObject.ID) {
                        // Handle object being absorbed
                        this.handleAbsorption();
                    }
                });
            }
        }
    }

    Update() {
        super.Update();
        if (this.initialized) {
            const scaledPosition = this.physicsWorld.getScaledBodyPosition(this.sceneObject.ID);
            if (scaledPosition) {
                vec3.copy(this.sceneObject.transform.position, scaledPosition);
            }
        }
    }

    handleAbsorption() {
        // Clean up this object when absorbed
        this.sceneObject.scene.listOfSceneObjects =
            this.sceneObject.scene.listOfSceneObjects.filter(obj => obj !== this.sceneObject);
    }
}