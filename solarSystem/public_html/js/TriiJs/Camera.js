const YAW         = -90.0;
const PITCH       =  0.0;
const SPEED       =  0.005;
const SENSITIVITY =  0.01;
const ZOOM        =  45.0;

class Camera{
    position;
    front;
    up;
    right;
    worldUp;

    yaw;
    pitch;

    movementSpeed;
    mouseSensitivity;
    zoom;

    target;
    radius;
    constructor(position = vec3.fromValues(0,0,0), up = vec3.fromValues(0,1,0), yaw = YAW, pitch = PITCH, target = vec3.fromValues(0, 0, 0), radius = -30) {
        this.front = vec3.fromValues(0,0,-1);
        this.right = vec3.create();
        this.up = vec3.create();
        this.movementSpeed = SPEED;
        this.mouseSensitivity = SENSITIVITY;
        this.zoom = ZOOM;


        this.position = position;
        this.worldUp = up;
        this.yaw = yaw;
        this.pitch = pitch;

        this.target = target;
        this.radius = radius;

        this.updateCameraVectors();
    }


    updateCameraVectors() {
        let posX = this.target[0] + this.radius * Math.cos(gl_Matrix.toRadian(this.yaw)) * Math.cos(gl_Matrix.toRadian(this.pitch));
        let posY = this.target[1] + this.radius * Math.sin(gl_Matrix.toRadian(this.pitch));
        let posZ = this.target[2] + this.radius * Math.sin(gl_Matrix.toRadian(this.yaw)) * Math.cos(gl_Matrix.toRadian(this.pitch));

        this.position = vec3.fromValues(posX, posY, posZ);

        vec3.normalize(this.front,vec3.sub(this.front,this.target, this.position));
        vec3.normalize(this.right,vec3.cross(this.right,this.front, this.worldUp));
        vec3.normalize(this.up,vec3.cross(this.up,this.right, this.front));
    }

    getViewMatrix(){
        let view = mat4.create();
        mat4.lookAt(view,this.position,this.target,this.up);
        return view;
    }


    processCameraMovement(deltaX, deltaY) {
        let right = vec3.create();
        vec3.normalize(right,vec3.cross(right,this.front, this.up));
        let velocity = vec3.add(vec3.create(),
            vec3.multiplyScalar(vec3.create(),right,deltaX*this.movementSpeed),
            vec3.multiplyScalar(vec3.create(),vec3.normalize(this.up,this.up),deltaY*this.movementSpeed));

        this.target = vec3.add(this.target,this.target, velocity);

        this.updateCameraVectors();
    }

    processCameraRotation(xoffset, yoffset, constraintPitch = true){
        xoffset *= this.mouseSensitivity;
        yoffset *= this.mouseSensitivity;

        this.yaw += xoffset;
        this.pitch += yoffset;

        if(constraintPitch){
            if(this.pitch>89.0) this.pitch = 89.0;
            if(this.pitch<-89.0) this.pitch = -89.0;
        }

        this.updateCameraVectors()
    }

    processZoom(yoffset){
        this.zoom -= yoffset;
        if(this.zoom < 1.0) this.zoom = 1.0;
        if(this.zoom > 45.0) this.zoom = 45.0;
    }

}