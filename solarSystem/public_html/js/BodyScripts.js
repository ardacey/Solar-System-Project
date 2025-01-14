class CelestialBodyScript extends SceneObjectScript {
    // Physics properties
    name;
    mass;
    radius;
    surfaceTemperature;
    angularVelocity;
    rotationPeriod;
    obliquity;
    argumentOfObliquity;
    yaw;
    rotation;


    // Scaling factors
    static DISTANCE_SCALE = 1e-9;  // 1 unit = 1 billion meters
    static SIZE_SCALE = 1e-7;      // 1 unit = 10 million meters

    constructor(sceneObject, params) {
        super(sceneObject);
        Object.assign(this, params);
        this.rotation = { x: 0, y: 0, z: 0 };
    }

    Start() {
        super.Start();
    }

    Update() {
        super.Update();
        this.updateRotation();
        this.updateTransform();
        // The Mesh class will handle the drawing
    }

    updateRotation() {
        const rotationAngle = (2 * Math.PI * time.deltaTime)*100000 / this.rotationPeriod;
        this.rotation.y += rotationAngle;
        this.sceneObject.transform.rotation = vec3.fromValues(
            this.rotation.x,
            this.rotation.y,
            this.rotation.z
        );
    }

    getScaledPosition() {
        const transform = this.sceneObject.transform;
        return vec3.scale(
            vec3.create(),
            transform.position,
            CelestialBodyScript.DISTANCE_SCALE
        );
    }

    getScaledRadius() {
        return this.radius * CelestialBodyScript.SIZE_SCALE;
    }

    updateTransform() {
        const scaledRadius = this.getScaledRadius();
        this.sceneObject.transform.scale = vec3.fromValues(
            scaledRadius,
            scaledRadius,
            scaledRadius
        );
    }

    getData(targetObjectName) {
        const celestialBodies = this.sceneObject.scene.getInstancesOf(CelestialBodyScript);
        const targetBody = celestialBodies.find(body => body.name === targetObjectName);

        return {
            name: targetBody.name,
            mass: targetBody.mass,
            radius: targetBody.radius,
            surfaceTemperature: targetBody.surfaceTemperature,
            rotationPeriod: targetBody.rotationPeriod,
            obliquity: targetBody.obliquity,
            argumentOfObliquity: targetBody.argumentOfObliquity,
            yaw: targetBody.yaw,
            position: targetBody.sceneObject.transform.position,
            orbitalPeriod: targetBody.orbitalPeriod,
            orbitalDistance: targetBody.orbitalDistance,
            luminosity: targetBody.luminosity
        };
    }
}

class StarScript extends CelestialBodyScript {
    luminosity;
    time = new Time();
    totalTime = 0;

    constructor(sceneObject, params) {
        super(sceneObject, params);
        Object.assign(this, params);
    }

    Update() {
        super.Update();
        this.totalTime+=time.deltaTime/1000;
        this.sceneObject.scale = 1000;
        this.sceneObject.shader.setUniform1f("time" , this.totalTime);
        this.sceneObject.shader.setUniform1f("highTemp" , 5700);
        this.sceneObject.shader.setUniform1f("lowTemp" , 500);

        // this.updateSurfaceTemperature();
    }

    getLightIntensityAtDistance(distance) {
        return (this.luminosity) / (4 * Math.PI * distance * distance);
    }

}

class PlanetScript extends CelestialBodyScript{
    orbitalPeriod;
    orbitalDistance;
    angle;
    centralStar;
    speed;
    direction;
    orbitRadius;
    orbitErrorMargin = 0.01;
    physicDis;


    constructor(sceneObject, params) {
        super(sceneObject, params);
        Object.assign(this, params);
        this.angle = 0;
        this.speed = 0;
        this.direction = vec3.fromValues(0, 0, 1);
        this.orbitRadius = this.orbitalDistance * CelestialBodyScript.DISTANCE_SCALE;
        this.physicDis = this.orbitalDistance * CelestialBodyScript.DISTANCE_SCALE * 0.98;

    }

    Start() {
        super.Start();

        console.log(this.sceneObject.transform.position)

    }

    Update() {
        super.Update();
        this.updateTransform();
        if (manual) {
            this.checkOrbitBoundary();
        }
        else this.updateOrbitalPosition();
        this.sceneObject.shader.setUniform3FVector("lightPos", [0, 0, 0]);  // Light at sun's position
        this.sceneObject.shader.setUniform3FVector("lightColor", [1, 1, 1]);
        // this.updateSurfaceTemperature();
    }

    updateOrbitalPosition() {
        const deltaAngle = this.angularVelocity * time.deltaTime;
        this.angle += deltaAngle;

        const scaledDistance = this.orbitalDistance * CelestialBodyScript.DISTANCE_SCALE;
        const x = scaledDistance * Math.cos(this.angle);
        const z = scaledDistance * Math.sin(this.angle);

        this.sceneObject.transform.position = vec3.fromValues(x, 0, z);

    }

    checkOrbitBoundary() {
        // Yörünge mesafesi ile gezegenin mevcut mesafesi arasındaki farkı hesapla

        const deltaAngle = this.angularVelocity * time.deltaTime;
        this.angle += deltaAngle;

        const currentDistance = vec3.length(this.sceneObject.transform.position);
        const lowerBound = this.orbitRadius * (1 - this.orbitErrorMargin); // %10 daha az
        const upperBound = this.orbitRadius * (1 + this.orbitErrorMargin); // %10 daha fazla

        if (currentDistance < lowerBound || currentDistance > upperBound) {
            // Yörüngeden sapma tespit edildi

            // Eğer gezegen çok yakına girerse (yıldızdan çok yakın)
            if (currentDistance < 25) { // 25 birim mesafe örnek olarak belirlenebilir
                console.log("Gezegen yıldıza çekildi ve yok oldu");
                this.sceneObject.scene.listOfSceneObjects.splice(this.sceneObject.scene.listOfSceneObjects.indexOf(this.sceneObject), 1);
            } else {
                // Yörüngeden çıkarsa gezegenin doğru yöne hareket etmesi sağlanacak
                this.moveTowardsSun(currentDistance, lowerBound, upperBound);
            }
        }
    }

    moveTowardsSun(currentDistance, lowerBound, upperBound) {
        // Eğer gezegen lowerBound'dan küçükse, güneşe doğru hareket etsin
        if (currentDistance < lowerBound) {
            console.log("Gezegen güneşe doğru hareket ediyor");
            this.moveInDirection(true); // Güneşe doğru
        }
        // Eğer gezegen upperBound'dan büyükse, güneşten uzaklaşarak hareket etsin
        else if (currentDistance > upperBound) {
            console.log("Gezegen güneşten uzaklaşıyor");
            this.moveInDirection(false); // Güneşten uzaklaşarak
        }
    }

    moveInDirection(towardsSun) {
        const scaledDistance = this.orbitalDistance * CelestialBodyScript.DISTANCE_SCALE;
        const x = scaledDistance * Math.cos(this.angle);
        const z = scaledDistance * Math.sin(this.angle);
        const x1 = scaledDistance * Math.cos(this.angle + this.angularVelocity * time.deltaTime);
        const z1 = scaledDistance * Math.sin(this.angle + this.angularVelocity * time.deltaTime);

        const posVec = vec3.fromValues(x, 0, z);
        const posVec1 = vec3.fromValues(x1, 0, z1);

        let angleVec = vec3.fromValues(0, 0, 0);
        let sunVec = vec3.fromValues(0, 0, 0);
        const sunPosition = vec3.fromValues(0, 0, 0);

        vec3.sub(sunVec, sunPosition, this.sceneObject.transform.position);

        console.log(sunVec);
        vec3.scale(sunVec, sunVec, 0.003);
        //sunVec = vec3.normalize(vec3.create(), sunVec);

        vec3.sub(angleVec, posVec1 , posVec);
        vec3.scale(angleVec, angleVec, 30.)
        //angleVec = vec3.normalize(vec3.create(), angleVec);

        vec3.add(angleVec, angleVec, sunVec);

        const finalVec = vec3.create();
        vec3.add(finalVec, this.sceneObject.transform.position, angleVec);
        this.sceneObject.transform.position = finalVec;
    }


    moveFront() {this.speed = 0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveBack(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveRight(){this.speed = 0.5; this.direction = this.sceneObject.scene.camera.right;}
    moveLeft(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.right;}
    stop(){this.speed = 0}
}


class SkyboxScript extends SceneObjectScript {
    bufferInfo;
    programInfo;
    texture;
    textureLoaded = false;

    constructor(sceneObject, shader, textureUrl) {
        super(sceneObject);
        console.log("SkyboxScript constructor called", { shader, textureUrl });

        if (!shader) {
            console.error("Shader is undefined in SkyboxScript constructor");
            return;
        }

        this.shader = shader;
        this.programInfo = shader.programInfo;

        if (!this.programInfo) {
            console.error("ProgramInfo is undefined. Shader:", shader);
            return;
        }

        console.log("Setting up skybox buffers");
        this.setupBuffers();
        console.log("Loading skybox texture from:", textureUrl);
        this.loadTexture(textureUrl);
    }

    async loadTexture(textureUrl) {
        const gl = this.shader.gl;

        try {
            console.log("Starting to load skybox texture");
            const image = await this.loadImage(textureUrl);
            console.log("Skybox image loaded", { width: image.width, height: image.height });

            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);

            // Set texture parameters for skybox
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            this.textureLoaded = true;
            console.log("Skybox texture loaded and configured successfully");
        } catch (error) {
            console.error("Failed to load skybox texture:", error);
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.crossOrigin = "anonymous"; // Add this to handle CORS
            image.src = url;
        });
    }

    setupBuffers() {
        const gl = this.shader.gl;
        console.log("Setting up skybox buffers with gl context:", !!gl);

        // Create skybox geometry (cube)
        const arrays = {
            aPosition: {  // Note: changed from 'position' to match shader attribute name
                numComponents: 3,
                data: new Float32Array([
                    // Front face
                    -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
                    // Back face
                    -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
                    // Top face
                    -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
                    // Bottom face
                    -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
                    // Right face
                    1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
                    // Left face
                    -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
                ])
            },
            indices: {
                numComponents: 3,
                data: new Uint16Array([
                    0,  1,  2,    0,  2,  3,  // front
                    4,  5,  6,    4,  6,  7,  // back
                    8,  9,  10,   8,  10, 11, // top
                    12, 13, 14,   12, 14, 15, // bottom
                    16, 17, 18,   16, 18, 19, // right
                    20, 21, 22,   20, 22, 23  // left
                ])
            },
        };

        try {
            this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
            console.log("Skybox buffers created successfully:", this.bufferInfo);
        } catch (error) {
            console.error("Failed to create skybox buffers:", error);
        }
    }

    Start() {
        super.Start();
        console.log("SkyboxScript Start called");
    }

    Update() {
        super.Update();
        if (this.textureLoaded) {
            this.render();
        }
    }

    render() {
        const gl = this.shader.gl;

        if (!this.bufferInfo || !this.programInfo || !this.texture) {
            console.warn("Missing required resources for skybox render:", {
                bufferInfo: !!this.bufferInfo,
                programInfo: !!this.programInfo,
                texture: !!this.texture
            });
            return;
        }

        // Save current GL state
        const currentDepthFunc = gl.getParameter(gl.DEPTH_FUNC);

        // Configure GL state for skybox
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);

        // Use shader program
        gl.useProgram(this.programInfo.program);

        // Remove translation from view matrix for skybox
        const viewMatrix = mat4.clone(this.sceneObject.scene.camera.getViewMatrix());
        viewMatrix[12] = 0;
        viewMatrix[13] = 0;
        viewMatrix[14] = 0;

        // Set uniforms using TWGL
        const uniforms = {
            uProjectionMatrix: this.sceneObject.scene.getProjectionMatrix(),
            uViewMatrix: viewMatrix,
            uSkybox: this.texture
        };


        try {
            // Set buffers and uniforms
            twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
            twgl.setUniforms(this.programInfo, uniforms);

            // Draw
            gl.depthMask(false);
            twgl.drawBufferInfo(gl, this.bufferInfo);
            gl.depthMask(true);

        } catch (error) {
            console.error("Error rendering skybox:", error);
        }

        // Restore GL state
        gl.depthFunc(currentDepthFunc);
        gl.enable(gl.CULL_FACE);
    }
}

class SpaceshipScript extends SceneObjectScript {
    name;
    mass;
    speed;
    direction;

    constructor(sceneObject, params) {
        super(sceneObject);
        Object.assign(this, params);
        this.speed = 0;
        this.direction = vec3.fromValues(0, 0, 1);
        this.rotation = { x: 0, y: 0, z: 0 };
    }

    Start() {
        super.Start();
        this.sceneObject.transform.position = vec3.fromValues(50, 50, 50);
    }

    Update() {
        super.Update();
        this.UpdateTransform();
        this.UpdateRotation();
        this.CheckCollision();
    }

    UpdateTransform() {
        const transform = this.sceneObject.transform;
        transform.position = vec3.add(
            transform.position,
            transform.position,
            vec3.scale(vec3.create(), this.direction, this.speed * time.deltaTime)
        );
    }

    UpdateRotation() {
        let cameraDirection = this.sceneObject.scene.camera.front;
        let direction = vec3.fromValues(0, 0, 1);
        let rotation = this.calculateEulerAngles(direction, cameraDirection);


        this.getTransform().rotation = rotation;

        // let model = this.getTransform().getModelMatrix();
        // let inverseTranspose = mat4.transpose(mat4.create(),mat4.invert(mat4.create(),model));
    }

    calculateEulerAngles(currentDir, targetDir) {
        // Normalize vectors
        const current = vec3.create();
        const target = vec3.create();
        vec3.normalize(current, currentDir);
        vec3.normalize(target, targetDir);

        // Calculate yaw (Y-axis rotation)
        const yaw = Math.atan2(target[0], target[2]) - Math.atan2(current[0], current[2]);

        // Calculate pitch (X-axis rotation)
        const currentPitch = Math.asin(-current[1]);
        const targetPitch = Math.asin(-target[1]);
        const pitch = targetPitch - currentPitch;

        // For this implementation, we assume no roll (Z-axis rotation) is needed
        const roll = 0;

        const toDegrees = angle => angle * (180 / Math.PI);
        return vec3.fromValues(
            toDegrees(pitch),
            toDegrees(yaw),
            toDegrees(roll)
        );
    }

    CheckCollision() {
        this.sceneObject.scene.listOfSceneObjects.forEach(object => {
            const spaceshipPosition = this.sceneObject.transform.position;
            const spaceshipRadius = this.sceneObject.transform.scale[0];

            const objectPosition = object.transform.position;
            const objectRadius = object.transform.scale[0];

            const distance = vec3.distance(objectPosition, spaceshipPosition);

            if (object.SceneObjectScripts[0] instanceof AsteroidScript) {
                if (distance < objectRadius + spaceshipRadius) {
                    console.log("Collision detected with Asteroid");
                    this.sceneObject.scene.listOfSceneObjects.splice(this.sceneObject.scene.listOfSceneObjects.indexOf(object), 1);
                    asteroidCount--;
                    score += 50;
                }
            }  else if (object.SceneObjectScripts[0] instanceof AstronautScript) {
                if (distance < objectRadius + spaceshipRadius) {
                    console.log("Collision detected with Astronaut");
                    if (object.Mesh.meshOBJ.name === "ardaMesh") arda = 1;
                    else if (object.Mesh.meshOBJ.name === "ismailMesh") ismail = 1;
                    else if (object.Mesh.meshOBJ.name === "yigitalpMesh") yigitalp = 1;
                    else if (object.Mesh.meshOBJ.name === "zaferMesh") zafer = 1;
                    this.sceneObject.scene.listOfSceneObjects.splice(this.sceneObject.scene.listOfSceneObjects.indexOf(object), 1);
                }
            } else if (object.SceneObjectScripts[0] instanceof StarScript) {
                if (distance < (objectRadius + spaceshipRadius) / 2) {
                    console.log("Collision detected with Star");
                    this.sceneObject.scene.listOfSceneObjects.splice(this.sceneObject.scene.listOfSceneObjects.indexOf(this.sceneObject), 1);
                }
            } else if (object.SceneObjectScripts[0] instanceof CelestialBodyScript) {
                if (distance < (objectRadius + spaceshipRadius) / 2) {
                    if (object.SceneObjectScripts[0].name === "Earth") {
                        totalScore += score;
                        score = 0;
                        if (arda) arda = 2;
                        if (ismail) ismail = 2;
                        if (yigitalp) yigitalp = 2;
                        if (zafer) zafer = 2;
                    } else {
                        console.log("Collision detected with Celestial Body");
                        this.stop();
                    }
                }
            }
        });
    }

    moveFront() {this.speed = 0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveBack(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveRight(){this.speed = 0.5; this.direction = this.sceneObject.scene.camera.right;}
    moveLeft(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.right;}
    stop(){this.speed = 0}

}

class AsteroidScript extends SceneObjectScript{
    direction;
    speed;

    constructor(sceneObject, params) {
        super(sceneObject);
        Object.assign(this, params);
        this.direction = vec3.fromValues(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
        this.speed = 0.1;
    }

    Start() {
        super.Start();
        this.sceneObject.transform.position = vec3.fromValues(
            Math.random() * 500 - 250,
            Math.random() * 500 - 250,
            Math.random() * 500 - 250
        );
    }

    Update() {
        super.Update();
        this.UpdateTransform();
    }

    UpdateTransform() {
        const transform = this.sceneObject.transform;
        transform.position = vec3.add(
            transform.position,
            transform.position,
            vec3.scale(vec3.create(), this.direction, this.speed * time.deltaTime)
        );
    }
}

class AstronautScript extends SceneObjectScript{
    speed;
    direction;

    constructor(sceneObject, params) {
        super(sceneObject);
        Object.assign(this, params);
        this.speed = 0;
        this.direction = vec3.fromValues(0, 0, 1);
        this.rotation = { x: 0, y: 0, z: 0 };
    }

    Start() {
        super.Start();
        if (this.sceneObject.Mesh.meshOBJ.name === "ardaMesh") {
            this.sceneObject.transform.position = vec3.fromValues(100,100,100);
        } else if (this.sceneObject.Mesh.meshOBJ.name === "ismailMesh") {
            this.sceneObject.transform.position = vec3.fromValues(100,200,200);
        } else if (this.sceneObject.Mesh.meshOBJ.name === "yigitalpMesh") {
            this.sceneObject.transform.position = vec3.fromValues(200,200,300);
        } else if (this.sceneObject.Mesh.meshOBJ.name === "zaferMesh") {
            this.sceneObject.transform.position = vec3.fromValues(300,400,200);
        }
    }

    Update() {
        super.Update();
        this.UpdateTransform();
        this.UpdateRotation();
    }

    UpdateTransform() {
        const transform = this.sceneObject.transform;
        transform.position = vec3.add(
            transform.position,
            transform.position,
            vec3.scale(vec3.create(), this.direction, this.speed * time.deltaTime)
        );
    }

    UpdateRotation() {
        let cameraDirection = this.sceneObject.scene.camera.front;
        let direction = vec3.fromValues(0, 0, 1);
        let rotation = this.calculateEulerAngles(direction, cameraDirection);


        this.getTransform().rotation = rotation;

        // let model = this.getTransform().getModelMatrix();
        // let inverseTranspose = mat4.transpose(mat4.create(),mat4.invert(mat4.create(),model));
    }

    calculateEulerAngles(currentDir, targetDir) {
        // Normalize vectors
        const current = vec3.create();
        const target = vec3.create();
        vec3.normalize(current, currentDir);
        vec3.normalize(target, targetDir);

        // Calculate yaw (Y-axis rotation)
        const yaw = Math.atan2(target[0], target[2]) - Math.atan2(current[0], current[2]);

        // Calculate pitch (X-axis rotation)
        const currentPitch = Math.asin(-current[1]);
        const targetPitch = Math.asin(-target[1]);
        const pitch = targetPitch - currentPitch;

        // For this implementation, we assume no roll (Z-axis rotation) is needed
        const roll = 0;

        const toDegrees = angle => angle * (180 / Math.PI);
        return vec3.fromValues(
            toDegrees(pitch),
            toDegrees(yaw),
            toDegrees(roll)
        );
    }

    moveFront() {this.speed = 0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveBack(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.front;}
    moveRight(){this.speed = 0.5; this.direction = this.sceneObject.scene.camera.right;}
    moveLeft(){this.speed = -0.5; this.direction = this.sceneObject.scene.camera.right;}
    stop(){this.speed = 0}
}

class CameraFollowerScript extends SceneObjectScript{
    targetBody;
    camera;
    targetObject;
    constructor(sceneObject,potentialTargets,targetBody) {
        super(sceneObject);
        this.targetBody = targetBody
        this.potentialTargets = potentialTargets
    }

    Start() {
        super.Start();
        this.camera = this.sceneObject.scene.camera;
    }

    Update() {
        if(this.targetBody && this.targetObject !== "none")
        this.camera.target = vec3.copy(this.targetBody.transform.position);
        if (this.targetObject === "spaceship") {
            this.updateSpaceShipCameraVectors();
        } else {
            this.camera.updateCameraVectors();

        }
    }

    updateSpaceShipCameraVectors() {
        this.camera.updateCameraVectors()

        let behindPosition = vec3.create();
        vec3.scale(behindPosition, this.camera.front, -10);

        this.camera.position = vec3.add(vec3.create(), this.camera.target, behindPosition);

    }

    lockCamera(targetObjectName){
        this.targetBody = this.potentialTargets[targetObjectName];
        this.targetObject = targetObjectName;
        console.log(this.targetBody);
    }
}