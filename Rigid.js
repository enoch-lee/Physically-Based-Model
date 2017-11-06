/**
 * Created by Zishuo Li on 11/5/2017.
 */

let State = function(x, P, L, q){

    this.type = 'state';

    this.x = x || new THREE.Vector3();
    this.P = P || new THREE.Vector3();
    this.L = L || new THREE.Vector3();
    this.q = q || new THREE.Quaternion();

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
    }

    this.copy = function(S){
        this.x.copy(S.x);
        this.P.copy(S.P);
        this.L.copy(S.L);
        this.q.copy(S.q);
    }
};


let computeRigidDerivative = function(S, mass, invI0){
    let derivative = new State();
    derivative.x.set(S.P.x / mass, S.P.y / mass, S.P.z / mass);

    let R = new THREE.Matrix3();
    R = quaternion2Matrix(S.q);

    let Rt = new THREE.Matrix3().copy(R).transpose();
    let invI = new THREE.Matrix3();
    let temp = new THREE.Matrix3();
    temp.multiplyMatrices(R, invI0);
    invI.multiplyMatrices(temp, Rt);

    let e = invI.elements;
    let L = S.L;
    let w = new THREE.Vector3();
    w.x = e[0] * L.x + e[1] * L.y + e[2] * L.z;
    w.y = e[3] * L.x + e[4] * L.y + e[5] * L.z;
    w.z = e[6] * L.x + e[7] * L.y + e[8] * L.z;

    let wq = new THREE.Quaternion();
    wq.set(w.x, w.y, w.z, 0);
    wq.multiply(S.q);
    wq.set(wq.x / 2, wq.y / 2, wq.z / 2, wq.w / 2);

    derivative.q = wq;
    derivative.q = wq;

    return derivative;
};

let rigidMotion = function(S, mass, I0, timeStep){
    let drvState = new State();
    drvState = computeRigidDerivative(S, mass, I0);
    S.next(drvState, timeStep);
    S.q.normalize();
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