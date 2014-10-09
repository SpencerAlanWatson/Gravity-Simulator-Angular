    app.service('graphics', ['$rootScope', 'gObject',
        function ($rootScope, gObject) {
            var service = {
                tickLast: 0,
                animId: 0,
                interactionManager: null,

                rotation: new THREE.Vector3(0, 0, 0),
                translation: new THREE.Vector3(0, 0, 0),
                rotationSpeed: Math.PI / 4,
                translationSpeed: 1,

                canvasSize: new THREE.Vector2(window.innerWidth, window.innerHeight),
                radius: 100,
                camStartPos: new THREE.Vector3(0, 0, 0),
                lastAngle: new THREE.Vector3(0, 0, 0),
                selectedObject: gObject.objects[0],
                renderer: null,
                scene: null,
                camera: null,


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

                    var endpos = obj.position.clone(),
                        radius = service.radius; //endpos.distanceTo(service.camStartPos);

                    endpos.x += radius * Math.cos(angle.x);
                    endpos.y += radius * Math.cos(angle.y);
                    endpos.z += radius * Math.cos(angle.z);
                    service.lastAngle.copy(angle);
                    service.camera.position.copy(endpos);
                    service.camera.lookAt(obj.position);

                },
                rotateCameraAroundSelected: function (angle) {
                    service.rotateCameraAround(service.selectedObject, angle);
                },
                GraphicsLoop: function (tickNow) {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);
                    //o1.position.copy(Objects[0].position);
                    //o2.position.copy(Objects[1].position);
                    var tickDelta = tickNow - service.tickLast;
                    if (!service.tickLast) {
                        tickDelta = 0;
                    }
                    service.rotateCameraAroundSelected(service.lastAngle);

                    service.renderer.render(service.scene, service.camera);
                    $rootScope.$broadcast('graphics.draw');
                    service.tickLast = tickNow; //window.performance.now();

                },

                /*forceLoopRunner() {
                    var tickNow = window.performance.now(),
                        tickDelta = tickNow - tickLast;
                    if (!tickLast) {
                        tickDelta = 0;
                    }
                    ForceObj.ForceLoop(Objects, tickDelta);
                    timeoutId = setTimeout(forceLoopRunner, 0);
                    tickLast = tickNow;
                }*/
                keyRotation: function (index, clockwise, start) {
                    var mod = start ? rotationSpeed * (clockwise ? 1 : -1) : 0;
                    if (index === 'x')
                        rotation.x = mod;
                    else if (index === 'y')
                        rotation.y = mod;
                    else
                        rotation.z = mod;
                },

                keyTranslate: function (index, forward, start) {
                    var mod = start ? translationSpeed * (forward ? 1 : -1) : 0;
                    if (index === 'x')
                        translation.x = mod;
                    else if (index === 'y')
                        translation.y = mod;
                    else
                        translation.z = mod;

                },

                switchCamera: function (cameraNumber) {
                    service.camera = service.Cameras[cameraNumber];
                },


                logVector3Objects: function (Array, vecIndex) {
                    console.group(vecIndex);
                    _.each(Array, function (element, index) {
                        console.group(index);
                        console.log("X: ", element[vecIndex].x);
                        console.log("Y: ", element[vecIndex].y);
                        console.log("Z: ", element[vecIndex].z);
                        console.groupEnd();
                    });
                    console.groupEnd();
                },

                onKeyDown: function (event) {
                    //console.log('Key Down', event);
                    return;
                    var keyCode = event.keyCode;
                    if (event.altKey && keyAltBinds[keyCode])
                        service.keyAltBinds[keyCode](true);
                    else if (keyBinds[keyCode])
                        service.keyBinds[keyCode](true);

                    if (keyCode >= 48 && keyCode <= 57) { //0 - 9 keys
                        if (event.shiftKey)
                            keyCode += 10;
                        if (event.altKey)
                            keyCode += 20;
                        switchCamera(keyCode - 48);
                    }
                    event.preventDefault(true);
                    event.stopPropagation();

                    return false;
                },

                onKeyUp: function (event) {
                    return;
                    var keyCode = event.keyCode;
                    if (event.altKey && keyAltBinds[keyCode])
                        service.keyAltBinds[keyCode](false);
                    else if (keyBinds[keyCode])
                        service.keyBinds[keyCode](false);
                    event.preventDefault(true);
                    event.stopPropagation();

                    return false;
                },
                createCameras: function () {
                    var Cameras = [];
                    var xi, yi, zi, xval, yval, zval,
                        index = 0,
                        val = 250,
                        fov = 45,
                        lookPos = new THREE.Vector3(0, 0, 0);
                    /*for (xi = -1; xi <= 1; ++xi) {
                        xval = val * xi;
                        for (yi = -1; yi <= 1; ++yi) {
                            yval = val * yi;
                            for (zi = -1; zi <= 1; ++zi) {
                                if (xi || yi || zi) {
                                    zval = val * zi;
                                    Cameras[index] = new THREE.PerspectiveCamera(
                                        fov,
                                        service.canvasSize.x / service.canvasSize.y,
                                        0.1, 1000); //0, canvasSize.x, 0, canvasSize.y, 0.1, 1000);
                                    Cameras[index].position.x = xval;
                                    Cameras[index].position.y = yval;
                                    Cameras[index].position.z = zval;
                                    Cameras[index].lookAt(lookPos);
                                    ++index;
                                }
                            }
                        }
                    }
                    service.Cameras = Cameras;
                    service.switchCamera(0);*/
                    service.camera = new THREE.PerspectiveCamera(
                        fov,
                        service.canvasSize.x / service.canvasSize.y,
                        0.1, 1000); //0, canvasSize.x, 0, canvasSize.y, 0.1, 1000);
                    service.rotateCameraAroundSelected(new THREE.Vector3());
                    //service.camStartPos = //new THREE.Vector3(service.radius, 0, 0);

                    //service.camera.position.copy(service.camStartPos);
                    //service.camera.lookAt(gObject.objects[0].position);
                },

                Start: function () {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);
                    service.renderer = new THREE.WebGLRenderer();
                    service.renderer.setSize(service.canvasSize.x, service.canvasSize.y);

                    service.scene = new THREE.Scene();
                    service.selectedObject = gObject.objects[0];

                    service.createCameras();

                    document.body.appendChild(service.renderer.domElement);
                    document.body.addEventListener('keydown', service.onKeyDown, true);
                    document.body.addEventListener('keyup', service.onKeyUp, true);

                    _.each(gObject.objects, function (gObject) {
                        service.scene.add(gObject);
                    });

                },

                Stop: function () {
                    cancelAnimationFrame(service.animId);
                    //clearTimeout(service.forceTimeoutId);

                    service.tickLast = null;

                    document.body.removeEventListener('keydown', service.onKeyDown, true);
                    document.body.removeEventListener('keyup', service.onKeyUp, true);
                    document.body.removeChild(service.renderer.domElement);
                },
                Pause: function () {
                    cancelAnimationFrame(service.animId);
                    service.tickLast = null;
                },
                Unpause: function () {
                    service.animId = requestAnimationFrame(service.GraphicsLoop);
                }
            };
            service.keyBinds = {
                81: _.partial(service.keyRotation, 'y', false), //Q
                87: _.partial(service.keyTranslate, 'y', false), //W
                69: _.partial(service.keyRotation, 'y', true), //E
                65: _.partial(service.keyTranslate, 'x', false), //A
                83: _.partial(service.keyTranslate, 'y', true), //S
                68: _.partial(service.keyTranslate, 'x', true) //D
            };
            service.keyAltBinds = {
                81: _.partial(service.keyRotation, 'x', false), //Q
                87: _.partial(service.keyTranslate, 'z', false), //W
                69: _.partial(service.keyRotation, 'x', true), //E
                65: _.partial(service.keyTranslate, 'x', false), //A
                83: _.partial(service.keyTranslate, 'z', true), //S
                68: _.partial(service.keyTranslate, 'x', true) //D
            };
            service.keyCtrlBinds = {
                81: _.partial(service.keyRotation, 'x', false), //Q
                87: _.partial(service.keyTranslate, 'z', false), //W
                69: _.partial(service.keyRotation, 'x', true), //E
                65: _.partial(service.keyTranslate, 'x', false), //A
                83: _.partial(service.keyTranslate, 'z', true), //S
                68: _.partial(service.keyTranslate, 'x', true) //D
            };
            service.keyShiftBinds = {
                81: _.partial(service.keyRotation, 'x', false), //Q
                87: _.partial(service.keyTranslate, 'z', false), //W
                69: _.partial(service.keyRotation, 'x', true), //E
                65: _.partial(service.keyTranslate, 'x', false), //A
                83: _.partial(service.keyTranslate, 'z', true), //S
                68: _.partial(service.keyTranslate, 'x', true) //D
            };

            $rootScope.$on('gobject.remove', function (event, gobj) {
                service.scene.remove(gobj);
            });
            window.gra = service;
            return service;
        }]);