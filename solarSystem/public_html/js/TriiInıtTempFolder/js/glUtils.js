
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const gl_Matrix = glMatrix.glMatrix;
const twgl = window.twgl;
const OBJ = window.OBJ;

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
    OBJ.initMeshBuffers
    let obj = new OBJ.Mesh(objString);
    console.log(obj);
    return new Mesh(obj,gl);
}




