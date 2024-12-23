"use strict";



async function loadShaders(){
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("WebGL not supported!");
        return;
    }
    const shapeShader = await initShader("Shaders/ShapeVertex.glsl","Shaders/ShapeFragment.glsl",gl);
    return [shapeShader]
}

function clearGlBuffer(gl){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

loadShaders().then(shaders => test(shaders))
//after the loading of the shader the main function is called and executed with said shaders

let displacementFunction = function (maxDisplacement, factorOfDisplacement) {
    return Math.sin(factorOfDisplacement) * maxDisplacement;
}



class ZoomInOut extends SceneObjectScript{
    maxDisplacement;
    factorOfDisplacement;

    constructor(sceneObject, maxDisplacement = 200) {
        super(sceneObject);
        this.maxDisplacement = maxDisplacement;
    }

    Start() {
        super.Start();
        this.getTransform().position = vec3.fromValues(-6,0,-4);
        this.factorOfDisplacement = 0;
    }

    Update() {
        let displacement = displacementFunction(this.maxDisplacement, this.factorOfDisplacement);
        this.getTransform().position = vec3.fromValues(this.getTransform().position[0],this.getTransform().position[1],displacement);
        this.factorOfDisplacement += 0.01;
    }

}

class RotateAxisY extends SceneObjectScript{
    rotationStep;
    Start() {
        super.Start();
        this.rotationStep = 1;
    }

    Update() {
        super.Update();
        let amount = this.rotationStep
        vec3.add(this.sceneObject.transform.rotation,this.sceneObject.transform.rotation, vec3.fromValues(0,amount,0));
    }
}

class UpDown extends SceneObjectScript{
    MaxY;
    factorOfDisplacement;

    constructor(sceneObject, MaxY = 2) {
        super(sceneObject);
        this.MaxY = MaxY;
    }
    Start() {
        super.Start();
        this.getTransform().position = vec3.fromValues(6,2,0);
        this.factorOfDisplacement = 0;

    }

    Update() {
        super.Update();
        let displacement = displacementFunction(this.MaxY, this.factorOfDisplacement);
        this.getTransform().position = vec3.fromValues(this.getTransform().position[0], displacement, this.getTransform().position[2]);
        this.factorOfDisplacement += 0.03;
    }

}


async function test(shaders) {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("WebGL not supported!");
        return;
    }

    const shapeShader = shaders[0];

    async function setupSceneObjects(numOfMeshes) {

        let returnList = []
        for (let i = 0; i < numOfMeshes; i++) {
            let mesh = await ReadFile("monkey_head.obj").then(text => loadMeshData(text,gl));
            let sceneObject = new SceneObject(mesh,shapeShader);
            returnList.push(sceneObject);
        }
        return returnList;
    }


    let sceneObjects = await setupSceneObjects(3);


    shapeShader.setUniform3FVector("lightPos", [100, -100, 100]);
    shapeShader.setUniform3FVector("lightColor", [1, 1, 1]);
    shapeShader.setUniform3FVector("objectColor", [0.5, 0.5, 0.5]);


    BindSceneObject(sceneObjects[1], UpDown)
    BindSceneObject(sceneObjects[0], RotateAxisY)
    BindSceneObject(sceneObjects[2], ZoomInOut,[-200]);

    let scene = new Scene(sceneObjects,new Camera(vec3.fromValues(0,0,720)),canvas);

    eventHandlers();
    function eventHandlers() {
        let activeButton = null;

        function updateMouseMovement(event) {
            if (activeButton === 0) {
                // Left button: Camera rotation
                scene.camera.processCameraRotation(event.movementX, -event.movementY);
            } else if (activeButton === 2) {
                // Right button: Camera lateral movement
                scene.camera.processCameraMovement(event.movementX, -event.movementY);
            }
        }
        function handleMouseDown(event) {
            activeButton = event.button; // Set the active button
        }

        function handleMouseUp(event) {
            if (event.button === activeButton) {
                activeButton = null; // Clear active button if released
            }
        }



        pointerLockEvents();
        function pointerLockEvents() {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'p') {
                    if (!document.pointerLockElement) {
                        canvas.requestPointerLock({
                            unadjustedMovement: true,
                        });
                    }
                }
            });
            document.addEventListener('pointerlockchange', () => {
                if (document.pointerLockElement === canvas) {
                    document.addEventListener('mousemove', updateMouseMovement);
                    document.addEventListener('mousedown', handleMouseDown);
                    document.addEventListener('mouseup', handleMouseUp);
                } else {
                    console.log('Pointer unlocked');
                    document.removeEventListener('mousemove', updateMouseMovement);
                    document.removeEventListener('mousedown', handleMouseDown);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.code === 'Escape' && document.pointerLockElement === canvas) {
                    document.exitPointerLock();
                }
            });

            document.addEventListener("wheel",(e)=>{
                scene.camera.processZoom(e.deltaY <= 0 ? 1 : -1);
            });
        }
    }

    function resizeCanvasToDisplaySize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;

            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    scene.Start();

    render();
    function render() {

        resizeCanvasToDisplaySize();

        clearGlBuffer(gl);

        scene.Update()

        requestAnimationFrame(render);
    }
}