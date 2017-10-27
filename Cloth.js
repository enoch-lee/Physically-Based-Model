/**
 * Created by Zishuo Li on 10/26/2017.
 */

let restDistance = 25;
let xSegs = 10;
let ySegs = 10;
const WIDTH = restDistance * xSegs;
const HEIGHT = restDistance * ySegs;
const MASS = 1;
let pins = [];
let cloth = new Cloth(xSegs, ySegs);

//u, v -> [0, 1]
let clothFunc = function(u, v){
    let x = u * WIDTH;
    let y = v * HEIGHT;
    let z = 0;
    return new THREE.Vector3(x, y, z);
}

function Particle(x, y, z, mass){
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.position = clothFunc(x, y);
    this.original = clothFunc(x, y);
    this.mass = mass;
    this.a = new THREE.Vector3(0, 0, 0);
}

Particle.prototype.integrate = function(h){

}

Particle.prototype.addForce = function( force ) {
    let temp = new THREE.Vector3().copy(force);
    this.a.add(temp.divideScalar( this.mass ));
};

let restDistance = 25;

function Cloth(w, h){
    this.w = w;
    this.h = h;
    let particles = [];
    let springs = [];

    let u, v; //y, x
    //create particles
    for(v = 0; v < h; ++v){
        for(u = 0; u < w; ++u){
            particles.push(new Particle(u / w, v / h, 0, MASS));
        }
    }

    // strut spring
    for ( v = 0; v < h; v ++ ) {
        for ( u = 0; u < w; u ++ ) {
            springs.push( [
                particles[ index( u, v ) ],
                particles[ index( u, v + 1 ) ],
                restDistance
            ] );

            springs.push( [
                particles[ index( u, v ) ],
                particles[ index( u + 1, v ) ],
                restDistance
            ] );
        }
    }

    //right
    for ( u = w, v = 0; v < h; v ++ ) {
        springs.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v + 1 ) ],
            restDistance
        ] );
    }
    //bottom
    for ( v = h, u = 0; u < w; u ++ ) {
        springs.push( [
            particles[ index( u, v ) ],
            particles[ index( u + 1, v ) ],
            restDistance
        ] );
    }

    let diagonalDist = Math.sqrt(restDistance * restDistance * 2);

    for (v = 0; v < h; v++) {
    	for (u = 0; u<w; u++) {
    		springs.push([
    			particles[index(u, v)],
    			particles[index(u + 1, v + 1)],
    			diagonalDist
    		]);
    		springs.push([
    			particles[index(u + 1, v)],
    			particles[index(u, v + 1)],
    			diagonalDist
    		]);
    	}
    }

    this.particles = particles;
    this.springs = springs;

    function index( u, v ) {
        return u + v * ( w + 1 );
    }
}

function elasticForce(p1, p2, distance){
    let diff = new THREE.Vector3();
    diff.subVectors(p1, p2);
    let currDistance = diff.length();
    if(currDistance === 0) return;
    diff.multiplyScalar(currDistance - distance).multiplyScalar(0.9);
    let p1F = diff.clone();
    let p2F = diff.clone();
    p1.a.sub(p1F.divideScalar(p1.mass));
    p2.a.add(p2F.divideScalar(p2.mass));
}

function simulate( time ) {

    if ( !lastTime ) {
        lastTime = time;
        return;
    }

    let i, il, particles, particle;

    // Aerodynamics forces

    if (wind) {

        let face, faces = clothGeometry.faces, normal;
        particles = cloth.particles;
        for ( i = 0, il = faces.length; i < il; i ++ ) {

            face = faces[ i ];
            normal = face.normal;

            tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
            particles[ face.a ].addForce( tmpForce );
            particles[ face.b ].addForce( tmpForce );
            particles[ face.c ].addForce( tmpForce );

        }

    }

    for (i = 0; i < particles.length; i ++ ) {
        particle = cloth.particles[ i ];
        particle.addForce( gravity );
        particle.integrate( TIMESTEP_SQ );
    }

    // Start Constraints


    for ( i = 0; i < il; i ++ ) {

    }

    // Pins Constraints
    for ( i = 0; i < pins.length; i ++ ) {
        let index = pins[i];
        let p = particles[index];
        p.position.copy( p.original );
    }
}
