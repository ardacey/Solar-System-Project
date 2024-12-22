#version 300 es
precision highp float;
in vec3 Normal;
in vec3 FragPos;

out vec4 FragColor;

uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;


void main()
{
    float ambientStrength = 0.7;
    vec3 ambient = ambientStrength * lightColor;


    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos-FragPos);

    float diff = max(dot(norm,lightDir),0.0);

    vec3 diffuse = diff * lightColor;

    vec3 result = (ambient + diffuse) * objectColor;

    FragColor = vec4(result,1.0);
}