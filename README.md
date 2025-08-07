# Solar System WebGL Simulation

An interactive 3D solar system simulation built with WebGL 2.0, featuring realistic celestial body physics, orbital mechanics, and controllable spacecraft navigation.

## Features

### 🌌 Realistic Solar System Simulation
- **All Planets**: Complete solar system with Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto
- **Physics Engine**: Real gravitational forces and orbital mechanics using Newton's laws
- **Realistic Scaling**: Distance and size scaling for visual accuracy
- **Orbital Motion**: Planets follow realistic elliptical orbits with proper velocities

### 🚀 Interactive Elements
- **Spacecraft Control**: Pilot a spaceship through the solar system
- **Character Models**: Multiple astronaut characters (Arda, Ismail, Yigitalp, Zafer)
- **Asteroid Field**: Dynamic asteroid spawning and collision detection
- **Score System**: Points-based gameplay mechanics

### 🎮 Advanced Controls
- **Multiple Control Modes**: Switch between observation and piloting modes
- **Camera System**: Free-roaming camera with multiple view options
- **Target Selection**: Focus on any celestial body or spacecraft
- **Manual Override**: Direct control over selected objects

### 🎨 Visual Excellence
- **High-Quality 3D Models**: Detailed OBJ models for all celestial bodies
- **Custom Shaders**: Specialized GLSL shaders for different object types
- **Texture Mapping**: Realistic planetary textures and materials
- **Orbital Visualization**: Visible orbital paths and trajectories
- **Skybox**: Immersive space environment background

## Technology Stack

- **WebGL 2.0** - 3D graphics rendering
- **JavaScript ES6+** - Core application logic
- **GLSL** - Custom vertex and fragment shaders
- **gl-matrix.js** - Matrix and vector mathematics
- **TWGL.js** - WebGL utilities and helpers
- **Cannon.js** - Physics engine for collision detection
- **OBJ Loader** - 3D model loading and parsing

## Project Structure

```
solarSystem/
├── public_html/
│   ├── index.html          # Main application entry point
│   ├── server.py           # Local development server
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   ├── Camera.js       # Camera control system
│   │   ├── PhysicsSimulation.js # Physics and orbital mechanics
│   │   ├── BodyScripts.js  # Celestial body behaviors
│   │   ├── BodyProperties.js # Planetary data and properties
│   │   ├── Shader.js       # Shader management
│   │   └── libs/           # External libraries
│   ├── glsl/               # GLSL shader files
│   ├── Models/             # 3D models and textures
│   └── textures/           # Planetary texture assets
├── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Modern web browser with WebGL 2.0 support
- Python 3.x (for local server)

### Installation & Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd solarSystem
   ```

2. **Start the local server**
   ```bash
   cd public_html
   python server.py
   ```

3. **Open in browser**
   Navigate to `http://localhost:8080`

### Controls

#### Basic Navigation
- **H** - Toggle help menu
- **Mouse Wheel** - Zoom in/out
- **Left Mouse Drag** - Rotate camera
- **Right Mouse Drag** - Move camera
- **Escape** - Exit control mode

#### Advanced Controls
- **P** - Activate pointer lock for precise control
- **K** - View hall of fame
- **M** - Toggle manual movement mode
- **Buttons** - Focus camera on specific celestial bodies

#### Spacecraft Control (when spacecraft is selected)
- **W** - Move forward
- **A** - Move left  
- **S** - Move backward
- **D** - Move right

## Physics Engine

The simulation implements realistic orbital mechanics:

- **Gravitational Forces**: All objects exert gravitational attraction on each other
- **Orbital Velocities**: Initial velocities calculated for stable orbits
- **Central Body Mechanics**: Sun acts as the primary gravitational anchor
- **Multi-body Simulation**: Complex gravitational interactions between all objects
- **Collision Detection**: Asteroid and spacecraft collision systems

## Development Features

### Extensibility
- Modular architecture for easy feature addition
- Configurable celestial body properties
- Plugin-ready shader system
- Scalable physics simulation

### Performance Optimizations
- Efficient WebGL buffer management
- Frustum culling for off-screen objects
- Level-of-detail (LOD) rendering
- Optimized matrix calculations

## Contributing

This project welcomes contributions! Areas for enhancement:
- Additional celestial bodies (moons, comets)
- Enhanced physics accuracy
- Advanced lighting systems
- Particle effects
- Sound integration
- VR/AR support

## Technical Requirements

- **WebGL 2.0** compatible browser
- **Hardware**: Dedicated graphics card recommended for optimal performance
- **RAM**: 4GB+ recommended for complex simulations
- **Resolution**: 1024x768 minimum, 1920x1080+ recommended

## License

This project is available for educational and personal use. See individual model and texture licensing for commercial usage restrictions.

## Credits

- **Physics**: Custom implementation based on Newton's laws of gravitation
- **3D Models**: Various sources (see individual model credits in `/Models/`)
- **Textures**: NASA and other space agencies' public domain resources
- **Development Team**: kar_y and contributors

---

*Explore the cosmos from your browser! 🌌✨*
