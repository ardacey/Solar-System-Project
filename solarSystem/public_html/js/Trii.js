class Time{
    perfectFrameTime = 1000 / 60;
    deltaTime = 0;
    lastTimestamp = 0;

    UpdateTime(timestamp){
        this.deltaTime = (timestamp - this.lastTimestamp) / this.perfectFrameTime;
        this.lastTimestamp = timestamp;

    }
}

const time = new Time();



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
        return new SceneClass(SceneObject,...params);

    }
    else{
    return new SceneClass(SceneObject);
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
        for (let i = 0; i < listOfSceneObjects.length; i++) {
            listOfSceneObjects[i].scene = this;
        }
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
            viewPos: this.camera.position
        }
        shader?.setUniforms(uniforms);
    }

    getInstancesOf(instance){
        let returnElements = [];
        for (let i = 0; i <this.listOfSceneObjects.length ; i++) {
            let element = this.listOfSceneObjects[i].SceneObjectScripts.find(script => script instanceof instance);
            if(element){
                returnElements.push(element);
            }
        }
        return returnElements;
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
    scene;

    constructor(mesh, shader, transform = new Transform()) {
        this.ID = Math.floor(Math.random() * 2**8);
        this.Mesh = mesh;
        this.shader = shader;
        this.SceneObjectScripts = [];

        this.transform = transform;
        this.startEvents = new Event(this.getStartEventName());
        this.updateEvents = new Event(this.getUpdateEventName());

        addEventListener(this.getStartEventName(),(e)=>{
            this.Mesh?.setupMesh();
        })
        addEventListener(this.getUpdateEventName(), (e)=>{
            this.Mesh?.draw(this.shader);
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
    static CreateEmptySceneObject(){
        return new SceneObject();
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
        let rotateMatrix = mat4.create();
        mat4.mul(rotateMatrix,rotateMatrixZ,
            mat4.mul(rotateMatrix,rotateMatrixY,rotateMatrixX));

        let rotateAroundCenterMatrix = rotateMatrix;
        let minusPositionTranslate = mat4.create();
        let plusPositionTranslate = mat4.create();

        mat4.translate(minusPositionTranslate, minusPositionTranslate, vec3.scale(vec3.create,this.position,-1));
        mat4.translate(minusPositionTranslate, minusPositionTranslate, this.position);

        mat4.mul(rotateAroundCenterMatrix,plusPositionTranslate,
            mat4.mul(rotateAroundCenterMatrix,rotateAroundCenterMatrix,minusPositionTranslate));

        let translationMatrix = mat4.translate(mat4.create(),mat4.create(),vec3.fromValues(this.position[0], this.position[1], this.position[2]));
        let scalingMatrix = mat4.scale(mat4.create(),mat4.create(),vec3.fromValues(this.scale[0],this.scale[1],this.scale[2]));
        let modelMatrix = mat4.create();
        mat4.mul(modelMatrix,translationMatrix,
            mat4.mul(modelMatrix,rotateAroundCenterMatrix,scalingMatrix));
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

class MaterialHandler {
    setupMaterialUniforms(material, shader, gl) {
        // Convert HTML image to texture
        if (material.mapDiffuse?.texture?.nodeName === 'IMG') {
            material.mapDiffuse.texture = this.imageToTexture(material.mapDiffuse.texture, gl);
        }

        const uniforms = {
            'material.diffuse': material.mapDiffuse?.texture || this.createDefaultTexture(gl),
            'material.diffuseColor': material.diffuse || [1, 1, 1],
            'material.shininess': material.specularExponent || 32.0
        };

        shader.setUniforms(uniforms);
    }

    imageToTexture(img, gl) {
        return twgl.createTexture(gl, {
            src: img,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrap: gl.CLAMP_TO_EDGE
        });
    }


    createDefaultTexture(gl) {
        const pixels = new Uint8Array([255, 255, 255, 255]);
        return twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            width: 1,
            height: 1,
            data: pixels
        });
    }
}

class Mesh{
    meshOBJ;
    gl;

    bufferInfo;

    constructor(meshOBJ, gl){
        this.meshOBJ = meshOBJ;
        this.gl = gl;
        this.materialHandler = new MaterialHandler();
    }


    draw(shader) {
        const gl = this.gl


        shader.useProgram();
        twgl.setBuffersAndAttributes(gl, shader.programInfo, this.bufferInfo);

        if (this.meshOBJ.materialsByIndex) {
            for (const [index, material] of Object.entries(this.meshOBJ.materialsByIndex)) {
                this.materialHandler.setupMaterialUniforms(material, shader, this.gl);
                const indices = this.meshOBJ.indicesPerMaterial[index];
                if (indices && indices.length > 0) {
                    // Create new bufferInfo for this subset
                    const subsetBufferInfo = twgl.createBufferInfoFromArrays(this.gl, {
                        ...this.bufferInfo.attribs,
                        indices: { numComponents: 3, data: indices }
                    });
                    twgl.drawBufferInfo(this.gl, subsetBufferInfo);
                }
            }
        } else {
            twgl.drawBufferInfo(this.gl, this.bufferInfo);
        }
    }

    setupMesh(){
        let gl = this.gl;
        this.normalizeMesh();
        this.centerMesh();

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

    normalizeMesh(){
        let minMaxPoints = this._findMinMax();

        const vertices = this.meshOBJ.vertices;


        let max_x = minMaxPoints.maxPoint[0];
        let max_y = minMaxPoints.maxPoint[1];
        let max_z = minMaxPoints.maxPoint[2];
        let min_x = minMaxPoints.minPoint[0];
        let min_y = minMaxPoints.minPoint[1];
        let min_z = minMaxPoints.minPoint[2];

        let range_x = max_x - min_x
        let range_y = max_y - min_y
        let range_z = max_z - min_z


        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] = (vertices[i] - min_x)/range_x;     // X
            vertices[i + 1] = (vertices[i + 1] - min_y)/range_y; // Y
            vertices[i + 2] = (vertices[i+2] - min_z)/range_z; // Z
        }
    }

    _findMinMax(){
        const vertices = this.meshOBJ.vertices;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        // Find bounds
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        }

        return {minPoint: vec3.fromValues(minX, minY, minZ), maxPoint: vec3.fromValues(maxX, maxY, maxZ)};
    }
    calculateCenter() {
        let minMaxPoints = this._findMinMax();

        // Calculate center
        const centerX = (minMaxPoints.minPoint[0] + minMaxPoints.maxPoint[0]) / 2;
        const centerY = (minMaxPoints.minPoint[1] + minMaxPoints.maxPoint[1]) / 2;
        const centerZ = (minMaxPoints.minPoint[2] + minMaxPoints.maxPoint[2]) / 2;

        return vec3.fromValues(centerX, centerY, centerZ );
    }

    centerMesh() {
        const center = this.calculateCenter();
        const vertices = this.meshOBJ.vertices;

        // Offset all vertices by the negative center to move mesh to origin
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] -= center[0];     // X
            vertices[i + 1] -= center[1]; // Y
            vertices[i + 2] -= center[2]; // Z
        }

        return center; // Return the offset in case it's needed
    }

    static createSphereMesh(gl,radius = 15, latitudeBands=30, longitudeBands=30) {
        const positions = [];
        const normals = [];
        //const textureCoordData = [];
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
                //const u = 1 - (longNumber / longitudeBands); // Longitude mapped to U (0 to 1)
                //const v = latNumber / latitudeBands;         // Latitude mapped to V (0 to 1)

                // Add vertex data
                positions.push(radius * x);
                positions.push(radius * y);
                positions.push(radius * z);

                // Add normal data (normalized vertex position)
                normals.push(x);
                normals.push(y);
                normals.push(z);

                // Add texture coordinates
                //textureCoordData.push(u);
                //textureCoordData.push(v);
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

        let meshData = {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            // textureCoords: new Float32Array(textureCoordData),
            indices: new Uint16Array(indices)
        };

        return new Mesh(meshData,gl);
    }
}
