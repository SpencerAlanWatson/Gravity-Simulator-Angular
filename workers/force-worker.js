var window = this;
importScripts('../js/vendor/three.js', '../js/vendor/underscore.js');

var G = 6.67484e-6, //1 ms
    rate = 1,
    goGenerator,
    tickLast = performance.now(), //ms percise to the microsecond
    tickLength = 1, //ms
    timeoutId = 0,
    fps = 0,
    Objects = [],
    len = Objects.length - 1,
    tickTimeFrame = tickLength / 1000,
    loopLength,
    GMs = {};

var zeroVector = new THREE.Vector3(0, 0, 0);
var xaxis = new THREE.Vector3(1, 0, 0);
var yaxis = new THREE.Vector3(0, 1, 0);
var zaxis = new THREE.Vector3(0, 0, 1);

function forceToForceVector3D(force, dir) {
    var angleA = xaxis.angleTo(dir),
        angleB = yaxis.angleTo(dir),
        angleC = zaxis.angleTo(dir);
    return new THREE.Vector3(force * Math.cos(angleA), force * Math.cos(angleB), force * Math.cos(angleC));
}

function sendAllPositions(Objects) {
    var event = {
        type: 'positions',
        positions: {},

    };
    _.each(Objects, function (object) {
        event.positions[object.index] = object.position.toArray();
    });
    postMessage(event);
}

function sendAllVelocities(Objects) {
    var event = {
        type: 'velocities',
        velocities: {},

    };
    _.each(Objects, function (object) {
        event.velocities[object.index] = object.velocity.toArray();
    });
    postMessage(event);
}

function sendAllVectors(Objects) {
    var event = {
        type: 'vectors',
        vectors: {},

    };
    _.each(Objects, function (object) {
        event.vectors[object.index] = {
            position: object.position.toArray(),
            velocity: object.velocity.toArray()
        }
    });
    postMessage(event);
}

function sendAllObjects(Objects) {
    var event = {
        type: 'objects',
        objects: {},

    };
    _.each(Objects, function (object) {
        event.objects[object.index] = object.toSendable();
    });
    postMessage(event);
}

function * GoGen() {
    //This function (should) never stop itself
    //This function is ment to be in a dedicated web worker
    //To stop this function, destroy the worker from the outside!

    tickLast = performance.now();
    while (true) {
        var tickNow = performance.now(),
            loopTicks = (tickNow - tickLast),

            objIndex1, obj1, objPosition1, objGM1,
            objIndex2, obj2, objPosition2,
            tick, gravityForce, forceVector;

        tickLast = tickNow;

        for (tick = 0; tick < rate; ++tick) {

            for (objIndex1 = 0; objIndex1 < len; ++objIndex1) {

                obj1 = Objects[objIndex1];
                objPosition1 = obj1.position;

                objGM1 = GMs[objIndex1];
                for (objIndex2 = objIndex1 + 1; objIndex2 <= len; ++objIndex2) {
                    obj2 = Objects[objIndex2];
                    objPosition2 = obj2.position;

                    gravityForce = ((objGM1[objIndex2] * (loopTicks)) / objPosition1.distanceToSquared(objPosition2));

                    forceVector1 = forceToForceVector3D(gravityForce, objPosition2.clone().sub(objPosition1).normalize());
                    forceVector2 = forceToForceVector3D(gravityForce, objPosition1.clone().sub(objPosition2).normalize());
                    obj1.forceVector.add(forceVector1);
                    obj2.forceVector.add(forceVector2);
                }
                obj1.applyForce(loopTicks);
            }
            obj2.applyForce(loopTicks);
        }
        //sendAllPositions(Objects);
        /*if (lastSend + 10 < tickNow) {
            lastSend = tickNow;
            sendAllPositions(Objects);
        }*/
        yield;
    }
}

function Go() {
    //This function (should) never stop itself
    //This function is ment to be in a dedicated web worker
    //To stop this function, destroy the worker from the outside!

    tickLast = performance.now();
    var len = Objects.length - 1,
        second = false,
        lastSend = 0,
        PauseTime = tickLast + 1000;
    while (true) {
        var tickNow = performance.now(),
            loopTicks = (tickNow - tickLast),

            objIndex1, obj1, objPosition1, objGM1,
            objIndex2, obj2, objPosition2,
            tick, gravityForce, forceVector;

        tickLast = tickNow;

        //for (tick = 0; tick < loopTicks; ++tick) {

        for (objIndex1 = 0; objIndex1 < len; ++objIndex1) {

            obj1 = Objects[objIndex1];
            objPosition1 = obj1.position;

            objGM1 = GMs[objIndex1];
            for (objIndex2 = objIndex1 + 1; objIndex2 <= len; ++objIndex2) {
                obj2 = Objects[objIndex2];
                objPosition2 = obj2.position;

                gravityForce = (objGM1[objIndex2] * loopTicks) / objPosition1.distanceToSquared(objPosition2);

                forceVector1 = forceToForceVector3D(gravityForce, objPosition2.clone().sub(objPosition1).normalize());
                forceVector2 = forceToForceVector3D(gravityForce, objPosition1.clone().sub(objPosition2).normalize());
                obj1.forceVector.add(forceVector1);
                obj2.forceVector.add(forceVector2);
            }
            obj1.applyForce(1);
        }
        obj2.applyForce(1);
        //}
        //sendAllPositions(Objects);
        if (lastSend + 10 < tickNow) {
            lastSend = tickNow;
            sendAllPositions(Objects);
        }
    }
}

function forceObject(index, mass, position, velocity) {
    var self = this;
    this.index = index;
    this.mass = mass;
    //This is to turn them into actual points;
    this.position = (new THREE.Vector3()).fromArray(position);
    this.velocity = ((new THREE.Vector3()).fromArray(velocity)).divideScalar(1000);
    this.forceVector = new THREE.Vector3();
}

forceObject.prototype.applyForce = function (perSec) {
    this.velocity.add(this.forceVector.divideScalar(this.mass)) //.multiplyScalar(perSec));
    this.position.add(this.velocity.clone().multiplyScalar(perSec));

    this.forceVector.x = 0;
    this.forceVector.y = 0;
    this.forceVector.z = 0;

    //this.sendPosition();
}

forceObject.prototype.sendPosition = function () {
    var event = {
        type: 'position',
        index: this.index,
        position: this.position.toArray()
    };
    postMessage(event);
    return event;
}
forceObject.prototype.toSendable = function () {
    var sendable = {
        index: this.index,
        mass: this.mass,
        position: this.position.toArray(),
        velocity: this.velocity.toArray(),
        forceVector: this.forceVector.toArray()
    };
    return sendable;
}

function setupGMs(Objects) {
    GMs = {};
    var len = Objects.length - 1,
        gFrame = G; //* tickTimeFrame;
    for (var objIndex = 0; objIndex < len; objIndex++) {
        obj1GMass = gFrame * Objects[objIndex].mass;
        GMs[objIndex] = {};
        for (var objIndex2 = objIndex + 1; objIndex2 <= len; objIndex2++) {
            GMs[objIndex][objIndex2] = obj1GMass * Objects[objIndex2].mass;
        }
    }
}

function timeoutLoop() {
    timeoutId = setTimeout(function Timeout() {
        goGenerator.next();
        timeoutId = setTimeout(Timeout, 0);
    }, 0);
};

function onStart(event) {
    //Go();
    goGenerator = GoGen();
    timeoutLoop();
}

function onGetPositions(event) {
    sendAllPositions(Objects);
}

function onGetVelocities(event) {
    sendAllVelocities(Objects);
}

function onGetVectors(event) {
    sendAllVectors(Objects);
}

function onGetObjects(event) {
    sendAllObjects(Objects);
}

function onAddObjects(event) {
    var objects = event.objects;
    _.each(objects, function (object, index, list) {
        Objects[object.index] = new forceObject(object.index, object.mass, object.position, object.velocity);
    });
    len = Objects.length - 1;

    setupGMs(Objects);
    //Objects[object.index] = new forceObject(object.index, object.mass, object.position, object.velocity);
}

function onChangeObject(event) {
    var index = event.index,
        property = event.property,
        value = event.value,
        obj = Objects[index];

    if (obj && obj[property]) {
        if (Array.isArray(value)) {
            obj[property].fromArray(value);
        } else {
            obj[property] = value;
        }
    }
}

function onRemoveObjects(event) {
    var indexs = event.indexs;
    _.each(indexs, function (index) {
        Objects.splice(index, 1);
    });
    len = Objects.length - 1;

    setupGMs(Objects);

}

function onStop(event) {
    clearTimeout(timeoutId);
    len = -1;
    Objects = [];
    GMs = {};
}

function onPause(event) {
    clearTimeout(timeoutId);
};

function onUnpause(event) {
    timeoutLoop();
}
onmessage = function (e) {
    var event = e.data;
    switch (event.type.toLowerCase()) {
    case "start":
        onStart(event);
        break;
    case "getpositions":
        onGetPositions(event);
        break;
    case "getvelocities":
        onGetVelocities(event);
        break;
    case "getvectors":
        onGetVectors(event);
        break;
    case "getobjects":
        onGetObjects(event);
        break;
    case "addobjects":
        onAddObjects(event);
        break;
    case "changeobject":
        onChangeObject(event);
        break;
    case "removeobjects":
        onRemoveObjects(event);
        break;
    case "stop":
        onStop(event);
        break;
    case "pause":
        onPause(event);
        break;
    case "unpause":
        onUnpause(event);
        break;
    }
};