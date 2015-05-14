var Tao = 2 * Math.PI;

function forceToForceVector3D(force, dir) {
    var angleA = xaxis.angleTo(dir),
        angleB = yaxis.angleTo(dir),
        angleC = zaxis.angleTo(dir);
    return new THREE.Vector3(force * Math.cos(angleA), force * Math.cos(angleB), force * Math.cos(angleC));
}

function GObject(position, mass, startingVelocity, density) {
    if (!(this instanceof GObject))
        return new GObject(position, mass, startingVelocity, density);

    var self = this;

    this.mass = Math.abs(mass) || 1;
    this.size = density ? mass / density : Math.log(this.mass);

    this._color = THREE.Math.randInt(0, 0xffffff);

    this.color = function (newColor) {
        if (angular.isDefined(newColor)) {
            self.material.color.set(newColor);
        } else {
            return self.material.color.getHexString();
        }
    };
    THREE.Mesh.call(this, new THREE.BoxGeometry(this.size, this.size, this.size), new THREE.MeshBasicMaterial({
        color: this._color
    }));

    this.position.copy(position);
    this.velocity = startingVelocity || new THREE.Vector3();
    this.accleration = new THREE.Vector3();



}

GObject.prototype = Object.create(THREE.Mesh.prototype);

GObject.prototype.Draw = function (ctx) {
    var gPos = this.position,
        gSize = this.size;
    ctx.rect(gPos.x, gPos.y, gSize, gSize);
};


GObject.prototype.addForce = function (force, p2) {
    if (this.mass >= 0) {

        var fv = force;
        //If angle was sent in, then we assume that force is the magnitude
        if (p2)
            fv = forceToForceVector3D(force, p2.clone().sub(this.position));

        this.accleration.add(fv.divideScalar(this.mass));
    }
};
//GObject.prototype
GObject.prototype.applyForce = function (perSec) {
    //var perSec = 1; //forceEvent.perSec;


    this.velocity.add(this.accleration.multiplyScalar(perSec));

    this.position.add(this.velocity);

    this.accleration = new THREE.Vector3();
};