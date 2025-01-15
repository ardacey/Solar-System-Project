"use strict";

let shapeShader;
let celestialShader;
let meshMap;
const sceneObjects = [];
let targetBody = "Sun";

let lastAsteroidTime = 0;
const asteroidSpawnInterval = 5000;
const maxAsteroids = 50;
let asteroidCount = 0;

let score = 0;
let totalScore = 0;

let arda = 0;
let ismail = 0;
let yigitalp = 0;
let zafer = 0;

let manual = false;

function clearGlBuffer(gl){
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

class OrbitMesh {
    constructor(gl, orbitalDistance, color = [0.0, 1.0, 1.0], segments = 360) {
        this.gl = gl;
        this.color = color;
        
        const vertices = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * orbitalDistance * CelestialBodyScript.DISTANCE_SCALE;
            const z = Math.sin(angle) * orbitalDistance * CelestialBodyScript.DISTANCE_SCALE;
            vertices.push(x, 0, z);
        }
        
        const indices = [];
        for (let i = 0; i < segments; i++) {
            indices.push(i, i + 1);
        }
        indices.push(segments, 0); // Close the loop
        
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            aPos: { numComponents: 3, data: new Float32Array(vertices) },
            indices: { numComponents: 2, data: new Uint16Array(indices) }
        });
    }
    
    draw(shader) {
        const gl = this.gl;
        shader.useProgram();
        twgl.setBuffersAndAttributes(gl, shader.programInfo, this.bufferInfo);
        shader.setUniform3FVector("orbitColor", this.color);
        gl.drawElements(gl.LINES, this.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    }
    
    setupMesh() {
        // Empty
    }
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
        celestialShader = await initShader("glsl/SunVertex.glsl", "glsl/SunFragment.glsl", gl);
        const sunShader = await initShader("glsl/test2vertex.glsl", "glsl/test2frag.glsl", gl);
        const haloShader = await initShader("glsl/haloVertex.glsl", "glsl/haloFrag.glsl", gl);
        const skyboxShader = await initShader("glsl/skybox-vertex.glsl", "glsl/skybox-fragment.glsl", gl);
        const orbitShader = await initShader("glsl/orbitVertex.glsl", "glsl/orbitFragment.glsl", gl);
        shapeShader = await initShader("glsl/ShapeVertex.glsl", "glsl/ShapeFragment.glsl", gl)

        const modelConfigs = [
            { path: "SunModel", name: "sunMesh" },
            { path: "MercuryModel", name: "mercuryMesh" },
            { path: "VenusModel", name: "venusMesh" },
            { path: "EarthModel", name: "earthMesh" },
            { path: "MarsModel", name: "marsMesh" },
            { path: "JupiterModel", name: "jupiterMesh" },
            { path: "SaturnModel", name: "saturnMesh" },
            { path: "UranusModel", name: "uranusMesh" },
            { path: "NeptuneModel", name: "neptuneMesh" },
            { path: "PlutoModel", name: "plutoMesh" },
            { path: "ArdaModel", name: "ardaMesh" },
            { path: "IsmailModel", name: "ismailMesh" },
            { path: "YigitalpModel", name: "yigitalpMesh" },
            { path: "ZaferModel", name: "zaferMesh" },
            { path: "SpaceshipModel", name: "spaceshipMesh" },
            { path: "AsteroidModel", name: "asteroidMesh" },
            { path: "AstronautModel", name: "astronautMesh" },
        ];

        const modelPaths = modelConfigs.map(({ path, name }) => ({
            obj: `Models/${path}/${path}.obj`,
            mtl: `Models/${path}/${path}.mtl`,
            downloadMtlTextures: true,
            name: name,
        }));

        meshMap = await OBJ.downloadModels(modelPaths);

        // Create skybox
        const skyboxObject = SceneObject.CreateEmptySceneObject();
        BindSceneObject(skyboxObject, SkyboxScript, [skyboxShader, "textures/8k/8k_stars_milky_way.jpg"]);
        sceneObjects.push(skyboxObject);


        // Create Sun
        const sunMesh = new Mesh(meshMap["sunMesh"],gl);
        const sunObject = new SceneObject(sunMesh, sunShader);
        BindSceneObject(sunObject, StarScript, [BodyProperties.Sun]);
        sceneObjects.push(sunObject);
        const sunScript = sunObject.SceneObjectScripts.find(script => script instanceof StarScript);

        // Create Halo
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        const haloMesh = new Mesh(meshMap["sunMesh"],gl);
        const haloObject = new SceneObject(haloMesh, haloShader);

        BindSceneObject(haloObject, StarScript, [BodyProperties.Halo]);
        sceneObjects.push(haloObject);

        // Create Mercury
        const mercuryMesh = new Mesh(meshMap["mercuryMesh"],gl);
        const mercuryObject = new SceneObject(mercuryMesh, celestialShader);
        const mercuryScript = BindSceneObject(mercuryObject, PlanetScript, [BodyProperties.Mercury]);
        mercuryScript.centralStar = sunScript;
        sceneObjects.push(mercuryObject);

        // Mercury's orbit
        const mercuryOrbitMesh = new OrbitMesh(gl, BodyProperties.Mercury.orbitalDistance, [0.7, 0.5, 0.5]);
        const mercuryOrbitObject = new SceneObject(mercuryOrbitMesh, orbitShader);
        sceneObjects.push(mercuryOrbitObject);

        // Create Venus
        const venusMesh = new Mesh(meshMap["venusMesh"],gl);
        const venusObject = new SceneObject(venusMesh, celestialShader);
        const venusScript = BindSceneObject(venusObject, PlanetScript, [BodyProperties.Venus]);
        venusScript.centralStar = sunScript;
        sceneObjects.push(venusObject);

        // Create Venus's orbit (yellowish)
        const venusOrbitMesh = new OrbitMesh(gl, BodyProperties.Venus.orbitalDistance, [0.9, 0.9, 0.5]);
        const venusOrbitObject = new SceneObject(venusOrbitMesh, orbitShader);
        sceneObjects.push(venusOrbitObject);

        // Create Earth
        const earthMesh = new Mesh(meshMap["earthMesh"],gl);
        const earthObject = new SceneObject(earthMesh, celestialShader);
        const earthScript = BindSceneObject(earthObject, PlanetScript, [BodyProperties.Earth]);
        earthScript.centralStar = sunScript;
        sceneObjects.push(earthObject);

        // Create Earth's orbit (blue)
        const earthOrbitMesh = new OrbitMesh(gl, BodyProperties.Earth.orbitalDistance, [0.2, 0.5, 1.0]);
        const earthOrbitObject = new SceneObject(earthOrbitMesh, orbitShader);
        sceneObjects.push(earthOrbitObject);

        // Create Mars
        const marsMesh = new Mesh(meshMap["marsMesh"],gl);
        const marsObject = new SceneObject(marsMesh, celestialShader);
        const marsScript = BindSceneObject(marsObject, PlanetScript, [BodyProperties.Mars]);
        marsScript.centralStar = sunScript;
        sceneObjects.push(marsObject);

        // Create Mars's orbit (red-orange)
        const marsOrbitMesh = new OrbitMesh(gl, BodyProperties.Mars.orbitalDistance, [1.0, 0.4, 0.2]);
        const marsOrbitObject = new SceneObject(marsOrbitMesh, orbitShader);
        sceneObjects.push(marsOrbitObject);

        // Create Jupiter
        const jupiterMesh = new Mesh(meshMap["jupiterMesh"],gl);
        const jupiterObject = new SceneObject(jupiterMesh, celestialShader);
        const jupiterScript = BindSceneObject(jupiterObject, PlanetScript, [BodyProperties.Jupiter]);
        jupiterScript.centralStar = sunScript;
        sceneObjects.push(jupiterObject);

        // Create Jupiter's orbit (brown-orange)
        const jupiterOrbitMesh = new OrbitMesh(gl, BodyProperties.Jupiter.orbitalDistance, [0.8, 0.6, 0.3]);
        const jupiterOrbitObject = new SceneObject(jupiterOrbitMesh, orbitShader);
        sceneObjects.push(jupiterOrbitObject);

        // Create Saturn
        const saturnMesh = new Mesh(meshMap["saturnMesh"],gl);
        const saturnObject = new SceneObject(saturnMesh, celestialShader);
        const saturnScript = BindSceneObject(saturnObject, PlanetScript, [BodyProperties.Saturn]);
        saturnScript.centralStar = sunScript;
        sceneObjects.push(saturnObject);

        // Create Saturn's orbit (golden)
        const saturnOrbitMesh = new OrbitMesh(gl, BodyProperties.Saturn.orbitalDistance, [0.9, 0.8, 0.4]);
        const saturnOrbitObject = new SceneObject(saturnOrbitMesh, orbitShader);
        sceneObjects.push(saturnOrbitObject);

        // Create Uranus
        const uranusMesh = new Mesh(meshMap["uranusMesh"],gl);
        const uranusObject = new SceneObject(uranusMesh, celestialShader);
        const uranusScript = BindSceneObject(uranusObject, PlanetScript, [BodyProperties.Uranus]);
        uranusScript.centralStar = sunScript;
        sceneObjects.push(uranusObject);

        // Create Uranus's orbit (light blue)
        const uranusOrbitMesh = new OrbitMesh(gl, BodyProperties.Uranus.orbitalDistance, [0.5, 0.8, 0.9]);
        const uranusOrbitObject = new SceneObject(uranusOrbitMesh, orbitShader);
        sceneObjects.push(uranusOrbitObject);

        // Create Neptune
        const neptuneMesh = new Mesh(meshMap["neptuneMesh"],gl);
        const neptuneObject = new SceneObject(neptuneMesh, celestialShader);
        const neptuneScript = BindSceneObject(neptuneObject, PlanetScript, [BodyProperties.Neptune]);
        neptuneScript.centralStar = sunScript;
        sceneObjects.push(neptuneObject);

        // Create Neptune's orbit (deep blue)
        const neptuneOrbitMesh = new OrbitMesh(gl, BodyProperties.Neptune.orbitalDistance, [0.1, 0.2, 0.8]);
        const neptuneOrbitObject = new SceneObject(neptuneOrbitMesh, orbitShader);
        sceneObjects.push(neptuneOrbitObject);

        // Create Pluto
        const plutoMesh = new Mesh(meshMap["plutoMesh"],gl);
        const plutoObject = new SceneObject(plutoMesh, celestialShader);
        const plutoScript = BindSceneObject(plutoObject, PlanetScript, [BodyProperties.Pluto]);
        plutoScript.centralStar = sunScript;
        sceneObjects.push(plutoObject);

        // Create Pluto's orbit (purple-gray)
        const plutoOrbitMesh = new OrbitMesh(gl, BodyProperties.Pluto.orbitalDistance, [0.6, 0.4, 0.6]);
        const plutoOrbitObject = new SceneObject(plutoOrbitMesh, orbitShader);
        sceneObjects.push(plutoOrbitObject);

        // Create Arda
        const ardaMesh = new Mesh(meshMap["ardaMesh"],gl);
        const ardaObject = new SceneObject(ardaMesh, celestialShader);
        BindSceneObject(ardaObject, AstronautScript);
        sceneObjects.push(ardaObject);

        // Create Ismail
        const ismailMesh = new Mesh(meshMap["ismailMesh"],gl);
        const ismailObject = new SceneObject(ismailMesh, celestialShader);
        BindSceneObject(ismailObject, AstronautScript);
        sceneObjects.push(ismailObject);

        // Create Yigitalp
        const yigitalpMesh = new Mesh(meshMap["yigitalpMesh"],gl);
        const yigitalpObject = new SceneObject(yigitalpMesh, celestialShader);
        BindSceneObject(yigitalpObject, AstronautScript);
        sceneObjects.push(yigitalpObject);

        // Create Zafer
        const zaferMesh = new Mesh(meshMap["zaferMesh"],gl);
        const zaferObject = new SceneObject(zaferMesh, celestialShader);
        BindSceneObject(zaferObject, AstronautScript);
        sceneObjects.push(zaferObject);

        // Create Spaceship
        const spaceshipMesh = new Mesh(meshMap["spaceshipMesh"],gl);
        const spaceshipObject = new SceneObject(spaceshipMesh, celestialShader);
        const spaceshipScript = BindSceneObject(spaceshipObject, SpaceshipScript, [BodyProperties.Spaceship]);
        spaceshipScript.centralStar = sunScript;
        sceneObjects.push(spaceshipObject);

        for(let i = 0; i < 25; i++) createAsteroid();

        const AnotherArdaObject = new SceneObject(ardaMesh, celestialShader);
        BindSceneObject(AnotherArdaObject, SceneObjectScript);
        AnotherArdaObject.transform.position = vec3.fromValues(4996,5000,5000);
        sceneObjects.push(AnotherArdaObject);

        const AnotherIsmailObject = new SceneObject(ismailMesh, celestialShader);
        BindSceneObject(AnotherIsmailObject, SceneObjectScript);
        AnotherIsmailObject.transform.position = vec3.fromValues(4998,5000,5000);
        sceneObjects.push(AnotherIsmailObject);

        const anotherSpaceshipMesh = new Mesh(meshMap["spaceshipMesh"],gl);
        const anotherSpaceshipObject = new SceneObject(anotherSpaceshipMesh, celestialShader);
        BindSceneObject(anotherSpaceshipObject, SceneObjectScript);
        anotherSpaceshipObject.transform.position = vec3.fromValues(5000,5000,5000);
        sceneObjects.push(anotherSpaceshipObject);

        const AnotherYigitalpObject = new SceneObject(yigitalpMesh, celestialShader);
        BindSceneObject(AnotherYigitalpObject, SceneObjectScript);
        AnotherYigitalpObject.transform.position = vec3.fromValues(5002,5000,5000);
        sceneObjects.push(AnotherYigitalpObject);

        const AnotherZaferObject = new SceneObject(zaferMesh, celestialShader);
        BindSceneObject(AnotherZaferObject, SceneObjectScript);
        AnotherZaferObject.transform.position = vec3.fromValues(5004,5000,5000);
        sceneObjects.push(AnotherZaferObject);

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
            arda:ardaObject,
            ismail:ismailObject,
            yigitalp:yigitalpObject,
            zafer:zaferObject,
            spaceship:spaceshipObject,
            names:anotherSpaceshipObject
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
            const spaceshipScript = scene.getInstancesOf(SpaceshipScript)[0];
            const earthScript = scene.listOfSceneObjects.find(obj => obj.Mesh?.meshOBJ?.name === "earthMesh").SceneObjectScripts[0];
            const ardaScript = scene.listOfSceneObjects.find(obj => obj.Mesh?.meshOBJ?.name === "ardaMesh").SceneObjectScripts[0];
            const ismailScript = scene.listOfSceneObjects.find(obj => obj.Mesh?.meshOBJ?.name === "ismailMesh").SceneObjectScripts[0];
            const yigitalpScript = scene.listOfSceneObjects.find(obj => obj.Mesh?.meshOBJ?.name === "yigitalpMesh").SceneObjectScripts[0];
            const zaferScript = scene.listOfSceneObjects.find(obj => obj.Mesh?.meshOBJ?.name === "zaferMesh").SceneObjectScripts[0];

            document.addEventListener('keydown', (event) => {
                const rotationSpeed = 2;

                if (event.key === 'p') {
                    if (!document.pointerLockElement) {
                        canvas.requestPointerLock({
                            unadjustedMovement: true,
                        });
                    }
                }
                if (document.pointerLockElement &&
                        (targetBody === "Spaceship" ||
                        targetBody === "Earth" ||
                        targetBody === "Arda" ||
                        targetBody === "Ismail" ||
                        targetBody === "Yigitalp" ||
                        targetBody === "Zafer")
                )   {
                    const targetScripts = {
                        "Spaceship": spaceshipScript,
                        "Earth": earthScript,
                        "Arda": ardaScript,
                        "Ismail": ismailScript,
                        "Yigitalp": yigitalpScript,
                        "Zafer": zaferScript
                    };

                    const selectedScript = targetScripts[targetBody];
                    switch (event.key) {
                        case 'w':
                            selectedScript.moveFront();
                            break;
                        case 's':
                            selectedScript.moveBack();
                            break;
                        case 'd':
                            selectedScript.moveRight();
                            break;
                        case 'a':
                            selectedScript.moveLeft();
                            break;
                        case 'm':
                            manual = !manual;
                            break;
                    }
                }
                if (event.key === 'k') {
                    const cameraHandler = scene.getInstancesOf(CameraFollowerScript)[0];
                    cameraHandler.lockCamera("names");
                    targetBody = "names";
                }
            });

            document.addEventListener('keyup', (event) => {

                if (document.pointerLockElement &&
                    (targetBody === "Spaceship" ||
                        targetBody === "Earth" ||
                        targetBody === "Arda" ||
                        targetBody === "Ismail" ||
                        targetBody === "Yigitalp" ||
                        targetBody === "Zafer")
                ) {
                    const targetScripts = {
                        "Spaceship": spaceshipScript,
                        "Earth": earthScript,
                        "Arda": ardaScript,
                        "Ismail": ismailScript,
                        "Yigitalp": yigitalpScript,
                        "Zafer": zaferScript
                    };

                    const selectedScript = targetScripts[targetBody];
                    selectedScript.stop();
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
                scene.camera.processZoom(e.deltaY <= 0 ? 0.4 : -0.4);
            });
        }

        interfaceHandler();
        function interfaceHandler() {
            const centerSelector = document.getElementById("centerSelector");
            const cameraHandler = scene.getInstancesOf(CameraFollowerScript)[0];

            centerSelector.addEventListener("change", function() {
                const selectedCenter = centerSelector.value;
                const bodyName = selectedCenter.replace("center", "").toLowerCase();

                if (bodyName === "camera") {
                    cameraHandler.lockCamera(null);
                    targetBody = "";
                    console.log("Free Camera Movement");
                } else {
                    cameraHandler.lockCamera(bodyName);
                    targetBody = selectedCenter.replace("center", "");
                    console.log("Camera locked to: " + targetBody);
                }
            });
        }
        
        let isHelpMenuVisible = false;

        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', (event) => {
                if (!document.pointerLockElement && event.key === 'h') {
                    isHelpMenuVisible = !isHelpMenuVisible;
                    const helpMenu = document.getElementById('helpMenu');
                    helpMenu.style.display = isHelpMenuVisible ? 'block' : 'none';
                }
            });
        }

        setupKeyboardShortcuts();
    }

    function updateInfoBox(target) {
        const infoHandler = scene.getInstancesOf(CelestialBodyScript)[0];
        const targetBody = infoHandler.getData(target);
        const infoContent = document.getElementById("infoContent");
        if (!target || !targetBody) {
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

    function updateScore() {
        const scoreContent = document.getElementById("score");

        scoreContent.innerHTML = `
                <strong>Money on Ship:</strong> ${score.toFixed(2)} <strong>TL</strong><br>
                <strong>Total Money:</strong> ${totalScore.toFixed(2)} <strong>TL</strong><br>
                `;
    }

    function updateAstronauts() {
        const astronauts = document.getElementById("astronauts");

        const statusMap = {
            0: "Not Rescued",
            1: "On the Ship",
            2: "Rescued"
        };

        const ardaStatus = statusMap[arda] || "Unknown Status";
        const ismailStatus = statusMap[ismail] || "Unknown Status";
        const yigitalpStatus = statusMap[yigitalp] || "Unknown Status";
        const zaferStatus = statusMap[zafer] || "Unknown Status";

        astronauts.innerHTML = `
                <strong>Arda: </strong> ${ardaStatus} <br>
                <strong>Ismail: </strong> ${ismailStatus} <br>
                <strong>Yigitalp: </strong> ${yigitalpStatus} <br>
                <strong>Zafer: </strong> ${zaferStatus} <br>
                `;
    }

    function createAsteroid() {
        if (asteroidCount >= maxAsteroids) return;

        const asteroidMesh = new Mesh(meshMap["asteroidMesh"],gl);
        const asteroidObject = new SceneObject(asteroidMesh, celestialShader);
        BindSceneObject(asteroidObject, AsteroidScript);
        sceneObjects.push(asteroidObject);

        dispatchEvent(asteroidObject.startEvents);

        asteroidCount++;
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

        if (timeStamp - lastAsteroidTime >= asteroidSpawnInterval) {
            createAsteroid();
            lastAsteroidTime = timeStamp;
        }

        if(
            targetBody !== "Spaceship" &&
            targetBody !== "Arda" &&
            targetBody !== "Ismail" &&
            targetBody !== "Yigitalp" &&
            targetBody !== "Zafer" &&
            targetBody !== "names")
            updateInfoBox(targetBody)
        updateScore();
        updateAstronauts();

        requestAnimationFrame(render);
    }
}