
function Particle(x, y, z, width, height, mass = 0.1){

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.previous = new THREE.Vector3(x * width, y * height, z);
    this.position = new THREE.Vector3(x * width, y * height, z);
    this.original = new THREE.Vector3(x * width, y * height, z);
    this.mass = mass;
    this.a = new THREE.Vector3(0, 0, 0);
    this.tmp = new THREE.Vector3();

    this.iniPosition = new THREE.Vector3();
    this.iniVelocity = new THREE.Vector3();

    this.a1 = new THREE.Vector3();
    this.v1 = new THREE.Vector3();

    this.a2 = new THREE.Vector3();
    this.v2 = new THREE.Vector3();

    this.a3 = new THREE.Vector3();
    this.v3 = new THREE.Vector3();

    this.a4 = new THREE.Vector3();
    this.v4 = new THREE.Vector3();

}

Particle.prototype.addForce = function(force) {
    this.tmp.copy(force);
    this.a.add(this.tmp.divideScalar(this.mass));
};

//Simple Euler Integration
//x(t + h) = x(t) + v * h
//? current v
Particle.prototype.integrateEuler = function(timestep){
    this.tmp.copy(this.velocity);
    this.position.add(this.tmp.multiplyScalar(timestep));
    this.velocity.add(this.a.multiplyScalar(timestep));
    this.a.set(0, 0, 0);
};

//Verlet Integration
Particle.prototype.integrateVerlet = function(timesq) {

    let newPos = this.tmp.subVectors(this.position, this.previous);
    newPos.multiplyScalar(DRAG).add(this.position);
    newPos.add(this.a.multiplyScalar(timesq));

    this.tmp = this.previous;
    this.previous = this.position;
    this.position = newPos;

    this.a.set( 0, 0, 0 );
};



Particle.prototype.rk = function(timeStep){
    let temp1 = this.a1.add(this.a2.multiplyScalar(2)).add(this.a3.multiplyScalar(2)).add(this.a4);
    let temp2 = this.v1.add(this.v2.multiplyScalar(2)).add(this.v3.multiplyScalar(2)).add(this.v4);
    this.velocity.add(temp1.multiplyScalar(timeStep / 6));
    this.position.add(temp2.multiplyScalar(timeStep / 6));
    this.a.set(0, 0, 0);
};

function integrateRK4(particles, springs, timeStep) {

    let i, particle;

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.iniVelocity.copy(particle.velocity);
        particle.iniPosition.copy(particle.position);
        particle.v1.copy(particle.velocity);
        particle.a1.copy(particle.a);
    }

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.position.add(particle.v1.multiplyScalar(timeStep / 2));
        particle.velocity.add(particle.a1.multiplyScalar(timeStep / 2));
    }

    //K2
    next(springs);

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.v2.copy(particle.velocity);
        particle.a2.copy(particle.a);
    }

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.position.add(particle.v2.multiplyScalar(timeStep / 2));
        particle.velocity.add(particle.a2.multiplyScalar(timeStep / 2));
    }

    //K3
    next(springs);

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.v3.copy(particle.velocity);
        particle.a3.copy(particle.a);
    }

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.position.add(particle.v3.multiplyScalar(timeStep));
        particle.velocity.add(particle.a3.multiplyScalar(timeStep));
    }

    //K4
    next(springs);

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.v4.copy(particle.velocity);
        particle.a4.copy(particle.a);
    }

    //
    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.velocity.copy(particle.iniVelocity);
        particle.position.copy(particle.iniPosition);
    }

    for(i = 0; i < particles.length; i ++ ){
        particle = particles[i];
        particle.rk(timeStep);
    }

    function next(springs){
        let spring;
        for (i = 0; i < springs.length; i ++) {
            spring = springs[i];
            damperForce(spring[0], spring[1], DAMPING);
            springForce(spring[0], spring[1], spring[2], spring[3]);
        }
    }
}
