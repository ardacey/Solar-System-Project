#version 300 es

in vec3 aPosition;
out vec3 vTexCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

void main() {
    // Pass position to fragment shader for texture sampling
    vTexCoord = aPosition;
    
    // Remove translation from view matrix
    mat4 rotationOnlyView = mat4(
        vec4(uViewMatrix[0].xyz, 0.0),
        vec4(uViewMatrix[1].xyz, 0.0),
        vec4(uViewMatrix[2].xyz, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
    
    // Position in clip space (make skybox larger)
    vec4 clipPos = uProjectionMatrix * rotationOnlyView * vec4(aPosition * 500.0, 1.0);
    
    // Make sure skybox is always rendered at the far plane
    gl_Position = clipPos.xyww;
}
