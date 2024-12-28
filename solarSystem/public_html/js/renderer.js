class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.sphereBuffers = null;
        this.sphereVertexCount = 0;
        this.uniforms = {};
        
        // Ölçeklendirme faktörleri (z-Fighting önlemek için)
        this.DISTANCE_SCALE = 1e-9;  // 1 birim = 1 milyar metre
        this.SIZE_SCALE = 1e-7;      // 1 birim = 10 milyon metre
    }

    async initialize() {
        // Shader programını oluştur
        this.program = await this.createShaderProgram();
        
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

    async createShaderProgram() {
        // Vertex shader'ı yükle ve derle
        const vertexShaderResponse = await fetch('glsl/vertex-shader.glsl');
        const vertexShaderSource = await vertexShaderResponse.text();
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            console.error('Vertex shader derleme hatası:', this.gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Fragment shader'ı yükle ve derle
        const fragmentShaderResponse = await fetch('glsl/fragment-shader.glsl');
        const fragmentShaderSource = await fragmentShaderResponse.text();
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);

        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error('Fragment shader derleme hatası:', this.gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Shader programını oluştur ve bağla
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

        // Default white texture while loading
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
            new Uint8Array([255, 255, 255, 255]));

        const image = new Image();
        image.onload = () => {
            // Get max texture size supported by GPU
            const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            
            // Create a canvas to potentially resize the image
            const canvas = document.createElement('canvas');
            let width = image.width;
            let height = image.height;
            
            // Scale down if image is too large
            if (width > maxSize || height > maxSize) {
                const scale = maxSize / Math.max(width, height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }
            
            // Ensure dimensions are power of 2
            const finalWidth = nextPowerOf2(width);
            const finalHeight = nextPowerOf2(height);
            
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            
            // Draw and potentially resize the image
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

            // Bind and set texture parameters
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // Use REPEAT wrapping for proper sphere mapping
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Load the resized texture
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            gl.generateMipmap(gl.TEXTURE_2D);
            
            // Optional: log texture information
            console.log(`Loaded texture ${url}: ${finalWidth}x${finalHeight}`);
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
