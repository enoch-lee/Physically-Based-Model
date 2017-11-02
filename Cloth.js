function Cloth(xSegs, ySegs, restDistance, k){

    let w = xSegs, h = ySegs;
    this.w = w;
    this.h = h;

    let width = restDistance * w;
    let height = restDistance * h;

    let particles = [];
    let springs = [];
    let edges = [];

    let u, v; //y, x

    //create particles
    for(v = 0; v <= h; ++v){
        for(u = 0; u <= w; ++u){
            particles.push(new Particle(u / w, v / h, 0, width, height));
        }
    }

    //tensile spring
    for (v = 0; v < h; v ++) {
        for (u = 0; u < w; u ++) {
            springs.push([
                particles[index(u, v)],
                particles[index(u, v + 1)],
                restDistance,
                k[0]
            ]);

            springs.push([
                particles[index(u, v)],
                particles[index(u + 1, v)],
                restDistance,
                k[0]
            ]);

            edges.push([
                particles[index(u, v)],
                particles[index(u, v + 1)]
            ]);

            edges.push([
                particles[index(u, v)],
                particles[index(u + 1, v)]
            ]);
        }
    }

    //rightmost
    for (u = w, v = 0; v < h; v ++) {
        springs.push([
            particles[index(u, v)],
            particles[index(u, v + 1)],
            restDistance,
            k[0]
        ]);
        edges.push([
            particles[index(u, v)],
            particles[index(u, v + 1)]
        ]);
    }
    //bottom
    for (v = h, u = 0; u < w; u ++) {
        springs.push([
            particles[index(u, v)],
            particles[index(u + 1, v)],
            restDistance,
            k[0]
        ]);
        edges.push([
            particles[index(u, v)],
            particles[index(u + 1, v)]
        ]);
    }

    //bending spring
    let bendDistance = restDistance * 2;

    for (v = 0; v < h - 1; v ++) {
        for (u = 0; u < w - 1; u ++) {
            springs.push([
                particles[index(u, v)],
                particles[index(u, v + 2)],
                bendDistance,
                k[1]
            ]);

            springs.push([
                particles[index(u, v)],
                particles[index(u + 2, v)],
                bendDistance,
                k[1]
            ]);
        }
    }

    //rightmost
    for (u = w, v = 0; v < h - 1; v ++) {
        springs.push([
            particles[index(u, v)],
            particles[index(u, v + 2)],
            bendDistance,
            k[1]
        ]);
    }
    //bottom
    for (v = h, u = 0; u < w - 1; u ++) {
        springs.push([
            particles[index(u, v)],
            particles[index(u + 2, v)],
            bendDistance,
            k[1]
        ]);
    }

    //shear spring
    let diagonalDist = Math.sqrt(restDistance * restDistance * 2);

    for (v = 0; v < h; v++) {
        for (u = 0; u < w; u++) {
            springs.push([
                particles[index(u, v)],
                particles[index(u + 1, v + 1)],
                diagonalDist,
                k[2]
            ]);
            springs.push([
                particles[index(u + 1, v)],
                particles[index(u, v + 1)],
                diagonalDist,
                k[2]
            ]);
        }
    }

    this.particles = particles;
    this.springs = springs;
    this.edges = edges;

    function index(u, v) {
        return u + v * (w + 1);
    }
}
