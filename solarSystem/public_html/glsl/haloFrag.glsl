#version 300 es
precision highp float;

struct Material {
    sampler2D diffuse;
    sampler2D ambient;
    sampler2D specular;
    sampler2D normal;
    sampler2D bump;
    sampler2D displacement;
    float shininess;
    vec3 diffuseColor;
    vec3 ambientColor;
    vec3 specularColor;
};

uniform Material material;
uniform vec3 lightPos;
uniform vec3 viewPos;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec3 vPosition;

out vec4 FragColor;

void main() {
    vec3 viewDirAtm = normalize(viewPos - vPosition);
    float viewAngle = 3.7 - abs(dot(Normal, viewPos));
    float alpha =  smoothstep(0., 2., viewAngle);


    vec3 atmosphereColor = vec3(0.929, 0.204, 0.016);
    FragColor = vec4(atmosphereColor, 1. - alpha);



}