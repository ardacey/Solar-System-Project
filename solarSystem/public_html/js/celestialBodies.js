// Temel gök cismi sınıfı
class CelestialBody {
    constructor(name, mass, radius, surfaceTemperature, velocity, rotationPeriod, 
                obliquity, argumentOfObliquity, yaw) {
        this.name = name;
        this.mass = mass;
        this.radius = radius;
        this.surfaceTemperature = surfaceTemperature;
        this.velocity = {
            x: velocity.x || 0,
            y: velocity.y || 0,
            z: velocity.z || 0
        };
        this.rotationPeriod = rotationPeriod;
        this.obliquity = obliquity;
        this.argumentOfObliquity = argumentOfObliquity;
        this.yaw = yaw;
        
        // Konum ve dönüş bilgilerini tut
        this.position = { x: 0, y: 0, z: 0 };
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
    constructor(name, mass, radius, surfaceTemperature, luminosity, velocity, 
                rotationPeriod, obliquity, argumentOfObliquity, yaw) {
        super(name, mass, radius, surfaceTemperature, velocity, rotationPeriod, 
              obliquity, argumentOfObliquity, yaw);
        this.luminosity = luminosity;
    }

    // Belirli bir mesafedeki ışık yoğunluğunu hesapla
    getLightIntensityAtDistance(distance) {
        return CelestialMechanics.calculateLightIntensity(this, distance);
    }
}

// Gezegen sınıfı
class Planet extends CelestialBody {
    constructor(name, mass, radius, surfaceTemperature, velocity, rotationPeriod, 
                obliquity, argumentOfObliquity, yaw, orbitalPeriod) {
        super(name, mass, radius, surfaceTemperature, velocity, rotationPeriod, 
              obliquity, argumentOfObliquity, yaw);
        this.orbitalPeriod = orbitalPeriod;
    }

    // Yörünge konumunu güncelle
    updateOrbitalPosition(centralStar, time) {
        const newPosition = CelestialMechanics.calculateOrbitalPosition(this, centralStar, time);
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
