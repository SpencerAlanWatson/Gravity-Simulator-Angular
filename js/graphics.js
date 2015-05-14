    app.service('graphics', ['$rootScope', '$window', '$document', 'gObject',
        function ($rootScope, $window, $document, gObject) {
            var service = {
                tickLast: 0,
                animId: 0,
                interactionManager: null,

                rotation: new THREE.Vector3(0, 0, 0),
                translation: new THREE.Vector3(0, 0, 0),
                rotationSpeed: Math.PI / 4,
                translationSpeed: 1,

                canvasSize: new THREE.Vector2($window.innerWidth, $window.innerHeight),
                radius: 300,
                camStartPos: new THREE.Vector3(0, 0, 0),
                lastAngle: new THREE.Vector3(0, 0, 0),
                selectedObject: null,
                renderer: null,
                scene: null,
                camera: new THREE.PerspectiveCamera(
                    45,
                    $window.innerWidth / $window.innerHeight,
                    0.1, 10000),
                target: new THREE.Vector3(),

                raycaster: new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0.1, 1000),
                light: null,


                clearCanvas: function (ctx) {
                    ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
                },

                drawCanvas: function (ctx, List) {
                    ctx.fillStyle = "rgba(0, 0, 0, 1)";
                    var first = true;
                    _.each(List, function (object) {
                        ctx.beginPath();

                        object.Draw(ctx);
                        ctx.fill();
                    });

                },
                rotatePoint: function (pointToRotate, centerOfRotation, angle) {
                    angle = (angle) * (Math.PI / 180); // Convert to radians
                    var rotatedX = Math.cos(angle) * (pointToRotate.x - centerOfRotation.x) - Math.sin(angle) * (pointToRotate.z - centerOfRotation.z) + centerOfRotation.x;
                    var rotatedZ = Math.sin(angle) * (pointToRotate.x - centerOfRotation.x) + Math.cos(angle) * (pointToRotate.z - centerOfRotation.z) + centerOfRotation.z;

                    return new THREE.Vector3(rotatedX, centerOfRotation.y, rotatedZ);
                },
                createArc: function (cPos, radius, index1, index2) {
                    var cVal1 = cPos.getComponent(index1),
                        cVal2 = cPos.getComponent(index2),
                        start = new THREE.Vector3().setComponent(index1, cVal1 + radius),
                        end = new THREE.Vector3().setComponent(index1, cVal1 - radius),
                        top = new THREE.Vector3().setComponent(index2, cVal2 + radius * 2),
                        bottom = new THREE.Vector3().setComponent(index2, cVal2 - radius * 2);

                    return [new THREE.QuadraticBezierCurve3(start, top, end), new THREE.QuadraticBezierCurve3(start, bottom, end)];

                },
                createArcs: function (cPos, radius) {
                    var ret = [],
                        cArc = _.partial(service.createArc, cPos, radius);
                    ret.push(cArc(0, 1));
                    ret.push(cArc(0, 2));
                    ret.push(cArc(1, 2));

                    return ret;
                },

                getRotationPoint: function (percent, arcs) {
                    if (percent > 0)
                        return arcs[0].getPoint(Math.abs(percent));
                    else
                        return arcs[1].getPoint(Math.abs(percent));
                },

                rotateCameraAround: function (obj, angle) {
                    if (obj) {
                        var endpos = service.camera.position.clone().sub(obj.position),
                            radius = service.radius; //endpos.distanceTo(service.camStartPos);
                        var quat = new THREE.Quaternion().setFromUnitVectors(service.camera.up, new THREE.Vector3(0, 1, 0));
                        endpos.applyQuaternion(quat);

                        endpos.x = radius * Math.sin(angle.y) * Math.sin(angle.x);
                        endpos.y = radius * Math.cos(angle.y);
                        endpos.z = radius * Math.sin(angle.y) * Math.cos(angle.x);
                        endpos.applyQuaternion(quat.inverse());

                        service.camera.position.copy(obj.position).add(endpos);

                        service.camera.lookAt(obj.position);
                        //endpos.x += radius * Math.cos(angle.x);
                        //endpos.y += radius * Math.cos(angle.y);
                        //endpos.z += radius * Math.cos(angle.z);
                        service.lastAngle.copy(angle);
                        //service.camera.position.copy(endpos);
                        //service.camera.lookAt(obj.position);
                    } else if (typeof angle === 'undefined') {

                    }

                },
                rotateCameraAroundSelected: function (angle) {
                    //service.rotateCameraAround(service.selectedObject, angle);
                },
                convertCanvasPos: function (canvasPos) {
                    //  var widthHalf = canvasSize.x / 2,
                    //    heightHalf = canvasSize.y / 2;
                    var projector = new THREE.Projector(),
                        vector = canvasPos.clone();
                    projector.unprojectVector(vector, service.camera);

                    return vector;
                },
                click: function (clickPos) {
                    var vector = service.convertCanvasPos(clickPos),
                        diff = vector.clone().sub(service.camera.position),
                        raycaster = new THREE.Raycaster(service.camera.position, diff.normalize());


                    var intersections = raycaster.intersectObjects(gObject.objects);
                    if (intersections && intersections.length > 0) {
                        console.log(intersections);
                        var object = intersections[0].object;
                        //service.selectedObject = object;
                        $rootScope.$broadcast('graphics.clickObject', object, intersections[0]);

                    }
                },
                GraphicsLoop: function (tickNow) {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);
                    //o1.position.copy(Objects[0].position);
                    //o2.position.copy(Objects[1].position);
                    var tickDelta = tickNow - service.tickLast;
                    if (!service.tickLast) {
                        tickDelta = 0;
                    }
                    service.controls.update();
                    //service.rotateCameraAroundSelected(service.lastAngle);

                    service.renderer.render(service.scene, service.camera);
                    $rootScope.$broadcast('graphics.draw');
                    service.tickLast = tickNow; //window.performance.now();


                },
                onWindowResize: function onWindowResize() {

                    service.camera.aspect = $window.innerWidth / $window.innerHeight;
                    service.camera.updateProjectionMatrix();
                    service.canvasSize.x = $window.innerWidth;
                    service.canvasSize.y = $window.innerHeight;
                    service.renderer.setSize($window.innerWidth, $window.innerHeight);

                },


                createCameras: function () {
                    var Cameras = [];
                    var xi, yi, zi, xval, yval, zval,
                        index = 0,
                        val = 250,
                        fov = 45,
                        lookPos = new THREE.Vector3(0, 0, 0);
                    //0, canvasSize.x, 0, canvasSize.y, 0.1, 1000);
                    service.camera.position.z = 500;
                    //service.rotateCameraAroundSelected(new THREE.Vector3());
                },

                Start: function () {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);

                    service.renderer = new THREE.WebGLRenderer({
                        antialias: true,
                        alpha: true,
                        //preserveDrawingBuffer: true,
                    });

                    service.renderer.setSize(service.canvasSize.x, service.canvasSize.y);
                    service.renderer.setClearColor(0, 0);

                    service.scene = new THREE.Scene();

                    _.each(gObject.objects, function (gObject) {
                        service.scene.add(gObject);
                    });
                    service.selectedObject = gObject.objects[0];
                    service.createCameras();
                    /*var lineGeo = new THREE.Geometry();
                    lineGeo.vertices.push(
                        gObject.objects[0].position,
                        gObject.objects[1].position
                    );
                    service.line = new THREE.Line(lineGeo);
                    service.scene.add(service.line);*/
                    service.light = new THREE.AmbientLight(0x404040); // soft white light
                    service.scene.add(service.light);



                    $document.find('#main').append(service.renderer.domElement);
                    $window.addEventListener('resize', service.onWindowResize);
                    $rootScope.$broadcast('graphics.initialize', service);
                    service.controls = new THREE.OrbitControls(service.camera, service.renderer.domElement);

                    service.controls.damping = 0.2;
                    service.controls.target = service.target;

                    //document.body.addEventListener('keydown', service.onKeyDown, true);
                    //                  document.body.addEventListener('keyup', service.onKeyUp, true);



                },

                Stop: function () {
                    cancelAnimationFrame(service.animId);
                    //clearTimeout(service.forceTimeoutId);

                    service.tickLast = null;

                    //document.body.removeEventListener('keydown', service.onKeyDown, true);
                    //document.body.removeEventListener('keyup', service.onKeyUp, true);
                    $document.find('#main').empty(); //angular.element(service.renderer.domElement));
                    $window.removeEventListener('resize', service.onWindowResize);
                    $rootScope.$broadcast('graphics.deinitialize', service);


                },
                Pause: function () {
                    cancelAnimationFrame(service.animId);
                    service.tickLast = null;
                    $rootScope.$broadcast('graphics.pause');

                },
                Unpause: function () {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);
                    $rootScope.$broadcast('graphics.unpause');

                }
            };

            $rootScope.$on('controls.selectObject', function (event, newObject, lastObject) {
                if (service.controls) {
                    if (newObject)
                        service.controls.target = newObject.position;
                    else
                        service.controls.target = new THREE.Vector3();
                } else {
                    service.target =  newObject.position;
                }
            });

            $rootScope.$on('gobject.remove', function (event, gobj) {
                service.scene.remove(gobj);
            });
            $window.gra = service;
            return service;

                }]);