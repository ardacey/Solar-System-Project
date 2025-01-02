class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.skyboxProgram = null;
        this.sphereBuffers = null;
        this.skyboxBuffers = null;
        this.sphereVertexCount = 0;
        this.uniforms = {};
        this.skyboxUniforms = {};
        
        // Ölçeklendirme faktörleri (z-Fighting önlemek için)
        this.DISTANCE_SCALE = 1e-9;  // 1 birim = 1 milyar metre
        this.SIZE_SCALE = 1e-7;      // 1 birim = 10 milyon metre
    }

    async initialize() {
        // Ana program
        const vertexShader = await this.loadShader('glsl/vertex-shader.glsl', this.gl.VERTEX_SHADER);
        const fragmentShader = await this.loadShader('glsl/fragment-shader.glsl', this.gl.FRAGMENT_SHADER);
        this.program = this.createShaderProgram(vertexShader, fragmentShader);

        // Skybox program
        const skyboxVertexShader = await this.loadShader('glsl/skybox-vertex.glsl', this.gl.VERTEX_SHADER);
        const skyboxFragmentShader = await this.loadShader('glsl/skybox-fragment.glsl', this.gl.FRAGMENT_SHADER);
        this.skyboxProgram = this.createShaderProgram(skyboxVertexShader, skyboxFragmentShader);

        // Skybox uniforms
        this.skyboxUniforms = {
            projectionMatrix: this.gl.getUniformLocation(this.skyboxProgram, 'uProjectionMatrix'),
            viewMatrix: this.gl.getUniformLocation(this.skyboxProgram, 'uViewMatrix'),
            skybox: this.gl.getUniformLocation(this.skyboxProgram, 'uSkybox')
        };

        // Create skybox geometry (cube)
        const skyboxVertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];

        const skyboxIndices = [
            0,  1,  2,    0,  2,  3,  // front
            4,  5,  6,    4,  6,  7,  // back
            8,  9,  10,   8,  10, 11, // top
            12, 13, 14,   12, 14, 15, // bottom
            16, 17, 18,   16, 18, 19, // right
            20, 21, 22,   20, 22, 23  // left
        ];

        // Create skybox buffers
        this.skyboxBuffers = {
            position: this.gl.createBuffer(),
            indices: this.gl.createBuffer()
        };

        // Fill position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyboxBuffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(skyboxVertices), this.gl.STATIC_DRAW);

        // Fill index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skyboxBuffers.indices);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skyboxIndices), this.gl.STATIC_DRAW);

        this.skyboxVertexCount = 36; // 6 faces * 2 triangles * 3 vertices

        // Küre geometrisini oluştur
        const sphereData = this.createSphereGeometry(1, 32, 32);
        this.sphereBuffers = this.createBuffers(sphereData);
        this.sphereVertexCount = sphereData.indices.length;

        // Uniform lokasyonlarını al
        this.uniforms = {
            modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            normalMatrix: this.gl.getUniformLocation(this.program, 'uNormalMatrix'),
            lightPosition: this.gl.getUniformLocation(this.program, 'uLightPosition'),
            color: this.gl.getUniformLocation(this.program, 'uColor'),
            ambient: this.gl.getUniformLocation(this.program, 'uAmbient'),
            texture: this.gl.getUniformLocation(this.program, 'uTexture')
        };

        // Attribute lokasyonlarını al
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'aPosition'),
            normal: this.gl.getAttribLocation(this.program, 'aNormal'),
            uv: this.gl.getAttribLocation(this.program, 'uv')
        };

        // GL ayarları
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.CULL_FACE);
    }

    async loadShader(source, type) {
        const response = await fetch(source);
        const shaderSource = await response.text();
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, shaderSource);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader derleme hatası:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    createShaderProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader program bağlama hatası:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    createSphereGeometry(radius, latitudeBands, longitudeBands) {
        const positions = [];
        const normals = [];
        const textureCoordData = [];
        const indices = [];

        // Generate vertices
        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            // Calculate the current latitude angle
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                // Calculate the current longitude angle
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                // Calculate the vertex position
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                // Calculate texture coordinates
                // UV mapping for a sphere using spherical coordinates
                const u = 1 - (longNumber / longitudeBands); // Longitude mapped to U (0 to 1)
                const v = latNumber / latitudeBands;         // Latitude mapped to V (0 to 1)

                // Add vertex data
                positions.push(radius * x);
                positions.push(radius * y);
                positions.push(radius * z);

                // Add normal data (normalized vertex position)
                normals.push(x);
                normals.push(y);
                normals.push(z);

                // Add texture coordinates
                textureCoordData.push(u);
                textureCoordData.push(v);
            }
        }

        // Generate indices
        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = latNumber * (longitudeBands + 1) + longNumber;
                const second = first + longitudeBands + 1;

                // First triangle
                indices.push(first);
                indices.push(first + 1);
                indices.push(second);

                // Second triangle
                indices.push(second);
                indices.push(first + 1);
                indices.push(second + 1);
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            textureCoords: new Float32Array(textureCoordData),
            indices: new Uint16Array(indices)
        };
    }

    createBuffers(geometryData) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometryData.positions, this.gl.STATIC_DRAW);

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometryData.normals, this.gl.STATIC_DRAW);

        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geometryData.indices, this.gl.STATIC_DRAW);
        
        // Texture koordinatlarını ekle
        const uvBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometryData.textureCoords, this.gl.STATIC_DRAW);

        return { 
            position: positionBuffer, 
            normal: normalBuffer, 
            index: indexBuffer,
            uv: uvBuffer  // texture koordinatlarını da buffer'a ekle
        };
    }

    drawCelestialBody(celestialBody, viewMatrix, projectionMatrix, texture) {
        this.gl.useProgram(this.program);

        // Model matrisi oluştur
        const modelMatrix = mat4.create();
        
        // Pozisyonu ölçeklendir
        const scaledPosition = vec3.create();
        vec3.scale(scaledPosition, [
            celestialBody.position.x,
            celestialBody.position.y,
            celestialBody.position.z
        ], this.DISTANCE_SCALE);

        mat4.translate(modelMatrix, modelMatrix, scaledPosition);
        
        mat4.rotateX(modelMatrix, modelMatrix, celestialBody.rotation.x);
        mat4.rotateY(modelMatrix, modelMatrix, celestialBody.rotation.y);
        mat4.rotateZ(modelMatrix, modelMatrix, celestialBody.rotation.z);

        // Boyutu ölçeklendir
        const scaledRadius = celestialBody.radius * this.SIZE_SCALE;
        mat4.scale(modelMatrix, modelMatrix, [
            scaledRadius,
            scaledRadius,
            scaledRadius
        ]);

        // Model-view matrisini hesapla
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        // Normal matrisini hesapla
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        // Uniform değişkenleri ayarla
        this.gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, normalMatrix);
        
        // Texture uniform'ını ayarla
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.uniforms.uTexture, 0);
        
        // Vertex buffer'ları bağla
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereBuffers.position);
        this.gl.vertexAttribPointer(this.attributes.position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereBuffers.normal);
        this.gl.vertexAttribPointer(this.attributes.normal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.normal);
        
        // Texture koordinatlarını bağla
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereBuffers.uv);
        this.gl.vertexAttribPointer(this.attributes.uv, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.uv);

        // İndeks buffer'ını bağla
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.sphereBuffers.index);

        // Çiz
        this.gl.drawElements(this.gl.TRIANGLES, this.sphereVertexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    drawSkybox(viewMatrix, projectionMatrix, skyboxTexture) {
        const gl = this.gl;
        
        // Save current GL state
        const currentDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        
        // Configure GL state for skybox
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        
        // Use skybox shader
        gl.useProgram(this.skyboxProgram);
        
        // Set uniforms
        gl.uniformMatrix4fv(this.skyboxUniforms.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.skyboxUniforms.viewMatrix, false, viewMatrix);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
        gl.uniform1i(this.skyboxUniforms.skybox, 0);
        
        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyboxBuffers.position);
        const positionLocation = gl.getAttribLocation(this.skyboxProgram, 'aPosition');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyboxBuffers.indices);
        
        // Draw skybox
        gl.depthMask(false);
        gl.drawElements(gl.TRIANGLES, this.skyboxVertexCount, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
        
        // Restore GL state
        gl.depthFunc(currentDepthFunc);
        gl.enable(gl.CULL_FACE);
    }

    clear() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setLightPosition(x, y, z) {
        this.gl.useProgram(this.program);
        this.gl.uniform3f(this.uniforms.lightPosition, x, y, z);
    }

    setColor(r, g, b) {
        this.gl.useProgram(this.program);
        this.gl.uniform3f(this.uniforms.color, r, g, b);
    }

    setAmbient(value) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniforms.ambient, value);
    }
    
    loadTexture(url) {
        const gl = this.gl;
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

    deleteTexture(texture) {
        if (texture) {
            this.gl.deleteTexture(texture);
        }
    }
}

// Utility function to get next power of 2
function nextPowerOf2(value) {
    return Math.pow(2, Math.ceil(Math.log2(value)));
}

// Utility function to check if a number is a power of 2
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}
