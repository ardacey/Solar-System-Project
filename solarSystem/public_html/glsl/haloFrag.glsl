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
    float viewAngle = dot(Normal, viewPos);
    float alpha = smoothstep(3., 1.0, viewAngle);


    vec3 atmosphereColor = vec3(0.0, 0.4, 1.0);
    FragColor = vec4(atmosphereColor, alpha);



}