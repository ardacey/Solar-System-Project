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
            ambient: this.gl.getUniformLocation(this.program, 'uAmbient')
        };

        // Attribute lokasyonlarını al
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'aPosition'),
            normal: this.gl.getAttribLocation(this.program, 'aNormal')
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
        const indices = [];

        // Vertex pozisyonlarını ve normallerini hesapla
        for (let lat = 0; lat <= latitudeBands; lat++) {
            const theta = lat * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= longitudeBands; lon++) {
                const phi = lon * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                positions.push(radius * x, radius * y, radius * z);
                normals.push(x, y, z);
            }
        }

        // İndeksleri oluştur
        for (let lat = 0; lat < latitudeBands; lat++) {
            for (let lon = 0; lon < longitudeBands; lon++) {
                const first = (lat * (longitudeBands + 1)) + lon;
                const second = first + longitudeBands + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
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

        return { position: positionBuffer, normal: normalBuffer, index: indexBuffer };
    }

    drawCelestialBody(celestialBody, viewMatrix, projectionMatrix) {
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
        
        // Vertex buffer'ları bağla
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereBuffers.position);
        this.gl.vertexAttribPointer(this.attributes.position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphereBuffers.normal);
        this.gl.vertexAttribPointer(this.attributes.normal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.normal);

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
}
