/**
 * Created by Zishuo Li on 11/5/2017.
 */

let State = function(x, P, L, q, mass){

    this.type = 'state';

    this.x = x || new THREE.Vector3();
    this.P = P || new THREE.Vector3();
    this.L = L || new THREE.Vector3();
    this.q = q || new THREE.Quaternion();

    this.m = mass || 1;
    this.invI = new THREE.Matrix3();
    this.temp = new THREE.Vector3();

    this.next = function(S, h){
        this.x.add(S.x.multiplyScalar(h));
        this.P.add(S.P.multiplyScalar(h));
        this.L.add(S.L.multiplyScalar(h));
        let temp = new THREE.Quaternion();
        temp.set(S.q.x * h, S.q.y * h, S.q.z * h, S.q.w * h);
        this.q.x += temp.x;
        this.q.y += temp.y;
        this.q.z += temp.z;
        this.q.w += temp.w;

        if(this.P.length() < 1 && this.x.y < 35) {
            this.P.set(0, 0, 0);
        }

    }
};

let computeRigidDerivative = function(S, invI0){
    let invI = S.invI;
    let m = S.m;
    let derivState = new State();
    derivState.x.set(S.P.x / m, S.P.y / m, S.P.z / m);

    let R = new THREE.Matrix3();
    R = quaternion2Matrix(S.q);

    let Rt = new THREE.Matrix3().copy(R).transpose();
    let temp = new THREE.Matrix3();
    temp.multiplyMatrices(R, invI0);
    invI.multiplyMatrices(temp, Rt);

    let L = S.L;
    let w = matrix3vector3(invI, L);

    let wq = new THREE.Quaternion();
    wq.set(w.x, w.y, w.z, 0);
    wq.multiply(S.q);
    wq.set(wq.x / 2, wq.y / 2, wq.z / 2, wq.w / 2);

    derivState.q = wq;

    let gravity = new THREE.Vector3(0, -5, 0);
    derivState.P.add(gravity);

    return derivState;
};

let rigidMotion = function(S, invI0, timeStep){
    let derivState = new State();
    derivState = computeRigidDerivative(S, invI0);
    S.next(derivState, timeStep);
    S.q.normalize();
};

let updateCollision = function(S, normal, p, cr){
    let m = S.m;
    let invI = S.invI;
    let va = new THREE.Vector3().copy(S.P).divideScalar(m);
    let wa = matrix3vector3(invI, S.L);
    let ra = new THREE.Vector3().subVectors(p, S.x);
    let v = va.add(wa.cross(ra));
    let n = new THREE.Vector3().copy(normal);
    let preV = v.dot(n);

    let a = -(1 + cr) * preV;
    let b = new THREE.Vector3().crossVectors(ra, n);
    let c = matrix3vector3(invI, b);
    c.cross(ra);
    let d = 1 / m + n.dot(c);
    let j = a / d;


    let J = n.multiplyScalar(j);
    let e = new THREE.Vector3().crossVectors(ra, n);
    let L = e.multiplyScalar(j);
    //console.log(p.length());
    //console.log(S.x.length());

    //console.log(J.length);
    //console.log(S.P);
    if(J.length() < S.P.length()){
        S.P.set(0, 0, 0);
    }else{
        S.P.add(J);
    }
    //console.log(S.P);
    S.L.add(L);
};

let quaternion2Matrix = function(q){
    let m= new THREE.Matrix3();
    let x00 = 1 - 2 * q.y * q.y - 2 * q.z * q.z;
    let x01 = 2 * q.x * q.y - 2 * q.w * q.z;
    let x02 = 2 * q.x * q.z - 2 * q.w * q.y;
    let x10 = 2 * q.x * q.y + 2 * q.w * q.z;
    let x11 = 1 - 2 * q.x * q.x - 2 * q.z * q.z;
    let x12 = 2 * q.y * q.z - 2 * q.w * q.x;
    let x20 = 2 * q.x * q.z - 2 * q.w * q.y;
    let x21 = 2 * q.y * q.z + 2 * q.w * q.x;
    let x22 = 1 - 2 * q.x * q.x - 2 * q.y * q.y;
    m.set(x00, x01, x02,
          x10, x11, x12,
          x20, x21, x22);
    return m;
};

let setBoxInertia = function(w, h, l, mass){
    let I = new THREE.Matrix3();
    let e = I.elements;
    let a = mass / 12;
    e[0] = a * (w * w + h * h);
    e[4] = a * (l * l + w * w);
    e[8] = a * (l * l + h * h);
    return I;
};

let matrix3vector3 = function(m3, v){
    let m = m3.elements;
    let a = new THREE.Vector3();
    a.x = m[0] * v.x + m[1] * v.y + m[2] * v.z;
    a.y = m[3] * v.x + m[4] * v.y + m[5] * v.z;
    a.z = m[6] * v.x + m[7] * v.y + m[8] * v.z;
    return a;
};