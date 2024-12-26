#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv; 

uniform vec3 uLightPosition;
uniform vec3 uColor;
uniform float uAmbient;
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    // Phong shading
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uColor;
    vec3 ambient = uAmbient * uColor;

    // Doku (texture) rengi alınıyor
    vec4 textureColor = texture(uTexture, vUv);  // Doku koordinatlarını kullanarak texture renk bilgisi alınıyor
    
    // Dokuyu final renge dahil etme
    vec3 finalColor = (ambient + diffuse) * textureColor.rgb;  // Dokuyu renk ile çarpıyoruz
    
    fragColor = vec4(finalColor, 1.0);  // Renk ve alpha
}