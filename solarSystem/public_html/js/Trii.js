class SceneObjectScript{
    sceneObject;

    constructor(sceneObject) {
        this.sceneObject = sceneObject;
        addEventListener(this.sceneObject.getStartEventName(),(e)=>{
            this.Start()
        })
        addEventListener(this.sceneObject.getUpdateEventName(),(e)=>{
            this.Update()
        })
    }

    Start(){}

    Update(){}

    getTransform(){
        return this.sceneObject.transform;
    }
}

class Scene {
    camera;
    listOfSceneObjects;
    canvas;

    constructor(listOfSceneObjects,camera,canvas) {
        this.listOfSceneObjects = listOfSceneObjects;
        this.camera = camera;
        this.canvas = canvas;
    }


    Start(){
        for(let i=0; i<this.listOfSceneObjects.length;i++){
            dispatchEvent(this.listOfSceneObjects[i].startEvents);
        }
    }

    Update(){
        for(let i=0; i<this.listOfSceneObjects.length;i++){
            let sceneObject = this.listOfSceneObjects[i];
            let projectionMatrix = this.getProjectionMatrix();

            this.updateMatrices(sceneObject.getModelMatrix(),this.camera.getViewMatrix(),projectionMatrix, sceneObject.shader)

            dispatchEvent(sceneObject.updateEvents);
        }
    }

    getProjectionMatrix(){
        let projectionMatrix = mat4.perspective(mat4.create(),glMatrix.toRadian(this.camera.zoom),
            this.canvas.width/this.canvas.height,30.0,10000.0);
        return projectionMatrix;
    }

    updateMatrices(model,view,projection,shader) {
        shader.setUniform4fMatrix("model",model);
        shader.setUniform4fMatrix("view",view);
        shader.setUniform4fMatrix("projection",projection);
    }


}

class SceneObject {
    ID;
    Mesh;
    transform;
    shader;
    startEvents;
    updateEvents;

    constructor(mesh, shader, transform = new Transform()) {
        this.ID = Math.floor(Math.random() * 2**8);
        this.Mesh = mesh;
        this.shader = shader;
        this.transform = transform;
        this.startEvents = new Event(this.getStartEventName());
        this.updateEvents = new Event(this.getUpdateEventName());

        addEventListener(this.getStartEventName(),(e)=>{
            this.Mesh.setupMesh();
        })
        addEventListener(this.getUpdateEventName(), (e)=>{
            this.Mesh.draw(this.shader);
        });
    }

    getStartEventName(){
        return "Start" + this.ID.toString();
    }

    getUpdateEventName(){
        return "Update" + this.ID.toString();
    }


    getModelMatrix(){
        return this.transform.getModelMatrix();
    }
}

class Transform {
    position;
    rotation;
    scale;

    constructor(position = vec3.fromValues(0,0,0), rotation = vec3.fromValues(0,0,0), scale = vec3.fromValues(1,1,1)) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    getModelMatrix(){
        let rotateMatrixX = this.rotateX(this.rotation[0]);
        let rotateMatrixY = this.rotateY(this.rotation[1]);
        let rotateMatrixZ = this.rotateZ(this.rotation[2]);
        let translationMatrix = mat4.translate(mat4.create(),mat4.create(),vec3.fromValues(this.position[0], this.position[1], this.position[2]));
        let scalingMatrix = mat4.scale(mat4.create(),mat4.create(),vec3.fromValues(this.scale[0],this.scale[1],this.scale[2]));
        let modelMatrix = mat4.mul(modelMatrix,translationMatrix,
            mat4.mul(modelMatrix,rotateMatrixZ,
                mat4.mul(modelMatrix,rotateMatrixY,
                    mat4.mul(modelMatrix,rotateMatrixX,scalingMatrix))));
        return modelMatrix;
    }

    rotateX(theta){
        return mat4.fromRotation(mat4.create(), glMatrix.toRadian(theta), vec3.fromValues(1,0,0))
    }
    rotateY(theta){
        return mat4.fromRotation(mat4.create(), glMatrix.toRadian(theta), vec3.fromValues(0,1,0))
    }
    rotateZ(theta){
        return mat4.fromRotation(mat4.create(), glMatrix.toRadian(theta), vec3.fromValues(0,0,1))
    }
}

function createAndBindVAO(gl){
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    return vao
}

function drawVAOwithElements(gl,shader, vao, drawType,elementCount, elementType, offset){
    shader.useProgram();
    gl.bindVertexArray(vao);
    gl.drawElements(drawType,elementCount,elementType,offset);
    gl.bindVertexArray(null);
}

class Mesh{
    vertices;
    indices;
    gl;

    vao;vbo;ebo;

    constructor(vertices, indices, gl){

        this.vertices = vertices;
        this.indices = indices;
        this.gl = gl;
        this.setupMesh(this.gl);
    }

    draw(shader){
        let gl = this.gl;
        drawVAOwithElements(gl,shader,this.vao,gl.TRIANGLES,this.indices.length,gl.UNSIGNED_INT,0);
    }

    //for this to work we assume vertices are in layout 0,
    //and normals in layout 1
    setupMesh(){
        let gl = this.gl;
        this.vao = createAndBindVAO(gl);
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        let positions = Vertex.getFlattenMemberFromArray(this.vertices);
        let normals = Vertex.getFlattenMemberFromArray(this.vertices,false);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER,
            4*(positions.length+normals.length),gl.STATIC_DRAW);

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
        gl.bufferSubData(gl.ARRAY_BUFFER,positions.length*4,normals);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Int32Array(this.indices),gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0,3,gl.FLOAT,false, 0, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1,3,gl.FLOAT,false, 0, positions.length*4);

    }
}

class Vertex{
    position = vec3.fromValues(0,0,0);
    normal = vec3.fromValues(0,0,0);

    static getFlattenMemberFromArray(vertices, isPositions = true){
        let returnArray = [];
        for(let i = 0; i < vertices.length; i++){
            let pushElement = isPositions === true ? vertices[i].position : vertices[i].normal;
            returnArray.push(pushElement);
        }
        return flatten(returnArray);
    }
}

function flatten( v )
{
    var floats = new Float32Array( v.length*v[0].length  );

    for(var i = 0; i<v.length; i++) for(var j=0; j<v[0].length; j++) {
        floats[i*v[0].length+j] = v[i][j];
    }
    return floats;
}