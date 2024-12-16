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
    0            // phi (derece)
);

const earth = new Planet(
    "Earth",
    5.972e24,    // kütle (kg)
    6371000,     // yarıçap (m)
    288,         // yüzey sıcaklığı (K)
    {        // vektörel hız
        x: 29.78e3, // km/s
        y: 0,
        z: 0
    },
    24 * 3600,   // kendi etrafında dönme süresi (saniye)
    23.44,       // eksen eğikliği (derece)
    0,           // eğiklik değişkeni (derece)
    0,           // phi (derece)
    365.256 * 24 * 3600  // yörünge periyodu (saniye)
);

// Simülasyon zamanı (saniye)
let simulationTime = 0;
let timeMultiplier = 1;

// Kamera pozisyonu ve hedefi
const cameraPosition = vec3.fromValues(0, 50, 250);
const cameraTarget = vec3.fromValues(0, 0, 0);
const cameraUp = vec3.fromValues(0, 1, 0);
let currentPlanet = sun;

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let phi = 0;
let theta = 0;

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
        currentPlanet = sun;
    });
    
    document.getElementById("centerEarth").addEventListener("click", function() {
        currentPlanet = earth;
    }); 
    
    const timeSlider = document.getElementById("timeSlider");
    const timeSpeedLabel = document.getElementById("timeSpeedLabel");

    timeSlider.addEventListener("input", function () {
        timeMultiplier = parseFloat(timeSlider.value);
        timeSpeedLabel.textContent = `${timeMultiplier.toFixed(1)}x`;
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

    phi += deltaX * 0.1;
    theta -= deltaY * 0.1;

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
    simulationTime += deltaTime * timeMultiplier;

    centerCameraOn(currentPlanet);

    const radius = vec3.length(cameraPosition);
    cameraPosition[0] = radius * Math.cos(degreesToRadians(theta)) * Math.sin(degreesToRadians(phi));
    cameraPosition[1] = radius * Math.sin(degreesToRadians(theta));
    cameraPosition[2] = radius * Math.cos(degreesToRadians(theta)) * Math.cos(degreesToRadians(phi));

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
    
    // Dünya'nın yörünge ve dönüş hareketlerini güncelle
    earth.updateOrbitalPosition(sun, simulationTime);
    earth.updateRotation(deltaTime * timeMultiplier);
    earth.updateSurfaceTemperature(sun);

    // Güneş'in kendi ekseni etrafında dönüşünü güncelle
    sun.updateRotation(deltaTime * timeMultiplier);

    updateInfoBox(currentPlanet);
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

function updateInfoBox(planet) {
    const infoContent = document.getElementById("infoContent");

    const name = planet.name;
    const mass = planet.mass || 0;
    const radius = planet.radius || 0;
    const temperature = planet.surfaceTemperature || 0;
    const velocity = planet.velocity || 0;
    const rotationPeriod = planet.rotationPeriod || 0;
    const obliquity = planet.obliquity || 0;
    const argumentOfObliquity = planet.argumentOfObliquity || 0;
    const yaw = planet.yaw || 0;
    const orbitalPeriod = planet.orbitalPeriod || 0;
    const luminosity = planet.luminosity || 0;
    const position = planet.position || { x: 0, y: 0, z: 0 };

    infoContent.innerHTML = `
        <strong>Name:</strong> ${name} <br>
        <strong>Mass:</strong> ${mass.toExponential(2)} kg <br>
        <strong>Radius:</strong> ${radius.toFixed(2)} m <br>
        <strong>Temperature:</strong> ${temperature.toFixed(2)} K <br>
        <strong>Velocity:</strong> (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}) m/s <br>
        <strong>Rotation Period:</strong> ${rotationPeriod.toFixed(2)} s <br>
        <strong>Obliquity:</strong> ${obliquity.toFixed(2)}° <br>
        <strong>Argument of Obliquity:</strong> ${argumentOfObliquity.toFixed(2)}° <br>
        <strong>Yaw:</strong> ${yaw.toFixed(2)}° <br>
        <strong>Orbital Period:</strong> ${orbitalPeriod.toFixed(2)} s <br>
        <strong>Luminosity:</strong> ${luminosity.toExponential(2)} W <br>
        <strong>Position:</strong> (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) <br>
    `;
}