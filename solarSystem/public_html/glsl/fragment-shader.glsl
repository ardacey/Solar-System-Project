#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vPosition;

uniform vec3 uLightPosition;
uniform vec3 uColor;
uniform float uAmbient;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    float diffuse = max(dot(normal, lightDir), 0.0);
    vec3 color = uColor * (uAmbient + diffuse);
    
    fragColor = vec4(color, 1.0);
}