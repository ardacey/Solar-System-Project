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
in vec3 WorldPos;

out vec4 FragColor;

void main() {
    vec3 N = normalize(Normal);
    vec3 L = normalize(lightPos - FragPos);
    vec3 V = normalize(viewPos - FragPos);
    vec3 H = normalize(L + V);

    vec3 albedo = material.diffuseColor * vec3(texture(material.diffuse, TexCoords));
    float roughness = 1.0 - material.shininess / 256.0;

    vec3 ambient = 0.05 * albedo;

    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = albedo * NdotL*2.0;

    float NdotH = max(dot(N, H), 0.0);
    float specularStrength = pow(NdotH, material.shininess*2.0);
    vec3 specular = vec3(0.5) * specularStrength;

    vec3 viewDir = V;
    vec3 reflectDir = reflect(-L, N);
    float spec = pow(NdotH, material.shininess);
    specular = material.specularColor * spec * vec3(texture(material.specular, TexCoords));


    float distance = length(lightPos - FragPos);

    vec3 finalColor = (ambient + (diffuse + specular) );

    finalColor = finalColor / (finalColor + vec3(1.0));

    finalColor = pow(finalColor, vec3(1.0/2.2));

    FragColor = vec4(finalColor, 1.0);
}