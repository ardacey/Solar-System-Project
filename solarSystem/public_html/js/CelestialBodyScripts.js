class CelestialBodyScript extends SceneObjectScript {
    // Physics properties
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
        this.updateRotation()
        // The Mesh class will handle the drawing
    }

    updateRotation() {
        const rotationAngle = (2 * Math.PI * time.deltaTime) / this.rotationPeriod;
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
}

class StarScript extends CelestialBodyScript {
    luminosity;

    constructor(sceneObject, params) {
        super(sceneObject, params);
    }

    getLightIntensityAtDistance(distance) {
        return (this.luminosity) / (4 * Math.PI * distance * distance);
    }
}

class PlanetScript extends CelestialBodyScript {
    orbitalPeriod;
    orbitalDistance;
    angle;
    centralStar;

    constructor(sceneObject, params) {
        super(sceneObject, params);
        Object.assign(this, params);
        this.angle = 0;
    }

    Update() {
        super.Update();
        this.updateTransform();
        this.updateOrbitalPosition();
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

    updateSurfaceTemperature() {
        if (!this.centralStar) return;

        const distance = vec3.distance(
            this.getScaledPosition(),
            this.centralStar.sceneObject.transform.position
        );

        const albedo = 0.3;
        const stefanBoltzmann = 5.67e-8;

        const absorptionRate = (1 - albedo) * Math.PI * Math.pow(this.radius, 2);
        const incidentPower = this.centralStar.getLightIntensityAtDistance(distance) * absorptionRate;

        this.surfaceTemperature = Math.pow(
            incidentPower / (4 * Math.PI * Math.pow(this.radius, 2) * stefanBoltzmann),
            0.25
        );
    }
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
            console.log("Attempting to render skybox");
            this.render();
        } else {
            console.log("Waiting for skybox texture to load...");
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

        console.log("Rendering skybox with uniforms:", uniforms);

        try {
            // Set buffers and uniforms
            twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
            twgl.setUniforms(this.programInfo, uniforms);

            // Draw
            gl.depthMask(false);
            twgl.drawBufferInfo(gl, this.bufferInfo);
            gl.depthMask(true);

            console.log("Skybox rendered successfully");
        } catch (error) {
            console.error("Error rendering skybox:", error);
        }

        // Restore GL state
        gl.depthFunc(currentDepthFunc);
        gl.enable(gl.CULL_FACE);
    }
}