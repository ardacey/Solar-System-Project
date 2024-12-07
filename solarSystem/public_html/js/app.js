// WebGL değişkenleri
let gl;
let renderer;

// glMatrix kütüphanesi kısayolları
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

// Kamera matrisleri
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

// Güneş sistemi nesneleri
const sun = new Star(
    "Sun",
    1.989e30,    // kütle (kg)
    696340000,   // yarıçap (m)
    5778,        // yüzey sıcaklığı (K)
    3.828e26,    // aydınlatma gücü (W)
    0,           // hız (m/s)
    25.38 * 24 * 3600, // kendi etrafında dönme süresi (saniye)
    7.25,        // eksen eğikliği (derece)
    0,           // eğiklik değişkeni (derece)
    0            // yaw (derece)
);

const earth = new Planet(
    "Earth",
    5.972e24,    // kütle (kg)
    6371000,     // yarıçap (m)
    288,         // yüzey sıcaklığı (K)
    29780,       // yörünge hızı (m/s)
    24 * 3600,   // kendi etrafında dönme süresi (saniye)
    23.44,       // eksen eğikliği (derece)
    0,           // eğiklik değişkeni (derece)
    0,           // yaw (derece)
    365.256 * 24 * 3600  // yörünge periyodu (saniye)
);

// Simülasyon zamanı (saniye)
let simulationTime = 0;

// Kamera pozisyonu ve hedefi
const cameraPosition = vec3.fromValues(0, 5000000000, 5000000000);
const cameraTarget = vec3.fromValues(0, 0, 0);
const cameraUp = vec3.fromValues(0, 1, 0);

window.onload = async function init() {
    // Canvas ve WebGL bağlamını al
    const canvas = document.querySelector("#glCanvas");
    gl = canvas.getContext("webgl2");
    
    if (!gl) {
        alert("WebGL 2.0 desteklenmiyor!");
        return;
    }

    // Canvas boyutunu ayarla
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Renderer'ı başlat
    renderer = new Renderer(gl);
    await renderer.initialize();

    // Projeksiyon matrisini ayarla
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 1000000;
    const zFar = 10000000000;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Kamera matrisini ayarla
    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);

    // Animasyon döngüsünü başlat
    requestAnimationFrame(animate);
};

// Her frame'de çağrılacak güncelleme fonksiyonu
function update(deltaTime) {
    simulationTime += deltaTime;
    
    // Dünya'nın yörünge ve dönüş hareketlerini güncelle
    earth.updateOrbitalPosition(sun, simulationTime);
    earth.updateRotation(deltaTime);
    earth.updateSurfaceTemperature(sun);
    
    // Güneş'in kendi ekseni etrafında dönüşünü güncelle
    sun.updateRotation(deltaTime);
}

// Render fonksiyonu
function render() {
    renderer.clear();

    // Güneş'i çiz
    renderer.gl.uniform3f(renderer.uniforms.lightPosition, 0, 0, 0);
    renderer.gl.uniform3f(renderer.uniforms.color, 1.0, 0.6, 0.0);
    renderer.gl.uniform1f(renderer.uniforms.ambient, 0.8);
    renderer.drawCelestialBody(sun, viewMatrix, projectionMatrix);

    // Dünya'yı çiz
    renderer.gl.uniform3f(renderer.uniforms.color, 0.2, 0.5, 1.0);
    renderer.gl.uniform1f(renderer.uniforms.ambient, 0.2);
    renderer.drawCelestialBody(earth, viewMatrix, projectionMatrix);
}

// Animasyon döngüsü
let lastTime = 0;
function animate(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // saniyeye çevir
    lastTime = currentTime;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(animate);
}