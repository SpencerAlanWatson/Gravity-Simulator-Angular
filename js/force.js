    app.service('force', ['$rootScope', 'gObject',
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