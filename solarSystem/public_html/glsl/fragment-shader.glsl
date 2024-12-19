#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vPosition;

uniform vec3 uLightPosition;
uniform vec3 uColor;
uniform float uAmbient;

out vec4 fragColor;

void main() {
    // Phong shading
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uColor;
    vec3 ambient = uAmbient * uColor;
    
    fragColor = vec4(ambient + diffuse, 1.0);
}