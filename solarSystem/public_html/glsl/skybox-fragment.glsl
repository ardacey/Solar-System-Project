#version 300 es
precision highp float;

in vec3 vTexCoord;
uniform sampler2D uSkybox;
out vec4 fragColor;

void main() {
    // Normalize the direction vector
    vec3 dir = normalize(vTexCoord);
    
    // Convert to spherical coordinates with higher precision
    float phi = atan(dir.z, dir.x);
    float theta = asin(clamp(dir.y, -1.0, 1.0));
    
    // Convert to UV coordinates with better precision
    vec2 uv = vec2(
        0.5 + (phi / (2.0 * 3.141592653589793)),
        0.5 + (theta / 3.141592653589793)
    );
    
    // Apply a slight contrast enhancement
    vec4 texColor = texture(uSkybox, uv);
    float contrast = 1.2;  // Contrast adjustment factor
    vec3 enhancedColor = (texColor.rgb - 0.5) * contrast + 0.5;
    
    fragColor = vec4(enhancedColor, texColor.a);
}
