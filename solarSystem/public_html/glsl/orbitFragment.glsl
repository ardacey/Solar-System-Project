precision mediump float;

uniform vec3 orbitColor;

void main() {
    gl_FragColor = vec4(orbitColor, 1.0);
}