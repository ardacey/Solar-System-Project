"use strict";





function clearGlBuffer(gl){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

test()
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


function loadTexture(url,gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Fill with a placeholder pixel until the image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255]));

    const image = new Image();
    image.onload = () => {
        // Get max texture size supported by GPU
        const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        // Create a canvas to resize the image if needed
        const canvas = document.createElement('canvas');
        let width = image.width;
        let height = image.height;

        // Scale down if image is too large
        if (width > maxSize || height > maxSize) {
            const scale = maxSize / Math.max(width, height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }

        // Enable mipmapping
        gl.generateMipmap(gl.TEXTURE_2D);

        // Set texture parameters
        if (url.includes('stars_milky_way')) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        console.log(`Loaded texture ${url}: ${width}x${height} (original: ${image.width}x${image.height})`);
    };

    image.onerror = () => {
        console.error(`Failed to load texture: ${url}`);
    };

    image.src = url;
    return texture;
}



async function test() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("WebGL not supported!");
        return;
    }

    gl.enable(gl.CULL_FACE)

    async function setupScene() {
        // Initialize shaders
        const shapeShader = await initShader("glsl/SunVertex.glsl", "glsl/SunFragment.glsl", gl);
        const skyboxShader = await initShader("glsl/skybox-vertex.glsl", "glsl/skybox-fragment.glsl", gl);

        let meshMap = await OBJ.downloadModels([{
            obj:"/public_html/Models/SunModel/SunModel.obj",
            mtl:"/public_html/Models/SunModel/SunModel.mtl",
            downloadMtlTextures: true,
            name:"sunMesh"
        }])

        // Create scene objects
        const sceneObjects = [];

        // Create skybox
        const skyboxObject = SceneObject.CreateEmptySceneObject();
        BindSceneObject(skyboxObject, SkyboxScript, [skyboxShader, "textures/8k/8k_stars_milky_way.jpg"]);
        sceneObjects.push(skyboxObject);


        // Create sun
        const sunMesh = new Mesh(meshMap["sunMesh"],gl);
        const sunObject = new SceneObject(sunMesh, shapeShader);
        BindSceneObject(sunObject, StarScript, [{
            mass: 1.989e30,
            radius: 696340000,
            surfaceTemperature: 5778,
            angularVelocity: 0,
            rotationPeriod: 25.38 * 24 * 3600,
            obliquity: 7.25,
            argumentOfObliquity: 0,
            yaw: 0,
            luminosity: 3.828e26
        }]);
        sceneObjects.push(sunObject);

        // Create earth
        const earthMesh = new Mesh(meshMap["sunMesh"],gl);
        const earthObject = new SceneObject(earthMesh, shapeShader);
        const earthScript = BindSceneObject(earthObject, PlanetScript, [{
            mass: 5.972e24,
            radius: 6371000,
            surfaceTemperature: 288,
            angularVelocity: 7.2921159e-5,
            rotationPeriod: 24 * 3600,
            obliquity: 23.44,
            argumentOfObliquity: 0,
            yaw: 0,
            orbitalPeriod: 365.256 * 24 * 3600,
            orbitalDistance: 149.6e9
        }]);
        earthScript.centralStar = sunObject.SceneObjectScripts.find(script => script instanceof StarScript);
        sceneObjects.push(earthObject);


        // Create scene
        const scene = new Scene(sceneObjects, new Camera(vec3.fromValues(0, 0, 360)), canvas);
        return scene;
    }

        // shapeShader.setUniform3FVector("lightPos", [100, -100, 100]);
        // shapeShader.setUniform3FVector("lightColor", [1, 1, 1]);


    const scene = await setupScene();




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

    render(0);
    function render(timeStamp) {
        time.UpdateTime(timeStamp);

        resizeCanvasToDisplaySize();

        clearGlBuffer(gl);

        scene.Update();


        requestAnimationFrame(render);
    }
}