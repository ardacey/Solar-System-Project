






class SceneObjectScript{
    sceneObject;

    /**
     * Add functionality to any scene object.
     * The sequence of the different update/start events are random,
     * initialization of a variable must be done on a higher level than its usage level.
     *
     * @param {SceneObject} sceneObject scene object to bind this behavior
     *
     * A simple example:
     *
     *     class RotateAxisY extends SceneObjectScript{
     *     rotationStep;
     *     Start() {
     *         super.Start();
     *         this.rotationStep = 1; //Init done in here
     *     }
     *
     *     Update() {
     *         super.Update();
     *         let amount = this.rotationStep; //Usage was done in here
     *         vec3.add(this.sceneObject.transform.rotation,this.sceneObject.transform.rotation, vec3.fromValues(0,amount,0));
     *     }
     *
     *
     * İf you want to use a variable in another script make sure the usage is done in one layer below
     */
    constructor(sceneObject) {
        this.sceneObject = sceneObject;
        sceneObject.SceneObjectScripts.push(this);
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

/**
 * Bind pairs effectively
 *
 * @param {SceneObject} SceneObject scene object to bind this behavior
 * @param {SceneClass} SceneClass behavior to bind
 * @param {array} params dynamic parameters of SceneClass. It takes only enough params. If 1 is enough but
 * 2 is suplied only the firs one accepted
 *
 * A simple example:
 *         BindSceneObject(sceneObjects[2], ZoomInOut,[-200]);
 *
 */
function BindSceneObject(SceneObject, SceneClass, params = undefined){
    if(params){
        new SceneClass(SceneObject,...params);
    }
    else{
    new SceneClass(SceneObject);
    }
}

//DO NOT USE, Not Complete
function BindSceneObjectMultiple(SceneObjects, SceneClasses, params){
    for(let i=0; i<SceneClasses.length;i++){
        BindSceneObject(SceneObjects[i], SceneClasses[i], params[i]);
    }
}

class Scene {
    camera;
    listOfSceneObjects;
    canvas;

    constructor(listOfSceneObjects,camera,canvas){
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
        let projectionMatrix = mat4.perspective(mat4.create(),gl_Matrix.toRadian(this.camera.zoom),
            this.canvas.width/this.canvas.height,0.5,10000.0);
        return projectionMatrix;
    }

    updateMatrices(model,view,projection,shader) {
        let uniforms = {
            model:model,
            view:view,
            projection:projection,
        }
        shader.setUniforms(uniforms);
    }


}

class SceneObject {
    ID;
    SceneObjectScripts;
    Mesh;
    transform;
    shader;
    startEvents;
    updateEvents;

    constructor(mesh, shader, transform = new Transform()) {
        this.ID = Math.floor(Math.random() * 2**8);
        this.Mesh = mesh;
        this.shader = shader;
        this.SceneObjectScripts = [];

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
        let modelMatrix = mat4.create();
        mat4.mul(modelMatrix,translationMatrix,
            mat4.mul(modelMatrix,rotateMatrixZ,
                mat4.mul(modelMatrix,rotateMatrixY,
                    mat4.mul(modelMatrix,rotateMatrixX,scalingMatrix))));
        return modelMatrix;
    }

    rotateX(theta){
        return mat4.fromRotation(mat4.create(), gl_Matrix.toRadian(theta), vec3.fromValues(1,0,0))
    }
    rotateY(theta){
        return mat4.fromRotation(mat4.create(), gl_Matrix.toRadian(theta), vec3.fromValues(0,1,0))
    }
    rotateZ(theta){
        return mat4.fromRotation(mat4.create(), gl_Matrix.toRadian(theta), vec3.fromValues(0,0,1))
    }
}

class Mesh{
    meshOBJ;
    gl;

    bufferInfo;

    constructor(meshOBJ, gl){
        this.meshOBJ = meshOBJ;
        this.gl = gl;
    }


    draw(shader){
        let gl = this.gl;
        shader.useProgram();
        twgl.setBuffersAndAttributes(gl, shader.programInfo,this.bufferInfo);
        twgl.drawBufferInfo(gl,this.bufferInfo);
    }

    setupMesh(){
        let gl = this.gl;

        let positions = this.meshOBJ.vertices;
        let normals = this.meshOBJ.vertexNormals;
        let indices = this.meshOBJ.indices;

        const arrays = {
            aPos: { numComponents: 3, data: positions },
            aNormal: { numComponents: 3, data: normals },
            indices: { numComponents: 3, data: indices },
        };

        if(this.meshOBJ.textures.length > 0){
            arrays.aTextCoord = this.meshOBJ.textures;
        }

        this.bufferInfo = twgl.createBufferInfoFromArrays(gl,arrays);
    }
}
