// Toggle Controls Panel
document.querySelector('.toggle-controls').addEventListener('click', function() {
    this.classList.toggle('closed');
    document.querySelector('.controls').classList.toggle('hidden');
});

// Boid style selection
let currentBoidStyle = 'arrow';
document.querySelectorAll('.boid-style-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all options
        document.querySelectorAll('.boid-style-option').forEach(opt => {
            opt.classList.remove('active');
        });
        // Add active class to clicked option
        this.classList.add('active');
        // Update current boid style
        currentBoidStyle = this.getAttribute('data-style');
    });
});

// Canvas and context setup
const canvas = document.getElementById('boids-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Controls
let numBoids = parseInt(document.getElementById('num-boids').value);
let separationForce = parseFloat(document.getElementById('separation').value);
let alignmentForce = parseFloat(document.getElementById('alignment').value);
let cohesionForce = parseFloat(document.getElementById('cohesion').value);
let visionRadius = parseInt(document.getElementById('vision-radius').value);
let maxSpeed = parseFloat(document.getElementById('max-speed').value);
let isPaused = false;

// FPS calculation
let fps = 0;
let lastTime = performance.now();
let frameCount = 0;

// Update UI display values
function updateDisplayValues() {
    document.getElementById('num-boids-value').textContent = numBoids;
    document.getElementById('separation-value').textContent = separationForce.toFixed(1);
    document.getElementById('alignment-value').textContent = alignmentForce.toFixed(1);
    document.getElementById('cohesion-value').textContent = cohesionForce.toFixed(1);
    document.getElementById('vision-radius-value').textContent = visionRadius;
    document.getElementById('max-speed-value').textContent = maxSpeed.toFixed(1);
}

// Event listeners for controls
document.getElementById('num-boids').addEventListener('input', function() {
    numBoids = parseInt(this.value);
    updateDisplayValues();
    initBoids();
});

document.getElementById('separation').addEventListener('input', function() {
    separationForce = parseFloat(this.value);
    updateDisplayValues();
});

document.getElementById('alignment').addEventListener('input', function() {
    alignmentForce = parseFloat(this.value);
    updateDisplayValues();
});

document.getElementById('cohesion').addEventListener('input', function() {
    cohesionForce = parseFloat(this.value);
    updateDisplayValues();
});

document.getElementById('vision-radius').addEventListener('input', function() {
    visionRadius = parseInt(this.value);
    updateDisplayValues();
});

document.getElementById('max-speed').addEventListener('input', function() {
    maxSpeed = parseFloat(this.value);
    updateDisplayValues();
});

document.getElementById('reset-btn').addEventListener('click', function() {
    initBoids();
});

document.getElementById('pause-btn').addEventListener('click', function() {
    isPaused = !isPaused;
    this.textContent = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('predator-btn').addEventListener('click', function() {
    addPredator();
});

// Function to draw different boid styles
function drawBoid(x, y, angle, speed, isLeader = false, isPredator = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Scale based on speed for dynamic sizing
    const baseSize = isPredator ? 12 : 8;
    const size = baseSize * (0.8 + 0.4 * (speed / maxSpeed));

    if (isPredator) {
        // Predator style (always looks like a larger, red shark)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(size * 1.5, 0);
        ctx.lineTo(-size, size);
        ctx.lineTo(-size / 2, 0);
        ctx.lineTo(-size, -size);
        ctx.closePath();
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 10;
        ctx.fill();
    } else {
        // Choose boid style based on selection
        switch(currentBoidStyle) {
            case 'arrow':
                // Enhanced arrow style with glowing edge
                const gradient = ctx.createLinearGradient(-size, 0, size, 0);
                gradient.addColorStop(0, '#8a7dfd');
                gradient.addColorStop(1, '#6a5acd');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.lineTo(-size/2, size/2);
                ctx.lineTo(-size/4, 0);
                ctx.lineTo(-size/2, -size/2);
                ctx.closePath();
                ctx.fill();

                // Add subtle glow
                ctx.shadowColor = '#a5b4fc';
                ctx.shadowBlur = 5;
                ctx.fill();
                break;

            case 'triangle':
                // Simple triangle with color based on speed
                const hue = 240 + 60 * (speed / maxSpeed);
                ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.lineTo(-size, size/2);
                ctx.lineTo(-size, -size/2);
                ctx.closePath();
                ctx.fill();

                // Add shine to leading edge
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(size, 0);
                ctx.lineTo(-size, -size/2);
                ctx.stroke();
                break;

            case 'comet':
                // Comet with trail
                const trailGradient = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2);
                trailGradient.addColorStop(0, 'rgba(142, 165, 255, 0.9)');
                trailGradient.addColorStop(0.5, 'rgba(106, 90, 205, 0.5)');
                trailGradient.addColorStop(1, 'rgba(106, 90, 205, 0)');

                // Draw trail
                ctx.fillStyle = trailGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-size * 2, size/2);
                ctx.lineTo(-size * 3, 0);
                ctx.lineTo(-size * 2, -size/2);
                ctx.closePath();
                ctx.fill();

                // Draw main body
                ctx.fillStyle = '#a5b4fc';
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'bird':
                // Bird-like shape
                ctx.fillStyle = '#7a6dee';

                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, size, size/2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Wings
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-size, -size * 1.5, -size/2, 0);
                ctx.quadraticCurveTo(-size, size * 1.5, 0, 0);
                ctx.fillStyle = '#a5b4fc';
                ctx.fill();

                // Head
                ctx.fillStyle = '#6a5acd';
                ctx.beginPath();
                ctx.arc(size/2, 0, size/3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // If this is a leader boid, add a special indicator
    if (isLeader) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// Boid class
class Boid {
    constructor(x, y) {
        this.position = { x: x || Math.random() * canvas.width, y: y || Math.random() * canvas.height };
        this.velocity = {
            x: (Math.random() * 2 - 1) * 2,
            y: (Math.random() * 2 - 1) * 2
        };
        this.acceleration = { x: 0, y: 0 };
        this.size = 5;
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        this.isPredator = false;
    }

    edges() {
        // Wrap around the edges of the canvas
        if (this.position.x > canvas.width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.y > canvas.height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = canvas.height;
    }

    align(boids) {
        let steering = { x: 0, y: 0 };
        let total = 0;

        for (let other of boids) {
            if (other !== this) {
                const d = distance(this.position, other.position);
                if (d < visionRadius && !other.isPredator) {
                    steering.x += other.velocity.x;
                    steering.y += other.velocity.y;
                    total++;
                }
            }
        }

        if (total > 0) {
            steering.x /= total;
            steering.y /= total;

            // Set magnitude to maxSpeed
            const mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            steering.x = (steering.x / mag) * maxSpeed;
            steering.y = (steering.y / mag) * maxSpeed;

            // Steering = desired - velocity
            steering.x -= this.velocity.x;
            steering.y -= this.velocity.y;

            // Limit steering force
            const steerMag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (steerMag > 0.5) {
                steering.x = (steering.x / steerMag) * 0.5;
                steering.y = (steering.y / steerMag) * 0.5;
            }
        }

        return steering;
    }

    cohesion(boids) {
        let steering = { x: 0, y: 0 };
        let total = 0;

        for (let other of boids) {
            if (other !== this) {
                const d = distance(this.position, other.position);
                if (d < visionRadius && !other.isPredator) {
                    steering.x += other.position.x;
                    steering.y += other.position.y;
                    total++;
                }
            }
        }

        if (total > 0) {
            steering.x /= total;
            steering.y /= total;

            // Vector from current position to target
            steering.x -= this.position.x;
            steering.y -= this.position.y;

            // Set magnitude to maxSpeed
            const mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (mag > 0) {
                steering.x = (steering.x / mag) * maxSpeed;
                steering.y = (steering.y / mag) * maxSpeed;
            }

            // Steering = desired - velocity
            steering.x -= this.velocity.x;
            steering.y -= this.velocity.y;

            // Limit steering force
            const steerMag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (steerMag > 0.5) {
                steering.x = (steering.x / steerMag) * 0.5;
                steering.y = (steering.y / steerMag) * 0.5;
            }
        }

        return steering;
    }

    separation(boids) {
        let steering = { x: 0, y: 0 };
        let total = 0;

        for (let other of boids) {
            if (other !== this) {
                const d = distance(this.position, other.position);
                if (d < visionRadius * 0.5) {
                    // Vector away from neighbor
                    let diff = {
                        x: this.position.x - other.position.x,
                        y: this.position.y - other.position.y
                    };

                    // Weight by distance (closer = stronger force)
                    if (d > 0) {
                        diff.x /= d;
                        diff.y /= d;
                    }

                    // Extra force to avoid predators
                    if (other.isPredator && d < visionRadius) {
                        diff.x *= 5;
                        diff.y *= 5;
                    }

                    steering.x += diff.x;
                    steering.y += diff.y;
                    total++;
                }
            }
        }

        if (total > 0) {
            steering.x /= total;
            steering.y /= total;

            // Set magnitude to maxSpeed
            const mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (mag > 0) {
                steering.x = (steering.x / mag) * maxSpeed;
                steering.y = (steering.y / mag) * maxSpeed;
            }

            // Steering = desired - velocity
            steering.x -= this.velocity.x;
            steering.y -= this.velocity.y;

            // Limit steering force
            const steerMag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (steerMag > 0.5) {
                steering.x = (steering.x / steerMag) * 0.5;
                steering.y = (steering.y / steerMag) * 0.5;
            }
        }

        return steering;
    }

    predatorBehavior(boids) {
        if (!this.isPredator) return { x: 0, y: 0 };

        let closest = null;
        let closestDist = Infinity;

        // Find the closest boid
        for (let other of boids) {
            if (!other.isPredator) {
                const d = distance(this.position, other.position);
                if (d < visionRadius * 2 && d < closestDist) {
                    closest = other;
                    closestDist = d;
                }
            }
        }

        let steering = { x: 0, y: 0 };

        if (closest) {
            // Move toward closest boid
            steering.x = closest.position.x - this.position.x;
            steering.y = closest.position.y - this.position.y;

            // Normalize and scale by max speed (predators are faster)
            const mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
            if (mag > 0) {
                steering.x = (steering.x / mag) * (maxSpeed * 1.5);
                steering.y = (steering.y / mag) * (maxSpeed * 1.5);
            }

            // Steering = desired - velocity
            steering.x -= this.velocity.x;
            steering.y -= this.velocity.y;
        }

        return steering;
    }

    flock(boids) {
        if (this.isPredator) {
            const predatorSteering = this.predatorBehavior(boids);
            this.acceleration.x += predatorSteering.x;
            this.acceleration.y += predatorSteering.y;
            return;
        }

        const alignment = this.align(boids);
        const cohesion = this.cohesion(boids);
        const separation = this.separation(boids);

        // Apply weights
        alignment.x *= alignmentForce;
        alignment.y *= alignmentForce;

        cohesion.x *= cohesionForce;
        cohesion.y *= cohesionForce;

        separation.x *= separationForce;
        separation.y *= separationForce;

        // Add forces to acceleration
        this.acceleration.x += alignment.x + cohesion.x + separation.x;
        this.acceleration.y += alignment.y + cohesion.y + separation.y;
    }

    update() {
        // Update velocity with acceleration
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        // Limit velocity to max speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const actualMaxSpeed = this.isPredator ? maxSpeed * 1.5 : maxSpeed;

        if (speed > actualMaxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * actualMaxSpeed;
            this.velocity.y = (this.velocity.y / speed) * actualMaxSpeed;
        }

        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Reset acceleration
        this.acceleration.x = 0;
        this.acceleration.y = 0;

        // Check edges
        this.edges();
    }

    draw() {
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        const speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
        drawBoid(this.position.x, this.position.y, angle, speed, false, this.isPredator);
    }
}

// Helper function to calculate distance
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Initialize boids
let boids = [];

function initBoids() {
    boids = [];
    for (let i = 0; i < numBoids; i++) {
        boids.push(new Boid());
    }
}

function addPredator() {
    const predator = new Boid(canvas.width / 2, canvas.height / 2);
    predator.isPredator = true;
    predator.size = 8; // Bigger size
    boids.push(predator);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Calculate FPS
    const now = performance.now();
    frameCount++;

    if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        document.getElementById('fps').textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastTime = now;
    }

    if (!isPaused) {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw boids
        for (let boid of boids) {
            boid.flock(boids);
        }

        for (let boid of boids) {
            boid.update();
            boid.draw();
        }
    }
}

// Initialize and start animation
initBoids();
updateDisplayValues();
animate();