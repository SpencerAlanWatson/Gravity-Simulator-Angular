app.directive('gControls', ['$rootScope', 'gObject', 'graphics', 'force',
        function ($rootScope, gObject, graphics, force) {
        return {
            restrict: "A",
            templateUrl: "/templates/controls.htm",
            link: function (scope, element, attrs) {
                var selector = "#camAngle",
                    value = 0,
                    min = 0,
                    max = Math.PI,
                    step = (Math.PI / 6) / 6;

                for (var i = 1; i <= 3; ++i) {
                    var elem = element.find(selector + i);
                    elem.attr('value', value);
                    elem.attr('min', min);
                    elem.attr('max', max);
                    elem.attr('step', step);
                }
                var angle = new THREE.Vector3(0, 0, 0);
                scope.selectedObject = gObject.objects[0];
                scope.gObject = gObject;
                scope.graphics = graphics;

                scope.angleX = function (newAngle) {
                    if (angular.isDefined(newAngle)) {
                        angle.x = newAngle;
                        graphics.rotateCameraAroundSelected(angle);
                    } else
                        return angle.x;
                }
                scope.angleY = function (newAngle) {
                    if (angular.isDefined(newAngle)) {
                        angle.y = newAngle;
                        graphics.rotateCameraAroundSelected(angle);
                    } else
                        return angle.y;
                }
                scope.angleZ = function (newAngle) {
                    if (angular.isDefined(newAngle)) {
                        angle.z = newAngle;
                        graphics.rotateCameraAroundSelected(angle);
                    } else
                        return angle.z;
                }
                scope.graphics = graphics;
                scope.selectObject = function (gobj) {
                    console.log(gobj);
                    graphics.selectedObject = gobj;
                    //Quick way of setting a vector to 0;
                    angle.multiplyScalar(0);
                    graphics.rotateCameraAroundSelected(angle);
                };
                scope.objectUpdate = function (gobj) {
                    console.log(gobj);
                };
                scope.objectRemove = function (gobj) {
                    gObject.remove(gobj);
                };
                scope.isStarted = false;
                scope.isForcePaused = false;
                scope.isGraphicsPaused = false;
                scope.Start = function () {
                    gObject.create(new THREE.Vector3(0, 0, 0), 20000, new THREE.Vector3(0, 0, 0));
                    gObject.create(new THREE.Vector3(150, 150, 0), 200, new THREE.Vector3(0.5, -0.5, 0));
                    graphics.Start();
                    //Force.Start();
                    return true;
                };
                scope.Stop = function () {
                    gObject.removeAll();
                    graphics.Stop();
                    force.Stop();
                    return false;
                };
                scope.toggleStart = function() {
                    scope.isStarted = scope.isStarted ? scope.Stop() : scope.Start();
                }
                scope.startBtnClass = function () {
                    return scope.isStarted ? "btn-danger" : "btn-primary";
                };
                scope.startBtnText = function () {
                    return scope.isStarted ? "Stop" : "Start";
                };
                scope.pauseForceClass = function () {
                    return scope.isForcePaused ? "btn-info" : "btn-warning";
                };
                scope.pauseGraphicsClass = function () {
                    return scope.isGraphicsPaused ? "btn-info" : "btn-warning";
                };
                scope.pauseForceText = function () {
                    return scope.isForcePaused ? "Unpause Force" : "Pause Force";
                };
                scope.pauseGraphicsText = function () {
                    return scope.isGraphicsPaused ? "Unpause Graphics" : "Pause Graphics";
                };

                scope.toggleForcePause = function () {
                    if (scope.isForcePaused) {
                        force.Unpause();
                        scope.isForcePaused = false;
                    } else {
                        force.Pause();
                        scope.isForcePaused = true;
                    }
                };
                scope.toggleGraphicsPause = function () {
                    if (scope.isGraphicsPaused) {
                        graphics.Unpause();
                        scope.isGraphicsPaused = false;
                    } else {
                        graphics.Pause();
                        scope.isGraphicsPaused = true;
                    }
                };
                window.Start = scope.Start;
                window.Stop = scope.Stop;
            }
        };
        }]);
app.controller('gController', ['$scope', 'graphics', 'force', 'gObject',
            function ($scope, Graphics, Force, gObject) {
        //I don't know what to do with this, maybe I should remove it.
            }]);