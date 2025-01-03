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

out vec4 FragColor;

void main() {
    // Ambient
    vec3 ambient = vec3(0.1)*material.ambientColor * vec3(texture(material.ambient, TexCoords));

    // Normal mapping
    vec3 normal = normalize(Normal);
    if(textureSize(material.normal, 0).x > 1) {
        normal = normalize(vec3(texture(material.normal, TexCoords)) * 2.0 - 1.0);
    }

    // Diffuse
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    diff = 1.0;
    vec3 diffuse = material.diffuseColor * diff * vec3(texture(material.diffuse, TexCoords));

    // Specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = material.specularColor * spec * vec3(texture(material.specular, TexCoords));

    FragColor = vec4(diffuse, 1.0);


}