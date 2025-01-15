
const mat4 = glMatrix.mat4;
const mat3 = glMatrix.mat3;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;
const gl_Matrix = glMatrix.glMatrix;
const twgl = window.twgl;
const OBJ = window.OBJ;
const CANNON = window.CANNON;

async function ReadFile(filePath) {
    const response = await fetch(filePath);
    return await response.text();
}

async function initShader(vertexShaderPath, fragmentShaderPath, gl) {
    const vertexCode = await ReadFile(vertexShaderPath);
    const fragmentCode = await ReadFile(fragmentShaderPath);

    return new Shader(vertexCode, fragmentCode,gl);
}


function loadMeshData(objString, gl) {
    let obj = new OBJ.Mesh(objString);
    console.log(obj);
    return new Mesh(obj,gl);
}

function drawBufferInfo(gl, bufferInfo, type, count, offset, instanceCount) {
    type = type === undefined ? gl.TRIANGLES : type;
    var indices = bufferInfo.indices;
    var elementType = bufferInfo.elementType;
    var numElements = count === undefined ? bufferInfo.numElements : count;
    offset = offset === undefined ? 0 : offset;

    if (elementType || indices) {
            gl.drawElements(type, numElements, elementType === undefined ? gl.UNSIGNED_SHORT : bufferInfo.elementType, offset);

    } else {
            gl.drawArrays(type, offset, numElements);

    }
}


