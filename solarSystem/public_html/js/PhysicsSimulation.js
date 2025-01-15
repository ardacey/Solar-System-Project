class PhysicsSimulation {
    timeStep = 600;
    physicsObjects = []
    constructor() {

    }

    updateForces(){
        for (const obj of this.physicsObjects) {
            obj.simForce();
        }
    }

    stepSim(){
        this.updateForces();

        for (const obj of this.physicsObjects) {
            obj.simulatePhysics(this.timeStep, 5);
        }
    }

    addPhysicsObject(object) {
        this.physicsObjects.push(object);
    }

    removePhysicsObject(object) {
        const index = this.physicsObjects.indexOf(object);
        if (index > -1) {
            this.physicsObjects.splice(index, 1);
        }
    }


}

class SolarSimulation extends PhysicsSimulation{
    constructor(scene) {
        super();
        this.G = 6.67430e-11; // Gravitational constant
        this.initPhysicsObjects(scene.listOfSceneObjects);
        this.initOrbitalVelocities();
    }

    initPhysicsObjects(sceneObjects) {
        for (const obj of sceneObjects) {
            if(obj.isInstance(RigidBody)){
                this.addPhysicsObject(obj.getInstance(RigidBody));
            }
        }
    }

    initOrbitalVelocities() {
        // Find the central body (usually the most massive object)
        let centralBody = this.findCentralBody();

        if (!centralBody) return;

        // Calculate orbital velocities for each object relative to the central body
        for (const obj of this.physicsObjects) {
            if (obj === centralBody || obj.isStatic) continue;

            // Calculate distance vector from central body to orbiting body
            const distance = vec3.create();
            vec3.subtract(distance, obj.position, centralBody.position);
            const r = vec3.length(distance);

            // Calculate orbital velocity magnitude for circular orbit
            // v = sqrt(G * M / r) where M is the mass of the central body
            const velocityMagnitude = Math.sqrt(this.G * centralBody.getMass() / r);

            // Calculate direction perpendicular to radius vector in the orbital plane
            // For simplicity, we'll assume orbits in the X-Z plane
            const direction = vec3.create();
            vec3.normalize(direction, distance);

            // Create perpendicular vector (cross product with up vector)
            const up = vec3.fromValues(0, 1, 0);
            const velocityDirection = vec3.create();
            vec3.cross(velocityDirection, direction, up);
            vec3.normalize(velocityDirection, velocityDirection);

            // Set the orbital velocity
            vec3.scale(obj.velocity, velocityDirection, velocityMagnitude);
            console.log(obj.velocity);
        }
    }

    findCentralBody() {
        // Find the most massive object (usually the star)
        let centralBody = null;
        let maxMass = 0;

        for (const obj of this.physicsObjects) {
            if (obj.getMass() > maxMass) {
                maxMass = obj.getMass();
                centralBody = obj;
            }
        }

        if (centralBody) {
            // Make the central body static (won't move)
            centralBody.isStatic = true;
        }

        return centralBody;
    }
    calculateGravityEffect() {
        // Calculate gravitational forces between all pairs of objects
        for (const obj of this.physicsObjects) {
            // Reset forces after simulation step
            vec3.zero(obj.force);
        }
        for (let i = 0; i < this.physicsObjects.length; i++) {
            for (let j = i + 1; j < this.physicsObjects.length; j++) {
                const obj1 = this.physicsObjects[i];
                const obj2 = this.physicsObjects[j];

                // Calculate distance vector between objects
                const distance = vec3.create();
                vec3.subtract(distance, obj2.position, obj1.position);

                // Calculate magnitude of distance
                const r = vec3.length(distance);

                // Normalize distance vector
                const direction = vec3.normalize(vec3.create(), distance);

                // Calculate gravitational force magnitude
                // F = G * (m1 * m2) / r^2
                const forceMagnitude = this.G * (obj1.getMass() * obj2.getMass()) / (r * r);

                // Calculate force vectors
                const force = vec3.scale(vec3.create(), direction, forceMagnitude);

                // Apply forces (equal and opposite)
                vec3.add(obj1.force, obj1.force, force);
                vec3.scale(force, force, -1);
                vec3.add(obj2.force, obj2.force, force);
            }
        }
    }

    stepSim() {
        this.calculateGravityEffect();
        super.stepSim();
    }


}

class RigidBody extends SceneObjectScript{
    force;
    mass;
    massMultiplier = 1;
    acceleration;
    velocity;
    position;
    isStatic = false;

    constructor(sceneObject, params) {
        super(sceneObject);

        // Initialize vectors
        this.force = vec3.create();
        this.acceleration = vec3.create();
        this.velocity = vec3.create();
        this.position = vec3.create();

        // Set mass and other parameters
        this.mass = sceneObject.getInstance(CelestialBodyScript)?.mass;

        if(isNaN(this.mass)){
            this.mass = 100;
        }

        Object.assign(this, params);
    }

    Start() {
        super.Start();
        vec3.scale(this.position, this.sceneObject.transform.position, 1/CelestialBodyScript.DISTANCE_SCALE);
    }

    Update() {
        super.Update();

        if(!this.isStatic){
            vec3.scale(this.sceneObject.transform.position, this.position, CelestialBodyScript.DISTANCE_SCALE);
        }
        else {
            vec3.scale(this.position, this.sceneObject.transform.position , 1/CelestialBodyScript.DISTANCE_SCALE);
        }
    }

    simulatePhysics(timeStep, subStep = 1) {
        if(this.isStatic){
            return;
        }

        if(subStep<1) {
            subStep = 1;
        }
        let sdt = timeStep/subStep;
        for (let i = 0; i < subStep; i++) {
            this.simStep(sdt)
        }

    }



    simForce() {
        this.acceleration = vec3.scale(vec3.create(), this.force, 1/this.getMass());
    }

    getMass(){
        return this.mass * this.massMultiplier;
    }

    simStep(sdt){

        let vdt = vec3.scale(vec3.create(), this.acceleration, sdt);
        vec3.add(this.velocity,this.velocity,vdt);

        let xdt = vec3.scale(vec3.create(), this.velocity, sdt);
        vec3.add(this.position,this.position,xdt);
    }
}