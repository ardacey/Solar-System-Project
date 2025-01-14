class SolarSimulation{

}

class PhysicsSimulation {

}

class RigidBody{
    force;
    mass;
    velocity;
    position;

    constructor(sceneObject, params) {
        Object.assign(this, params);
    }

    simulatePhysics(timeStep, subStep = 1) {
        if(subStep<1) {
            subStep = 1;
        }
        let sdt = timeStep/subStep;
        for (let i = 0; i < subStep; i++) {

        }
    }

    simStep(sdt){
        let a = vec3.scale(vec3.create(), this.force, 1/this.mass);
        let vdt = vec3.scale(vec3.create(), a, sdt);
        vec
    }
}