(function rigidCannon(){

    let container, stats;
    let camera, scene, renderer;
    let world, mass, body, shape, timeStep = 1 / 100,
        geometry, material, mesh, vertices, staticEdge, line;
    let edges = [];

    init();
    initCannon();
    createPanel();
    animate();


    function createPanel(){

        let params = {
            'reset': reset,
            'add beam': beam
        };

        let panel = new dat.GUI({width: 300});
        let folder1 = panel.addFolder( 'Panel' );

        folder1.add(params, 'reset').name('Reset');
        folder1.add(params, 'add beam').name('Add Beam');

        folder1.open();

    }

    function beam(){
        if(line.visible){
            line.visible = false;
        }else{
            line.visible = true;
        }
    }

    function reset(){
        body.position.set(0, 10, 0);
        body.angularVelocity.set(2, 2, 2);
    }

    function initCannon() {

        world = new CANNON.World();
        world.gravity.set(0, -10, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        //Create a cube
        shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 10, 0)
        });
        body.addShape(shape);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(2, 2, 2);
        body.angularDamping = 0;
        body.quaternion.set(0, 0, 0, 1);
        world.addBody(body);

        // Create a plane
        let groundShape = new CANNON.Plane();
        let groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
        world.addBody(groundBody);
    }

    function init() {
        //container
        container = document.getElementById('canvas');
        document.body.appendChild(container);

        // scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // camera
        camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(40, 10, 15);

        scene.add(camera);

        // lights
        let light;
        scene.add( new THREE.AmbientLight(0x666666));
        light = new THREE.DirectionalLight(0xdfebff, 0.5);
        light.position.set(20, 100, 0);
        light.castShadow = true;
        scene.add(light);

        // mesh
        geometry = new THREE.BoxGeometry( 2, 2, 2 );
        material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        mesh = new THREE.Mesh(geometry, material);
        vertices = mesh.geometry.vertices;
        scene.add(mesh);

        // edges
        edges[0] = [0, 1];
        edges[1] = [0, 2];
        edges[2] = [1, 3];
        edges[3] = [2, 3];
        edges[4] = [4, 5];
        edges[5] = [4, 6];
        edges[6] = [5, 7];
        edges[7] = [6, 7];
        edges[8] = [0, 5];
        edges[9] = [1, 4];
        edges[10] = [2, 7];
        edges[11] = [3, 6];

        // renderer
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // ground
        let groundMaterial = new THREE.MeshPhongMaterial({
            shininess: 80,
            color: 0xfae0af,
            specular: 0xe5e2de
        });
        let planeGeometry = new THREE.PlaneBufferGeometry(20, 20);
        let ground = new THREE.Mesh(planeGeometry, groundMaterial);
        ground.position.set(0, 0, 0);
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // line
        let lineMaterial = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });

        let lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(
            new THREE.Vector3(-10, 5, 1),
            new THREE.Vector3(10, 5, 1),
        );
        staticEdge = [new THREE.Vector3(-10, 5, 1), new THREE.Vector3(10, 5, 1)];
        line = new THREE.Line(lineGeometry, lineMaterial);
        line.visible = false;
        scene.add(line);

        // controls
        let controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.minDistance = 10;
        controls.maxDistance = 100;

        // performance monitor
        stats = new Stats();
        container.appendChild(stats.dom);
    }

    function updatePhysics() {
        world.step(timeStep);
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }

    function animate(){
        requestAnimationFrame(animate);
        render();
        updatePhysics();
        if(line.visible){
            edgeCollision(staticEdge);
        }
        stats.update();
    }

    function render() {
        mesh.updateMatrixWorld();
        renderer.render(scene, camera);
    }


    function edgeCollision(staticEdge){
        let worldVertices = [];
        for(let i  = 0; i < vertices.length; ++i){
            let vertex = vertices[i].clone();
            worldVertices[i] = vertex.applyMatrix4(mesh.matrixWorld);
        }

        let edge = new THREE.Vector3();
        for(let i = 0; i < edges.length; ++i){
            let q1 = worldVertices[edges[i][0]], q2 = worldVertices[edges[i][1]];
            let p1 = staticEdge[0], p2 = staticEdge[1];
            let a = new THREE.Vector3().subVectors(p2, p1);
            let b = new THREE.Vector3().subVectors(q2, q1);
            let n = new THREE.Vector3().crossVectors(a, b).normalize();
            let r = new THREE.Vector3().subVectors(q1, p1);
            let an = a.clone().normalize();
            let bn = b.clone().normalize();
            let tmp1 = new THREE.Vector3().crossVectors(bn, n);
            let tmp2 = new THREE.Vector3().crossVectors(an, n);
            let s = r.dot(tmp1) / a.dot(tmp1);
            let t = -r.dot(tmp2) / b.dot(tmp2);

            if(s >= 0 && s <= 1 && t >= 0 && t <= 1){
                let qa = new THREE.Vector3().copy(q1).add(b.multiplyScalar(t));
                let pa = new THREE.Vector3().copy(p1).add(a.multiplyScalar(s));
                let dist = new THREE.Vector3().subVectors(qa, pa);
                if(dist.length() < 0.1){
                    let cannonPoint = new CANNON.Vec3().set(qa.x, qa.y, qa.z);
                    let impulse = new CANNON.Vec3().set(n.x, n.y, n.z);
                    impulse.mult(1, impulse);
                    body.applyImpulse(impulse, cannonPoint);
                }
            }
        }
    }
})();