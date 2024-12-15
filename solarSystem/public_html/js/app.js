// WebGL değişkenleri
let gl;
let renderer;

// glMatrix kütüphanesi kısayolları
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

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
const cameraPosition = vec3.fromValues(0, 50, 250);
const cameraTarget = vec3.fromValues(0, 0, 0);
const cameraUp = vec3.fromValues(0, 1, 0);

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;
let pitch = 0;

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
    const zNear = 1;
    const zFar = 1000;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Kamera matrisini ayarla
    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onMouseWheel);

    document.getElementById("centerSun").addEventListener("click", function() {
        centerCameraOn(sun);
    });
    
    document.getElementById("centerEarth").addEventListener("click", function() {
        centerCameraOn(earth);
    });    

    // Animasyon döngüsünü başlat
    requestAnimationFrame(animate);
};

function onMouseDown(event) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function onMouseUp(event) {
    isDragging = false;
}

function onMouseMove(event) {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    yaw += deltaX * 0.1;
    pitch -= deltaY * 0.1;

    pitch = Math.max(-90, Math.min(90, pitch));

    const radius = vec3.length(cameraPosition);
    cameraPosition[0] = radius * Math.cos(degreesToRadians(pitch)) * Math.sin(degreesToRadians(yaw));
    cameraPosition[1] = radius * Math.sin(degreesToRadians(pitch));
    cameraPosition[2] = radius * Math.cos(degreesToRadians(pitch)) * Math.cos(degreesToRadians(yaw));

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function onMouseWheel(event) {
    cameraPosition[2] += event.deltaY;
    cameraPosition[2] = Math.min(Math.max(cameraPosition[2], 50), 500);
}

function centerCameraOn(body) {
    cameraTarget[0] = body.position.x;
    cameraTarget[1] = body.position.y;
    cameraTarget[2] = body.position.z;

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
}

// Her frame'de çağrılacak güncelleme fonksiyonu
function update(deltaTime) {
    simulationTime += deltaTime;

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
    
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
    
    // Işık pozisyonunu güneşin merkezine ayarla
    renderer.setLightPosition(sun.position.x, sun.position.y, sun.position.z);
    
    // Güneşi çiz
    renderer.setColor(1.0, 0.7, 0.0); // Sarı renk
    renderer.setAmbient(0.8);
    renderer.drawCelestialBody(sun, viewMatrix, projectionMatrix);
    
    // Dünyayı çiz
    renderer.setColor(0.2, 0.5, 1.0); // Mavi renk
    renderer.setAmbient(0.1);
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
