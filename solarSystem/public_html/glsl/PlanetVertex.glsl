#version 300 es
in vec3 aPos;
in vec3 aNormal;
in vec2 aTextCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;
out vec3 WorldPos;

void main() {
    WorldPos = vec3(model * vec4(aPos, 1.0));
    FragPos = vec3(model * vec4(aPos, 1.0));
    // Better normal transformation
    Normal = normalize(mat3(transpose(inverse(model))) * aNormal);
    TexCoords = vec2(aTextCoord.x, 1.0 - aTextCoord.y);

    gl_Position = projection * view * model * vec4(aPos, 1.0);
}