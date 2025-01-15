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
    // Base lighting parameters
    vec3 N = normalize(Normal);
    vec3 L = normalize(lightPos - FragPos);
    vec3 V = normalize(viewPos - FragPos);
    vec3 H = normalize(L + V);  // Half vector for Blinn-Phong

    // Get material properties
    vec3 albedo = material.diffuseColor * vec3(texture(material.diffuse, TexCoords));
    float roughness = 1.0 - material.shininess / 256.0;

    // Ambient
    vec3 ambient = 0.01 * albedo;

    // Diffuse
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = albedo * NdotL*2.0;

    // Specular (using Blinn-Phong)
    float NdotH = max(dot(N, H), 0.0);
    float specularStrength = pow(NdotH, material.shininess*2.0);
    vec3 specular = vec3(0.5) * specularStrength;

    // Distance attenuation (softer falloff)
    float distance = length(lightPos - FragPos);

    // Combine components
    vec3 finalColor = (ambient + (diffuse + specular) );

    // HDR tonemapping
    finalColor = finalColor / (finalColor + vec3(1.0));

    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));

    FragColor = vec4(finalColor, 1.0);
}