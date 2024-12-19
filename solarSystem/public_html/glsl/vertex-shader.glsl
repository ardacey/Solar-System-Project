#version 300 es

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec3 vNormal;
out vec3 vPosition;

void main() {
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);
    vec4 position = uModelViewMatrix * vec4(aPosition, 1.0);
    vPosition = position.xyz;
    gl_Position = uProjectionMatrix * position;
}