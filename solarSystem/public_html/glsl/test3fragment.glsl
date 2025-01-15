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
uniform vec3 lightPos;  // Işık pozisyonu
uniform vec3 viewPos;   // Kamera pozisyonu

in vec3 FragPos;        // Fragman pozisyonu
in vec3 Normal;         // Normal vektörü
in vec2 TexCoords;     // Doku koordinatları
in mat4 fragModel;

out vec4 FragColor;     // Çıktı fragmanı rengi

void main() {
    // Ambient bileşeni (ortam ışığı)
    vec3 ambient = 0.1 * material.ambientColor * vec3(texture(material.ambient, TexCoords));

    // Normal haritalama (Normal mapping)
    vec3 normal = normalize(Normal);
    if(textureSize(material.normal, 0).x > 1) {
        normal = normalize(vec3(texture(material.normal, TexCoords)) * 2.0 - 1.0);
    }

    normal = mat3(transpose(inverse(fragModel))) * normal;

    // Işık yönü ve diffuse bileşeni (yansıyan ışık)
    vec3 lightDir = normalize(lightPos - FragPos);  // Işığın geldiği yön
    float diff = max(dot(normal, lightDir), 0.0);   // Işık-giriş açısının hesaplanması
    vec3 diffuse = material.diffuseColor * diff * vec3(texture(material.diffuse, TexCoords));

    // Specular bileşeni (yansıyan parlaklık)
    vec3 viewDir = normalize(viewPos - FragPos);    // Kamera yönü
    vec3 reflectDir = reflect(-lightDir, normal);   // Işığın yansıması
    float spec = pow(max(dot(viewDir, reflectDir), 0.5), material.shininess);  // Phong parlaklık hesaplaması
    vec3 specular = material.specularColor * spec * vec3(texture(material.specular, TexCoords));

    // Distance attenuation (mesafe zayıflaması) hesaplaması
    float distance = length(lightPos - FragPos);  // Işık ile fragman arasındaki mesafe
    float attenuation = 1000.0 / ( distance);  // Mesafe arttıkça zayıflama

    // Sonuç renginin hesaplanması: Ambient + Diffuse + Specular
    vec3 result = ambient + diffuse + specular;
    result *= attenuation;  // Mesafe zayıflamasını ekle

    // Çıktı rengini belirle
    FragColor = vec4(result, 1.0);
}