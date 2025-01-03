#version 300 es

in vec3 aPosition;
in vec3 aNormal;
in vec2 uv; 

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec3 vNormal;
out vec3 vPosition;
out vec2 vUv;

void main() {
    vUv = uv; // Doku koordinatlarını aktarma
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);
    vec4 position = uModelViewMatrix * vec4(aPosition, 1.0);
    vPosition = position.xyz;
    gl_Position = uProjectionMatrix * position;
}