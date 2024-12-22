async function ReadFile(filePath) {
    const response = await fetch(filePath);
    return await response.text();
}

async function initShader(vertexShaderPath, fragmentShaderPath, gl) {
    const vertexCode = await ReadFile(vertexShaderPath);
    const fragmentCode = await ReadFile(fragmentShaderPath);

    return new Shader(vertexCode, fragmentCode,gl);
}
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const gl_Matrix = glMatrix.glMatrix;

function loadMeshData(objString, gl) {
    let lines = objString.split("\n");
    let vertices = [];
    let normals = [];
    let indices = [];

    for ( let i = 0 ; i < lines.length ; i++ ) {
        let parts = lines[i].trimEnd().split(' ');

        if ( parts.length <= 0 ) continue;

        let meshDataCheck = parts[0];

        if(meshDataCheck === "v"){
            let v = new Vertex();
            v.position = vec3.fromValues(
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            );
            vertices.push(v);
        }
        else if (meshDataCheck === "vn"){
            normals.push(
                vec3.fromValues(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ));
        }
        else if (meshDataCheck === "f"){

            let f1 = parts[1].split('/');
            let f2 = parts[2].split('/');
            let f3 = parts[3].split('/');

            vertices[parseInt(f1[0]) - 1].normal = normals[parseInt(f1[2]) - 1]
            vertices[parseInt(f2[0]) - 1].normal = normals[parseInt(f2[2]) - 1]
            vertices[parseInt(f3[0]) - 1].normal = normals[parseInt(f3[2]) - 1]


            let faceIndices = [parseInt(f1[0])-1,parseInt(f2[0])-1,parseInt(f3[0])-1];

            indices.push(faceIndices);

        }
    }
    indices = indices.flat();
    return new Mesh(vertices,indices,gl);
}




