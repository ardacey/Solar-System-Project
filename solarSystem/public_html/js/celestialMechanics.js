// Gök cisimlerinin mekanik hesaplamaları için yardımcı fonksiyonlar
class CelestialMechanics {
    // Kütle çekim sabiti (m³/kg/s²)
    static G = 6.67430e-11;

    // İki cisim arasındaki kütle çekim kuvvetini hesapla
    static calculateGravitationalForce(mass1, mass2, distance) {
        return (this.G * mass1 * mass2) / (distance * distance);
    }

    // Dairesel yörünge hızını hesapla
    static calculateOrbitalVelocity(centralMass, distance) {
        return Math.sqrt((this.G * centralMass) / distance);
    }

    // Kepler'in üçüncü yasasına göre yörünge periyodunu hesapla
    static calculateOrbitalPeriod(centralMass, semiMajorAxis) {
        return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (this.G * centralMass));
    }

    // Gök cisminin yeni konumunu hesapla
    static updatePosition(currentPosition, velocity, deltaTime) {
        return {
            x: currentPosition.x + velocity.x * deltaTime,
            y: currentPosition.y + velocity.y * deltaTime,
            z: currentPosition.z + velocity.z * deltaTime
        };
    }

    // Dönme açısını hesapla
    static calculateRotationAngle(rotationPeriod, deltaTime) {
        return (2 * Math.PI * deltaTime) / rotationPeriod;
    }

    // Eksen eğikliğini dikkate alarak dönme matrisini hesapla
    static calculateRotationMatrix(obliquity, argumentOfObliquity, yaw) {
        // Bu fonksiyon, WebGL ile kullanılmak üzere 4x4 dönüşüm matrisi döndürür
        const obliquityRad = obliquity * Math.PI / 180;
        const argOfObliquityRad = argumentOfObliquity * Math.PI / 180;
        const yawRad = yaw * Math.PI / 180;

        // glMatrix kütüphanesini kullanarak dönüşüm matrisini oluştur
        let rotationMatrix = mat4.create();
        mat4.rotateZ(rotationMatrix, rotationMatrix, yawRad);
        mat4.rotateX(rotationMatrix, rotationMatrix, obliquityRad);
        mat4.rotateZ(rotationMatrix, rotationMatrix, argOfObliquityRad);
        
        return rotationMatrix;
    }

    // Gezegen için yörünge konumunu hesapla
    static calculateOrbitalPosition(planet, centralStar, time) {
        // Basit dairesel yörünge için hesaplama
        const distance = Math.sqrt(
            Math.pow(planet.velocity, 2) * planet.orbitalPeriod / (2 * Math.PI)
        );
        
        const angularPosition = (2 * Math.PI * time) / planet.orbitalPeriod;
        
        return {
            x: distance * Math.cos(angularPosition),
            y: 0, // Basitleştirme için düzlemsel yörünge varsayıyoruz
            z: distance * Math.sin(angularPosition)
        };
    }

    // Işık yoğunluğunu mesafeye göre hesapla
    static calculateLightIntensity(star, distance) {
        // Ters kare yasasına göre ışık yoğunluğu
        return star.luminosity / (4 * Math.PI * distance * distance);
    }

    // Yüzey sıcaklığını hesapla (basitleştirilmiş model)
    static calculateSurfaceTemperature(star, planet, distance) {
        // Stefan-Boltzmann yasasına göre basitleştirilmiş hesaplama
        const albedo = 0.3; // Gezegenin ortalama albedosu
        const stefanBoltzmann = 5.67e-8; // Stefan-Boltzmann sabiti
        
        const absorptionRate = (1 - albedo) * Math.PI * Math.pow(planet.radius, 2);
        const incidentPower = this.calculateLightIntensity(star, distance) * absorptionRate;
        
        return Math.pow(incidentPower / (4 * Math.PI * Math.pow(planet.radius, 2) * stefanBoltzmann), 0.25);
    }
}
