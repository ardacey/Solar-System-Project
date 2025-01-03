// WebGL değişkenleri
let gl;
let renderer;
let sunTexture;
let earthTexture;
let skyboxTexture;


// Kamera matrisleri
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

// Güneş sistemi nesneleri
const sun = new Star(
    "Sun",
    1.989e30,    // kütle (kg)
    696340000,   // yarıçap (m)
    5778,        // yüzey sıcaklığı (K)
    0,           // açısal hız (rad/s)
    25.38 * 24 * 3600, // kendi etrafında dönme süresi (saniye)
    7.25,        // eksen eğikliği (derece)
    0,           // eğiklik değişkeni (derece)
    0,           // phi (derece)
    { x: 0, y: 0, z: 0 }, // konum
    3.828e26,    // aydınlatma gücü (W)
);

const earth = new Planet(
    "Earth",
    5.972e24,    // kütle (kg)
    6371000,     // yarıçap (m)
    288,         // yüzey sıcaklığı (K)
    7.2921159e-5,// açısal hız (rad/s)
    24 * 3600,   // kendi etrafında dönme süresi (saniye)
    23.44,       // eksen eğikliği (derece)
    0,           // eğiklik değişkeni (derece)
    0,           // phi (derece)
    { x: 149.6e8, y: 0, z: 0 }, // konum
    365.256 * 24 * 3600,  // yörünge periyodu (saniye)
    149.6e9,      // yörünge mesafesi (m)
    0,            // açı (derece)
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
    
    // Texture'ları yükle
    sunTexture = renderer.loadTexture("textures/8k/8k_sun.jpg");
    earthTexture = renderer.loadTexture("textures/8k/8k_earth_daymap.jpg");
    skyboxTexture = renderer.loadTexture("textures/8k/8k_stars_milky_way.jpg");

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
    const zoomFactor = -event.deltaY * 0.1;
    const direction = vec3.create();

    vec3.subtract(direction, cameraTarget, cameraPosition);
    vec3.normalize(direction, direction);

    vec3.scaleAndAdd(cameraPosition, cameraPosition, direction, zoomFactor);

    const minDistance = 50;
    const maxDistance = 500;
    const currentDistance = vec3.distance(cameraPosition, cameraTarget);

    if (currentDistance < minDistance) {
        vec3.scaleAndAdd(cameraPosition, cameraTarget, direction, -minDistance);
    } else if (currentDistance > maxDistance) {
        vec3.scaleAndAdd(cameraPosition, cameraTarget, direction, maxDistance);
    }
}

function centerCameraOn(body) {
    cameraTarget[0] = body.position.x;
    cameraTarget[1] = body.position.y;
    cameraTarget[2] = body.position.z;

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
}

// Her frame'de çağrılacak güncelleme fonksiyonu
function update(deltaTime) {
    deltaTime = deltaTime * timeMultiplier;
    simulationTime += deltaTime;

    centerCameraOn(currentPlanet);

    const radius = vec3.length(cameraPosition);
    cameraPosition[0] = radius * Math.cos(degreesToRadians(theta)) * Math.sin(degreesToRadians(phi));
    cameraPosition[1] = radius * Math.sin(degreesToRadians(theta));
    cameraPosition[2] = radius * Math.cos(degreesToRadians(theta)) * Math.cos(degreesToRadians(phi));

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
    
    // Dünya'nın yörünge ve dönüş hareketlerini güncelle
    earth.updateOrbitalPosition(deltaTime);
    earth.updateRotation(deltaTime * timeMultiplier);
    earth.updateSurfaceTemperature(sun);

    // Güneş'in kendi ekseni etrafında dönüşünü güncelle
    sun.updateRotation(deltaTime * timeMultiplier);

    updateInfoBox(currentPlanet);
}

// Render fonksiyonu
function render() {
    renderer.clear();
    
    // Önce skybox'ı çiz
    renderer.drawSkybox(viewMatrix, projectionMatrix, skyboxTexture);
    
    // Işık pozisyonunu güneşin merkezine ayarla
    renderer.setLightPosition(0, 0, 0);
    
    // Güneşi çiz
    renderer.setColor(1.0, 1.0, 1.0);
    renderer.setAmbient(1.0);
    renderer.drawCelestialBody(sun, viewMatrix, projectionMatrix, sunTexture);
    
    // Dünyayı çiz
    renderer.setColor(1.0, 1.0, 1.0);
    renderer.setAmbient(0.4);
    renderer.drawCelestialBody(earth, viewMatrix, projectionMatrix, earthTexture);
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
    const position = planet.position || { x: 0, y: 0, z: 0 };
    const orbitalPeriod = planet.orbitalPeriod || 0;
    const orbitalDistance = planet.orbitalDistance || 0;
    const angle = planet.angle || 0;
    const luminosity = planet.luminosity || 0;

    infoContent.innerHTML = `
        <strong>Name:</strong> ${name} <br>
        <strong>Mass:</strong> ${mass.toExponential(2)} kg <br>
        <strong>Radius:</strong> ${radius.toFixed(2)} m <br>
        <strong>Temperature:</strong> ${temperature.toFixed(2)} K <br>
        <strong>Velocity:</strong> ${velocity.toFixed(2)} rad/s <br>
        <strong>Rotation Period:</strong> ${rotationPeriod.toFixed(2)} s <br>
        <strong>Obliquity:</strong> ${obliquity.toFixed(2)}° <br>
        <strong>Argument of Obliquity:</strong> ${argumentOfObliquity.toFixed(2)}° <br>
        <strong>Yaw:</strong> ${yaw.toFixed(2)}° <br>
        <strong>Position:</strong> (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) <br>
        <strong>Orbital Period:</strong> ${orbitalPeriod.toFixed(2)} s <br>
        <strong>Orbital Distance:</strong> ${orbitalDistance.toExponential(2)} m <br>
        <strong>Angle:</strong> ${angle.toFixed(2)}° <br>
        <strong>Luminosity:</strong> ${luminosity.toExponential(2)} W <br>

    `;
}