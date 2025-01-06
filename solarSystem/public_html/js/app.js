"use strict";

let shapeShader;
let targetBody = "Sun";

function clearGlBuffer(gl){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

main();


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
        const sunShader = await initShader("glsl/test2vertex.glsl", "glsl/test2frag.glsl", gl);
        const skyboxShader = await initShader("glsl/skybox-vertex.glsl", "glsl/skybox-fragment.glsl", gl);
        shapeShader = await initShader("glsl/ShapeVertex.glsl", "glsl/ShapeFragment.glsl", gl)

        let meshMap = await OBJ.downloadModels([
            {
                obj:"Models/SunModel/SunModel.obj",
                mtl:"Models/SunModel/SunModel.mtl",
                downloadMtlTextures: true,
                name:"sunMesh"
            },
            {
                obj:"Models/MercuryModel/MercuryModel.obj",
                mtl:"Models/MercuryModel/MercuryModel.mtl",
                downloadMtlTextures: true,
                name:"mercuryMesh"
            },
            {
                obj:"Models/VenusModel/VenusModel.obj",
                mtl:"Models/VenusModel/VenusModel.mtl",
                downloadMtlTextures: true,
                name:"venusMesh"
            },
            {
                obj:"Models/EarthModel/EarthModel.obj",
                mtl:"Models/EarthModel/EarthModel.mtl",
                downloadMtlTextures: true,
                name:"earthMesh"
            },
            {
                obj:"Models/MarsModel/MarsModel.obj",
                mtl:"Models/MarsModel/MarsModel.mtl",
                downloadMtlTextures: true,
                name:"marsMesh"
            },
            {
                obj:"Models/JupiterModel/JupiterModel.obj",
                mtl:"Models/JupiterModel/JupiterModel.mtl",
                downloadMtlTextures: true,
                name:"jupiterMesh"
            },
            {
                obj:"Models/SaturnModel/SaturnModel.obj",
                mtl:"Models/SaturnModel/SaturnModel.mtl",
                downloadMtlTextures: true,
                name:"saturnMesh"
            },
            {
                obj:"Models/UranusModel/UranusModel.obj",
                mtl:"Models/UranusModel/UranusModel.mtl",
                downloadMtlTextures: true,
                name:"uranusMesh"
            },
            {
                obj:"Models/NeptuneModel/NeptuneModel.obj",
                mtl:"Models/NeptuneModel/NeptuneModel.mtl",
                downloadMtlTextures: true,
                name:"neptuneMesh"
            },
            {
                obj:"Models/PlutoModel/PlutoModel.obj",
                mtl:"Models/PlutoModel/PlutoModel.mtl",
                downloadMtlTextures: true,
                name:"plutoMesh"
            },
        ])

        // Create scene objects
        const sceneObjects = [];

        // Create skybox
        const skyboxObject = SceneObject.CreateEmptySceneObject();
        BindSceneObject(skyboxObject, SkyboxScript, [skyboxShader, "textures/8k/8k_stars_milky_way.jpg"]);
        sceneObjects.push(skyboxObject);


        // Create Sun
        const sunMesh = new Mesh(meshMap["sunMesh"],gl);

        const sunObject = new SceneObject(sunMesh, celestialShader);
        BindSceneObject(sunObject, StarScript, [CelestialBodyProperties.Sun]);
        sceneObjects.push(sunObject);

        const sunScript = sunObject.SceneObjectScripts.find(script => script instanceof StarScript);

        // Create Mercury
        const mercuryMesh = new Mesh(meshMap["mercuryMesh"],gl);
        const mercuryObject = new SceneObject(mercuryMesh, celestialShader);
        const mercuryScript = BindSceneObject(mercuryObject, PlanetScript, [CelestialBodyProperties.Mercury]);
        mercuryScript.centralStar = sunScript;
        sceneObjects.push(mercuryObject);

        // Create Venus
        const venusMesh = new Mesh(meshMap["venusMesh"],gl);
        const venusObject = new SceneObject(venusMesh, celestialShader);
        const venusScript = BindSceneObject(venusObject, PlanetScript, [CelestialBodyProperties.Venus]);
        venusScript.centralStar = sunScript;
        sceneObjects.push(venusObject);

        // Create Earth
        const earthMesh = new Mesh(meshMap["earthMesh"],gl);
        const earthObject = new SceneObject(earthMesh, celestialShader);
        const earthScript = BindSceneObject(earthObject, PlanetScript, [CelestialBodyProperties.Earth]);
        earthScript.centralStar = sunScript;
        sceneObjects.push(earthObject);

        // Create Mars
        const marsMesh = new Mesh(meshMap["marsMesh"],gl);
        const marsObject = new SceneObject(marsMesh, celestialShader);
        const marsScript = BindSceneObject(marsObject, PlanetScript, [CelestialBodyProperties.Mars]);
        marsScript.centralStar = sunScript;
        sceneObjects.push(marsObject);

        // Create Jupiter
        const jupiterMesh = new Mesh(meshMap["jupiterMesh"],gl);
        const jupiterObject = new SceneObject(jupiterMesh, celestialShader);
        const jupiterScript = BindSceneObject(jupiterObject, PlanetScript, [CelestialBodyProperties.Jupiter]);
        jupiterScript.centralStar = sunScript;
        sceneObjects.push(jupiterObject);

        // Create Saturn
        const saturnMesh = new Mesh(meshMap["saturnMesh"],gl);
        const saturnObject = new SceneObject(saturnMesh, celestialShader);
        const saturnScript = BindSceneObject(saturnObject, PlanetScript, [CelestialBodyProperties.Saturn]);
        saturnScript.centralStar = sunScript;
        sceneObjects.push(saturnObject);

        // Create Uranus
        const uranusMesh = new Mesh(meshMap["uranusMesh"],gl);
        const uranusObject = new SceneObject(uranusMesh, celestialShader);
        const uranusScript = BindSceneObject(uranusObject, PlanetScript, [CelestialBodyProperties.Uranus]);
        uranusScript.centralStar = sunScript
        sceneObjects.push(uranusObject);

        // Create Neptune
        const neptuneMesh = new Mesh(meshMap["neptuneMesh"],gl);
        const neptuneObject = new SceneObject(neptuneMesh, celestialShader);
        const neptuneScript = BindSceneObject(neptuneObject, PlanetScript, [CelestialBodyProperties.Neptune]);
        neptuneScript.centralStar = sunScript;
        sceneObjects.push(neptuneObject);

        // Create Pluto
        const plutoMesh = new Mesh(meshMap["plutoMesh"],gl);
        const plutoObject = new SceneObject(plutoMesh, celestialShader);
        const plutoScript = BindSceneObject(plutoObject, PlanetScript, [CelestialBodyProperties.Pluto]);
        plutoScript.centralStar = sunScript;
        sceneObjects.push(plutoObject);

        //Create CameraFollower
        const cameraObject = SceneObject.CreateEmptySceneObject();
        BindSceneObject(cameraObject, CameraFollowerScript,[{
            sun:sunObject,
            mercury:mercuryObject,
            venus:venusObject,
            earth:earthObject,
            mars:marsObject,
            jupiter:jupiterObject,
            saturn:saturnObject,
            uranus:uranusObject,
            neptune:neptuneObject,
            pluto:plutoObject,
        }]);
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
            const centerMercury = document.getElementById("centerMercury");
            const centerVenus = document.getElementById("centerVenus");
            const centerEarth = document.getElementById("centerEarth");
            const centerMars = document.getElementById("centerMars");
            const centerJupiter = document.getElementById("centerJupiter");
            const centerSaturn = document.getElementById("centerSaturn");
            const centerUranus = document.getElementById("centerUranus");
            const centerNeptune = document.getElementById("centerNeptune");
            const centerPluto = document.getElementById("centerPluto");

            const cameraHandler = scene.getInstancesOf(CameraFollowerScript)[0];

            centerSun?.addEventListener("click", () => {
                cameraHandler.lockCamera("sun")
                targetBody = "Sun";
            });
            centerMercury?.addEventListener("click", () => {
                cameraHandler.lockCamera("mercury")
                targetBody = "Mercury";
            })
            centerVenus?.addEventListener("click", () => {
                cameraHandler.lockCamera("venus")
                targetBody = "Venus";
            })
            centerEarth?.addEventListener("click", () => {
                cameraHandler.lockCamera("earth")
                targetBody = "Earth";
            });
            centerMars?.addEventListener("click", () => {
                cameraHandler.lockCamera("mars")
                targetBody = "Mars";
            });
            centerJupiter?.addEventListener("click", () => {
                cameraHandler.lockCamera("jupiter")
                targetBody = "Jupiter";
            });
            centerSaturn?.addEventListener("click", () => {
                cameraHandler.lockCamera("saturn")
                targetBody = "Saturn";
            })
            centerUranus?.addEventListener("click", () => {
                cameraHandler.lockCamera("uranus")
                targetBody = "Uranus";
            })
            centerNeptune?.addEventListener("click", () => {
                cameraHandler.lockCamera("neptune")
                targetBody = "Neptune";
            })
            centerPluto?.addEventListener("click", () => {
                cameraHandler.lockCamera("pluto")
                targetBody = "Pluto";
            })
        }
    }

    function updateInfoBox(target) {
        const infoHandler = scene.getInstancesOf(CelestialBodyScript)[0];
        const targetBody = infoHandler.getData(target);
        const infoContent = document.getElementById("infoContent");
        if (!target) {
            infoContent.innerHTML = `<strong>No data available.</strong>`;
            return;
        }

        const {
            name = "Unknown",
            mass = 0,
            radius = 0,
            surfaceTemperature: temperature = 0,
            rotationPeriod = 0,
            obliquity = 0,
            argumentOfObliquity = 0,
            yaw = 0,
            position: [x = 0, y = 0, z = 0] = [],
            orbitalPeriod = 0,
            orbitalDistance = 0,
            luminosity = 0,
        } = targetBody;

        infoContent.innerHTML = `
                    <strong>Name:</strong> ${name} <br>
                    <strong>Mass:</strong> ${mass.toExponential(2)} kg <br>
                    <strong>Radius:</strong> ${radius.toFixed(2)} m <br>
                    <strong>Temperature:</strong> ${temperature.toFixed(2)} K <br>
                    <strong>Rotation Period:</strong> ${rotationPeriod.toFixed(2)} s <br>
                    <strong>Obliquity:</strong> ${obliquity.toFixed(2)}° <br>
                    <strong>Argument of Obliquity:</strong> ${argumentOfObliquity.toFixed(2)}° <br>
                    <strong>Yaw:</strong> ${yaw.toFixed(2)}° <br>
                    <strong>Position:</strong> (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) <br>
                    <strong>Orbital Period:</strong> ${orbitalPeriod.toFixed(2)} s <br>
                    <strong>Orbital Distance:</strong> ${orbitalDistance.toExponential(2)} m <br>
                    <strong>Luminosity:</strong> ${luminosity.toExponential(2)} W <br>
                `;
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

        updateInfoBox(targetBody)

        requestAnimationFrame(render);
    }
}