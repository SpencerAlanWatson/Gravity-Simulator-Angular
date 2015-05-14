app.service('forceOld', ['$rootScope', 'gObject',
    function ($rootScope, GObject) {
        var service = {
            G: 6.67384e0,
            tickLength: 1,
            tickLast: window.performance.now(),
            timeoutId: 0,
            running: false,

            calcGravityForce: function (timeFrame, m1, m2, p1, p2) {
                if (p1.equals(p2)) return 0;

                var dist = p1.distanceTo(p2);
                return ((service.G * timeFrame) * (m1 * m2)) / Math.pow(dist, 2);
            },

            ForceLoop: function () {
                var tickNow = window.performance.now(),
                    tickDelta = tickNow - (service.tickLast ? service.tickLast : tickNow),
                    loopTicks = tickDelta / service.tickLength,
                    timeFrame = (service.tickLength / 1000);

                service.tickLast = tickNow;

                for (var tick = 0; tick < loopTicks; ++tick) {
                    _.each(GObject.objects, function (firstObject, firstIndex) {
                        _.each(GObject.objects, function (secondObject, secondIndex) {
                            if (firstIndex === secondIndex) //That means its the same object
                                return;
                            var gForce = service.calcGravityForce(timeFrame, firstObject.mass, secondObject.mass, firstObject.position, secondObject.position);
                            $rootScope.$broadcast('force.addForce', {
                                firstObject: firstObject,
                                startPosition: secondObject.position,
                                force: gForce
                            });
                        });
                    });
                    $rootScope.$broadcast('force.applyForce', 1);
                }
                if (service.running) _.defer(service.ForceLoop);
                //service.timeoutId = setTimeout(service.ForceLoop, 0);
            },
            Start: function () {
                _.defer(service.ForceLoop);
                service.running = true;
            },
            Stop: function () {
                service.running = false;
            },
            Pause: function () {
                service.Stop();
                service.tickLast = null;
            },
            Unpause: function () {
                service.Start();
            }
        }
        return service;
    }]);

function forceObject(index, gObject) {
    var self = this;
    this.index = index;
    this.mass = gObject.mass;
    //This is to turn them into actual points;
    this.position = gObject.position.toArray();
    this.velocity = gObject.velocity.toArray();
}
app.service('force', ['$rootScope', 'gObject',
    function ($rootScope, gObject) {
        var service = {
            G: 6.67384e0,
            tickLength: 1,
            tickLast: window.performance.now(),
            timeoutId: 0,
            running: false,
            GMs: {},
            forceWorker: null,

            updateGravityMass: function (Objects, timeFrame) {
                if (!Objects || Objects.length <= 0 || !timeFrame)
                    return;
                var ret = {},
                    len2 = Objects.length,
                    len1 = len2 - 1,
                    oi1, oi2,
                    gravityConst = service.G * timeFrame;


                for (oi1 = 0; oi1 < len1; ++oi1) {
                    var gm1 = gravityConst * Objects[oi1].mass;
                    ret[oi1] = {};
                    for (oi2 = oi1 + 1; oi2 < len2; ++oi2) {
                        ret[oi1][oi2] = gm1 * Objects[oi2].mass;
                    }
                }
                service.GMs = ret;
            },
            calcGravityForce: function (timeFrame, m1, m2, p1, p2) {
                if (p1.equals(p2)) return 0;

                return ((service.G * timeFrame) * (m1 * m2)) / p1.distanceToSquared(p2);
            },
            calcGravityForceOptimized: function (objectIndex1, objectIndex2, p1, p2) {
                if (p1.equals(p2)) return 0;

                return service.GMs[objectIndex1][objectIndex2] / p1.distanceToSquared(p2);
            },
            ForceTick: function (Objects, GMs) {
                var loopLength = Objects.length - 1,
                    objIndex1, objPosition1, objGM1,
                    objIndex2, gForce;

                for (objIndex1 = 0; objIndex1 < loopLength; ++objIndex1) {
                    objPosition1 = Objects[objIndex1].position;
                    objGM1 = GMs[objIndex1];
                    for (objIndex2 = objIndex1 + 1; objIndex2 <= loopLength; ++objIndex2) {
                        gForce = objGM1[objIndex2] / objPosition1.distanceToSquared(Objects[objIndex2].position);
                        $rootScope.$broadcast(
                            'force.addForce.gravity',
                            gForce,
                            objIndex1,
                            objIndex2);
                    }
                }
                $rootScope.$broadcast('force.applyForce');

            },

            ForceLoop: function ForceLoop(tickLast, Objects, GMs) {
                var tickNow = window.performance.now(),
                    loopTicks = (tickNow - tickLast) / service.tickLength;
                if (service.running) _.defer(service.ForceLoop, tickNow, Objects, GMs);


                for (var tick = 0; tick < loopTicks; ++tick) {
                    service.ForceTick(Objects, GMs);
                }
                //service.timeoutId = setTimeout(service.ForceLoop, 0);
            },
            Start: function () {
                service.running = true;

                if (!service.forceWorker) {
                    service.forceWorker = new Worker('../workers/force-worker.js');

                    service.forceWorker.addEventListener('message', function (event) {
                        var data = event.data;
                        switch (data.type) {
                        case 'positions':
                            _.each(data.positions, function (position, index) {
                                gObject.updatePosition(Number(index), new THREE.Vector3().fromArray(position));
                            });

                            break;
                        case 'vectors':
                            _.each(data.vectors, function (vectors, index) {
                                gObject.updatePosition(Number(index), new THREE.Vector3().fromArray(vectors.position));
                                gObject.updateVelocity(Number(index), new THREE.Vector3().fromArray(vectors.velocity));
                            });
                            break;
                        }
                    });

                    service.forceWorker.postMessage({
                        type: "addobjects",
                        objects: _.map(gObject.objects, function (object, index) {
                            return new forceObject(index, object);
                        })
                    });
                }
                service.forceWorker.postMessage({
                    type: "start"
                });
                //service.updateGravityMass(gObject.objects, service.tickLength / 1000);
                //Might have to wait until GObject is ready
                //service.ForceLoop(window.performance.now(), gObject.objects, service.GMs, $rootScope.$broadcast);
                //_.defer(service.ForceLoop, tickLast);
            },
            Stop: function () {
                service.running = false;
                service.forceWorker.postMessage({
                    type: "stop"
                });
                //service.forceWorker.terminate();
            },
            Pause: function () {
                //service.Stop();
                //service.tickLast = null;
                service.running = false;
                service.forceWorker.postMessage({
                    type: "pause"
                });
            },
            Unpause: function () {
                //service.Start();
                service.running = true;

                service.forceWorker.postMessage({
                    type: "unpause"
                });
            }
        }
        $rootScope.$on("graphics.draw", function (event) {
            if (service.running && service.forceWorker) {
                service.forceWorker.postMessage({
                    type: "getvectors"
                });
            }
        });
        $rootScope.$on('gobject.add', function (event, object, index) {
            if (service.forceWorker) {
                service.forceWorker.postMessage({
                    type: "addobjects",
                    objects: [new forceObject(index, object)]
                });
            }
        });
        $rootScope.$on('gobject.remove', function (event, object, index) {
            if (service.forceWorker) {
                service.forceWorker.postMessage({
                    type: "removeobjects",
                    indexs: [index]
                });
            }
        });
        return service;
            }]);