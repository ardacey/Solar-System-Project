#version 300 es
    //dummy
    in vec3 aPos;
    in vec3 aNormal;
    in vec2 aTextCoord;

    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;

  // Uniform değişkenler
  uniform float time;

  // Varying değişkenler
  in vec4 a_position; // Vertex pozisyonu
  out vec3 vTexCoord3D; // Fragment shader'a gönderilecek 3D koordinatlar

  void main(void) {
    // Koordinatları ve zaman etkisini uygula
    vTexCoord3D = (aPos.xyz + vec3(time, time, time));

    // Pozisyonu hesapla ve ekrana yerleştir
    gl_Position = projection * view *model* vec4(aPos, 1.0);
  }

