// Temel gök cismi sınıfı
class CelestialBody {
    constructor(name, mass, radius, surfaceTemperature, angularVelocity, rotationPeriod, 
                obliquity, argumentOfObliquity, yaw, position) {
        this.name = name;
        this.mass = mass;
        this.radius = radius;
        this.surfaceTemperature = surfaceTemperature;
        this.angularVelocity = angularVelocity;
        this.rotationPeriod = rotationPeriod;
        this.obliquity = obliquity;
        this.argumentOfObliquity = argumentOfObliquity;
        this.yaw = yaw;
        this.position = position;

        this.rotation = { x: 0, y: 0, z: 0 };
    }

    // Konumu güncelle
    updatePosition(newPosition) {
        this.position = newPosition;
    }

    // Dönüşü güncelle
    updateRotation(deltaTime) {
        const rotationAngle = CelestialMechanics.calculateRotationAngle(this.rotationPeriod, deltaTime);
        this.rotation.y += rotationAngle;
    }
}

// Yıldız sınıfı
class Star extends CelestialBody {
    constructor(name, mass, radius, surfaceTemperature, angularVelocity,
                rotationPeriod, obliquity, argumentOfObliquity, yaw, position, luminosity) {
        super(name, mass, radius, surfaceTemperature, angularVelocity, rotationPeriod, 
              obliquity, argumentOfObliquity, yaw, position);
        this.luminosity = luminosity;
    }

    // Belirli bir mesafedeki ışık yoğunluğunu hesapla
    getLightIntensityAtDistance(distance) {
        return CelestialMechanics.calculateLightIntensity(this, distance);
    }
}

// Gezegen sınıfı
class Planet extends CelestialBody {
    constructor(name, mass, radius, surfaceTemperature, angularVelocity, rotationPeriod, 
                obliquity, argumentOfObliquity, yaw, position, orbitalPeriod, orbitalDistance, angle) {
        super(name, mass, radius, surfaceTemperature, angularVelocity, rotationPeriod, 
              obliquity, argumentOfObliquity, yaw, position);
        this.orbitalPeriod = orbitalPeriod;
        this.orbitalDistance = orbitalDistance;
        this.angle = angle;
    }

    // Yörünge konumunu güncelle
    updateOrbitalPosition(time) {
        const newPosition = CelestialMechanics.calculateOrbitalPosition(this, time);
        this.updatePosition(newPosition);
    }

    // Yüzey sıcaklığını güncelle
    updateSurfaceTemperature(star) {
        const distance = Math.sqrt(
            Math.pow(this.position.x - star.position.x, 2) +
            Math.pow(this.position.y - star.position.y, 2) +
            Math.pow(this.position.z - star.position.z, 2)
        );
        this.surfaceTemperature = CelestialMechanics.calculateSurfaceTemperature(star, this, distance);
    }
}
