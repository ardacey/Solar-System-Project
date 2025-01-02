

//basic shader class to handling shader reading and compiling
class Shader {
    programInfo;
    program;
    gl;
    constructor(vertexCode, fragmentCode,gl) {
        this.gl = gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER,vertexCode);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER,fragmentCode);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(`Error linking program: ${gl.getProgramInfoLog(this.program)}`);
            return null;
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        this.programInfo = twgl.createProgramInfoFromProgram(gl,this.program);
    }

    useProgram(){
        this.gl.useProgram(this.program);
    }

    createShader(type, source) {
        let gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setUniform4fVector(variableName, values){
        let gl = this.gl;
        this.useProgram();
        gl.uniform4fv(gl.getUniformLocation(this.program,variableName),new Float32Array(values));
    }

    setUniform2FVector(variableName, values){
        let gl = this.gl;
        this.useProgram();
        gl.uniform2fv(gl.getUniformLocation(this.program,variableName),new Float32Array(values));
    }
    setUniform3FVector(variableName, values){
        let gl = this.gl;
        this.useProgram();
        gl.uniform3fv(gl.getUniformLocation(this.program,variableName),new Float32Array(values));
    }

    setUniform1f(variableName, value){
        let gl = this.gl;
        this.useProgram();
        gl.uniform1f(gl.getUniformLocation(this.program,variableName),value);
    }

    setUniform4fMatrix(variableName, values){
        let gl = this.gl;
        this.useProgram();
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program,variableName),false, new Float32Array(values));
    }

    setUniforms(uniforms){
        this.useProgram();
        twgl.setUniforms(this.programInfo, uniforms);
    }

}
