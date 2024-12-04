#version 300 es
in vec4 vPosition;
in vec4 vColor; 

out vec4 fColor;

void
main()
{
    gl_Position = vPosition;
    fColor = vColor; 
}