"use strict";

var gl;
window.mat4 = glMatrix.mat4
window.mat2 = glMatrix.mat2
window.mat2d= glMatrix.mat2d
window.mat3= glMatrix.mat3
window.mat4= glMatrix.mat4
window.quat= glMatrix.quat
window.quat2= glMatrix.quat2
window.vec2= glMatrix.vec2
window.vec3= glMatrix.vec3
window.vec4= glMatrix.vec4

window.onload = function init() {
    const canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Beyaz arka plan
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    console.log(mat4.create());
    
    
    // Shader'ları başlat
    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    // Küre verilerini oluştur
    const sphereData = createSphere(1.0, 50, 50);  // Yarıçap 1, 20x20 dilim
    const buffers = setupBuffers(gl, sphereData);

    // Attribute'ları ve uniform'ları bağla
    setupAttributesAndUniforms(gl, program, buffers);

    // Çizim işlemi
    drawScene(gl, program, buffers, sphereData.indices.length);
    
}


function createSphere(radius, latitudes, longitudes) {
    const positions = [];
    const colors = [];
    const indices = [];

    // Küreyi oluştur
    for (let lat = 0; lat <= latitudes; lat++) {
        const theta = lat * Math.PI / latitudes; // Yükseklik açısı
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longitudes; lon++) {
            const phi = lon * 2 * Math.PI / longitudes; // Yatay açısı
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Koordinatları hesapla
            const x = radius * cosPhi * sinTheta;
            const y = radius * cosTheta;
            const z = radius * sinPhi * sinTheta;

            positions.push(x, y, z);

            // Renkler (örnek olarak her vertex için rastgele renkler)
            colors.push(Math.random(), Math.random(), Math.random(), 1.0);
        }
    }

    // İndeksler
    for (let lat = 0; lat < latitudes; lat++) {
        for (let lon = 0; lon < longitudes; lon++) {
            const first = (lat * (longitudes + 1)) + lon;
            const second = first + longitudes + 1;

            // İki üçgen oluştur
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { positions, colors, indices };
}

function setupBuffers(gl, sphereData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereData.indices), gl.STATIC_DRAW);

    return { positionBuffer, colorBuffer, indexBuffer };
}

function setupAttributesAndUniforms(gl, program, buffers) {
    // Vertex pozisyonlarını bağla
    const positionLocation = gl.getAttribLocation(program, "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Renk verilerini bağla
    const colorLocation = gl.getAttribLocation(program, "vColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);
}

function drawScene(gl, program, buffers, numIndices) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Model ve projeksiyon matrislerini ayarlayın
    const uModelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
    const uProjectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");

    const modelViewMatrix = mat4.create();
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.lookAt(modelViewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);

    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

    // Çizim işlemi
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, 0);
}