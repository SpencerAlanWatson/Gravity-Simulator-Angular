var Tao = 2 * Math.PI;

function forceToForceVector3D(force, dir) {
    var angleA = xaxis.angleTo(dir),
        angleB = yaxis.angleTo(dir),
        angleC = zaxis.angleTo(dir);
    return new THREE.Vector3(force * Math.cos(angleA), force * Math.cos(angleB), force * Math.cos(angleC));
}

function GObject(position, mass, startingVelocity) {
    if (!(this instanceof GObject))
        return new GObject(position, mass, startingVelocity);

    var self = this,
        faceMaterial = new THREE.MeshFaceMaterial();

    this.mass = Math.abs(mass) || 1;
    this.size = Math.log(this.mass);
    this._color = THREE.Math.randInt(0, 0xffffff);
    faceMaterial.materials.push(new THREE.MeshBasicMaterial({
        color: this._color
    }));
    for (var faceIndex = 1; faceIndex < 6; ++faceIndex) {
        faceMaterial.materials.push(new THREE.MeshBasicMaterial({
            color: THREE.Math.randInt(0, 0xffffff)
        }));
    }

    THREE.Mesh.call(this, new THREE.BoxGeometry(this.size, this.size, this.size), faceMaterial);

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
GObject.prototype.color = function (newColor) {
    if (angular.isDefined(newColor)) {
        self.material.color.set(newColor);
    } else {
        /*var ret = this._color.toString(16);
        for(var i = 6-ret.length; i > 0; --i) {
            ret = "0" + ret;   
        }*/
        return "#000";// + ret;//"#" + self.material.color.getHexString();
    }
}
GObject.prototype.applyForce = function (perSec) {
    //var perSec = 1; //forceEvent.perSec;


    this.velocity.add(this.accleration.multiplyScalar(perSec));

    this.position.add(this.velocity);

    this.accleration = new THREE.Vector3();
};
// app.factory('gObjectFactory', GObject);

app.service('gObject', ['$rootScope',
        function ($rootScope) {
        var service = {
            'objects': [],
            'add': function (object) {
                service.objects.push(object);

                $rootScope.$broadcast('gobject.add', object);
            },
            'remove': function (object) {
                var index = service.objects.indexOf(object);
                if (index !== -1) {
                    service.objects.splice(index, 1);
                }
                $rootScope.$broadcast('gobject.remove', object);
            },
            'removeAll': function (object) {
                var objects = [].concat(service.objects);
                _.each(objects, function (obj) {
                    service.remove(obj);
                });
            },
            'create': function () {
                var args = arguments,
                    func = function () {
                        return GObject.apply(this, args);
                    },
                    newObj = new func();
                service.add(newObj);
                return newObj;
            },

        };
        $rootScope.$on('graphics.draw', function (event, data) {
            $rootScope.$apply();

        });
        $rootScope.$on('force.addForce', function (event, data) {
            //console.log(event);
            data.firstObject.addForce(data.force, data.startPosition);
            //console.trace('addForce is not implemented');
        });
        $rootScope.$on('force.applyForce', function (event, data) {

            _.invoke(service.objects, 'applyForce', data);

        });

        window.go = service;
        return service;
    }]);