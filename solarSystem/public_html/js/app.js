"use strict";

let shapeShader;

function clearGlBuffer(gl){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

main()


async function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("WebGL not supported!");
        return;
    }

    gl.enable(gl.CULL_FACE)

    async function setupScene() {
        // Initialize shaders
        const celestialShader = await initShader("glsl/SunVertex.glsl", "glsl/SunFragment.glsl", gl);
        const skyboxShader = await initShader("glsl/skybox-vertex.glsl", "glsl/skybox-fragment.glsl", gl);
        shapeShader = await initShader("glsl/ShapeVertex.glsl", "glsl/ShapeFragment.glsl", gl)

        let meshMap = await OBJ.downloadModels([{
            obj:"Models/SunModel/SunModel.obj",
            mtl:"Models/SunModel/SunModel.mtl",
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
        const sunObject = new SceneObject(sunMesh, celestialShader);
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
        const earthObject = new SceneObject(earthMesh, celestialShader);
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

        //Create CameraFollower
        const cameraObject = SceneObject.CreateEmptySceneObject();
        BindSceneObject(cameraObject, CameraFollowerScript,[{sun:sunObject,earth:earthObject}]);
        sceneObjects.push(cameraObject);



        // Create scene
        const scene = new Scene(sceneObjects, new Camera(vec3.fromValues(0, 0, 360)), canvas);
        return scene;
    }

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

        interfaceHandler();
        function interfaceHandler() {
            const centerSun = document.getElementById("centerSun");
            const centerEarth = document.getElementById("centerEarth");

            const cameraHandler = scene.getInstancesOf(CameraFollowerScript)[0];

            centerSun?.addEventListener("click", () => cameraHandler.lockCamera("sun"));
            centerEarth?.addEventListener("click", () => cameraHandler.lockCamera("earth"));

            handlePlanetClick(null);
            function handlePlanetClick(planetData) {
                if (planetData) {
                    updateInfoBox(planetData);
                }
            }

            function updateInfoBox(planet) {
                const infoContent = document.getElementById("infoContent");
                if (!planet) {
                    infoContent.innerHTML = `<strong>No planet data available.</strong>`;
                    return;
                }

                const {
                    name = "Unknown",
                    mass = 0,
                    radius = 0,
                    surfaceTemperature: temperature = 0,
                    velocity = 0,
                    rotationPeriod = 0,
                    obliquity = 0,
                    argumentOfObliquity = 0,
                    yaw = 0,
                    position: { x = 0, y = 0, z = 0 } = {},
                    orbitalPeriod = 0,
                    orbitalDistance = 0,
                    angle = 0,
                    luminosity = 0,
                } = planet;

                infoContent.innerHTML = `
                    <strong>Name:</strong> ${name} <br>
                    <strong>Mass:</strong> ${mass.toExponential(2)} kg <br>
                    <strong>Radius:</strong> ${radius.toFixed(2)} m <br>
                    <strong>Temperature:</strong> ${temperature.toFixed(2)} K <br>
                    <strong>Velocity:</strong> ${velocity.toFixed(2)} rad/s <br>
                    <strong>Rotation Period:</strong> ${rotationPeriod.toFixed(2)} s <br>
                    <strong>Obliquity:</strong> ${obliquity.toFixed(2)}° <br>
                    <strong>Argument of Obliquity:</strong> ${argumentOfObliquity.toFixed(2)}° <br>
                    <strong>Yaw:</strong> ${yaw.toFixed(2)}° <br>
                    <strong>Position:</strong> (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) <br>
                    <strong>Orbital Period:</strong> ${orbitalPeriod.toFixed(2)} s <br>
                    <strong>Orbital Distance:</strong> ${orbitalDistance.toExponential(2)} m <br>
                    <strong>Angle:</strong> ${angle.toFixed(2)}° <br>
                    <strong>Luminosity:</strong> ${luminosity.toExponential(2)} W <br>
                `;
            }
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