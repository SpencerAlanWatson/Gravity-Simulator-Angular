app.filter('numb', function () {
    return function (input, precision) {
        if (!Number.isFinite(input))
            return "";

        var out = "",
            numb = Number(input),
            numbStr = numb.toPrecision(precision);

        if (numb > 0) {
            out = "+" + numbStr;
        } else if (numb < 0) {
            out = numbStr;
        } else {
            out = "±" + numbStr;
        }
        return out.trim();
    };
});
app.filter('vector3', function () {
    return function (input) {
        if (!input || !input.getComponent) return " , , ";
        var out = "";
        for (var index = 0; index < 3; ++index) {
            var val = input.getComponent(index);
            out += val.toPrecision(5);
            out += ', ';
        }
        out = out.substr(0, out.length - 2);
        return out;
    };
});
app.filter('velocity', function () {
    return function (input) {
        if (!input || !input.getComponent) return " , , ";
        var out = "";
        for (var index = 0; index < 3; ++index) {
            var val = input.getComponent(index);
            out += val.toPrecision(5);
            out += 'm/s, ';
        }
        out = out.substr(0, out.length - 1);
        return out;
    };
});
var numButton = ['$rootScope', '$compile',
function ($rootScope, $compile) {
        return {
            restrict: "EA",
            scope: {
                val: '=toggleVal',
                tab: '=?toggleOntab',
            },
            templateUrl: 'templates/numButton.htm',
            link: function (scope, element, attrs) {
                scope.isInput = false;

                var attrsList = {
                    "type": 'number',
                    "class": 'toggle-input '
                };
                _.each(attrs, function (value, index, list) {
                    if (index.indexOf('$') === -1 && index !== 'numButton' && index !== 'val' && index !== 'tab') {
                        var aindex = list.$attr[index];
                        if (aindex === 'class') {
                            attrsList['class'] += value;
                        } else {
                            attrsList[aindex] = value;
                        }
                    }
                });

                element.find('input.toggle-input').attr(attrsList);
                if (!scope.tab) {
                    scope.tab = scope.$parent.onTab;
                }
                //scope.val = $parent[ngModel];

                //console.log(scope, element, attrs);

                function switchElm() {
                    scope.isInput = !scope.isInput;
                    scope.$apply();
                    if (scope.isInput) {
                        element.find('input.toggle-input')[0].select();
                    }
                }
                element.find('.toggle-text').bind('click',
                    function () {
                        console.count('element.find(".toggle-text").bind("click")');
                        switchElm();
                    });
                element.find('input.toggle-input').bind('keydown', function (event) {
                    if (event.keyCode === 13 || event.keyCode === 9) {
                        event.stopPropagation();
                        event.preventDefault();
                        this.blur();

                        if (event.keyCode === 9) {
                            if (typeof scope.tab === "function") {
                                scope.tab(element, event.shiftKey);
                            }
                        }
                    }
                });
                element.find('input.toggle-input').bind('blur',
                    function () {
                        console.count('element.find("input.toggle-input").bind("blur")');
                        switchElm();
                    });
            }
        };
}];
app.directive('numButton', numButton);
app.directive('toggleInput', numButton);

function SetupElements(element) {
    var selector = "#camAngle",
        value = 0,
        min = 0,
        max = Math.PI,
        step = (Math.PI / 6) / 12;

    for (var i = 1; i <= 3; ++i) {
        var elem = element.find(selector + i);
        elem.attr('value', value);
        elem.attr('min', min);
        elem.attr('max', max);
        elem.attr('step', step);
    };

}

function hasParentClass(e, classname) {
    if (e === document) return false;
    if (classie.has(e, classname)) {
        return true;
    }
    return e.parentNode && hasParentClass(e.parentNode, classname);
}
app.directive('gControls', ['$document', '$rootScope', 'gObject', 'graphics', 'force',
        function ($document, $rootScope, gObject, graphics, force) {
        return {
            restrict: "EA",
            templateUrl: "templates/controls.htm",
            replace: true,
            link: function (scope, element, attrs) {
                SetupElements(element);
                var angle = new THREE.Vector3(0, 0, 0),
                    container = $document.find("#st-container"),
                    pusher = container.find(".st-pusher");
                scope.selectedObject = 0;
                scope.gObject = gObject;
                scope.graphics = graphics;

                function angleGetter(angleComponent, newAngle) {
                    if (angular.isDefined(newAngle)) {
                        angle[angleComponent] = newAngle;
                        graphics.rotateCameraAroundSelected(angle);
                    } else
                        return angle[angleComponent];
                }
                scope.angleX = _.partial(angleGetter, 'x');
                scope.angleY = _.partial(angleGetter, 'y');
                scope.angleZ = _.partial(angleGetter, 'z');

                scope.graphics = graphics;

                scope.selectObject = function (gobj, index) {
                    console.log(gobj, index);
                    var lastObject = graphics.selectedObject,
                        newObject = gobj;
                    if (scope.selectedObject === index) {
                        scope.selectedObject = -1;
                        newObject = null;
                    } else {
                        scope.selectedObject = index;
                    }
                    $rootScope.$broadcast('controls.selectObject', newObject, lastObject);
                    //Quick way of setting a vector to 0;
                    angle.multiplyScalar(0);
                    graphics.rotateCameraAroundSelected(angle);
                };
                $rootScope.$on('graphics.clickObject', function (event, object) {
                    scope.selectObject(object, gObject.getId(object));
                    $rootScope.$apply();
                });
                scope.onTab = function (element, isPrev) {
                    var ret = isPrev ? element.prev() : element.next();
                    ret.find('.num-text').click();
                };
                scope.objectCreate = function () {
                    gObject.create(new THREE.Vector3(), 1, new THREE.Vector3());
                };
                scope.objectRemove = function (gobj) {
                    gObject.remove(gobj);
                };
                scope.Start = function () {
                    //var first = gObject.create(new THREE.Vector3(0, 0, 0), 2000000, new THREE.Vector3(0, 0, 0));
                    //gObject.create(new THREE.Vector3(1000, 0, 0), 20000, new THREE.Vector3(0, 25, 0));
                    //gObject.create(new THREE.Vector3(1150, 0, 0), 200, new THREE.Vector3(0, 50, 0));
                    // var sun = gObject.create(new THREE.Vector3(0, 0, 0), 1.989E30, new THREE.Vector3(0, 0, 0)),
                    /*var earthDistanceFromSun = 1.496e8, //149,600,000,000 or 1.496e11
                        earthMass = 5.972e18, //5.972e21

                        moonDistanceFromEarth = 3.78e6, //3,780,000,000 or 3.78e9
                        moonDistanceFromSun = earthDistanceFromSun + moonDistanceFromEarth,
                        moonMass = 7.34767309e16, // 7.34767309e19
                        //30000
                        earth = gObject.create(new THREE.Vector3(0, 0, 0), earthMass, new THREE.Vector3(0, 0, 0)),
                        //31022
                        moon = gObject.create(new THREE.Vector3(moonDistanceFromEarth, 0, 0), moonMass, new THREE.Vector3(0, 1.022, 0));
                    scope.selectObject(earth, 0);*/
                    var obj1 = gObject.create(new THREE.Vector3(-200, 0, 0), 2000000, new THREE.Vector3(0, 0, 0)),
                        //obj2 = gObject.create(new THREE.Vector3(200, 0, 0), 2000000, new THREE.Vector3(0, -200, 0)),
                        obj3 = gObject.create(new THREE.Vector3(0, 0, 0), 2000, new THREE.Vector3(0, 200, 0));
                        
                    //scope.selectObject(obj1, 0);
                    //setTimeout(force.Pause, 20000);
                    graphics.Start();
                    force.Start();
                    return true;
                };
                scope.Stop = function () {
                    gObject.removeAll();
                    graphics.Stop();
                    force.Stop();
                    return false;

                };

                function setupCSS(name, trueClass, falseClass, trueText, falseText) {

                    var boolIndex = "is" + name;
                    scope[boolIndex] = false;
                    scope[name + "BtnClass"] = function () {
                        return scope[boolIndex] ? trueClass : falseClass;
                    };
                    scope[name + "BtnText"] = function () {
                        return scope[boolIndex] ? trueText : falseText;
                    }
                }

                setupCSS('Start', 'btn-danger', 'btn-primary', 'Stop', 'Start');
                setupCSS('PauseForce', 'btn-info', 'btn-warning', 'Unpause Force', 'Pause Force');
                setupCSS('PauseGraphics', 'btn-info', 'btn-warning', 'Unpause Graphics', 'Pause Graphics');


                scope.toggleStart = function ($event, Pause) {
                    if ($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }
                    console.log(Pause);
                    if (typeof Pause !== 'undefined' && Pause === scope.isStart)
                        return Pause;

                    if (scope.isStart) {
                        scope.togglePauseForce(null, false);
                        scope.togglePauseGraphics(null, false);
                        scope.Stop();
                    } else {
                        scope.Start();
                    }
                    return scope.isStart = !scope.isStart
                }

                scope.togglePauseForce = function ($event, Pause) {
                    if ($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }
                    if (typeof Pause !== 'undefined' && Pause === scope.isPauseForce)
                        return Pause;

                    if (scope.isPauseForce)
                        force.Unpause();
                    else
                        force.Pause();

                    return scope.isPauseForce = !scope.isPauseForce;

                };
                scope.togglePauseGraphics = function ($event, Pause) {
                    if ($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                    }
                    if (typeof Pause !== 'undefined' && Pause === scope.isPauseGraphics)
                        return Pause;

                    if (scope.isPauseGraphics)
                        graphics.Unpause();
                    else
                        graphics.Pause();

                    return scope.isPauseGraphics = !scope.isPauseGraphics;
                };
                var menuTounge = element.find('.menu-tounge'),
                    menuToungeOver = function (e) {
                        if (!hasParentClass(e.target, 'st-menu'))
                            menuTounge.addClass('menu-over');
                    },
                    menuToungeOut = function (e) {
                        if (!hasParentClass(e.target, 'st-menu'))
                            menuTounge.removeClass('menu-over');
                    };

                menuTounge.mouseover(menuToungeOver).mouseout(menuToungeOut);
                menuTounge.find('button').mouseover(function (e) {
                    menuTounge.addClass('menu-over-btn');
                }).mouseout(function (e) {
                    menuTounge.removeClass('menu-over-btn');
                });

                scope.openMenu = function ($event) {

                    if (!container.hasClass('st-menu-open')) {
                        if ($event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                        }
                        container.removeClass().addClass('st-container st-effect-3'); // clear
                        setTimeout(function () {
                            container.addClass('st-menu-open');
                            menuTounge.removeClass('menu-over menu-over-btn');
                        }, 25);
                        menuTounge.on('click.menu', scope.closeMenu);
                        $document.on('click.menu', scope.closeMenu);
                        $document.on('mouseover.menu', menuToungeOver);
                        $document.on('mouseout.menu', menuToungeOut);
                    }
                }
                scope.closeMenu = function ($event) {

                    if (!hasParentClass($event.target, 'st-menu')) {
                        if ($event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                        }
                        container.removeClass('st-menu-open');
                        menuTounge.removeClass('menu-over menu-over-btn');

                        menuTounge.off('click.menu');
                        $document.off('click.menu');
                        $document.off('mouseover.menu');
                        $document.off('mouseout.menu');
                    }
                }
                element.on('click', scope.openMenu);


                window.Start = scope.Start;
                window.Stop = scope.Stop;
            }
        };

            }]);
app.controller('gController', ['$scope', '$window', '$document', 'graphics', 'force', 'gObject',
            function ($scope, $window, $document, Graphics, Force, gObject) {
        //I don't know what to do with this, maybe I should remove it.
        $scope.testVal = 0;
        $scope.testVal2 = 0;
        $scope.onTab = function (element, isPrev) {
            var ret = isPrev ? element.prev() : element.next();
            ret.find('span.num-text').click();
        }
        $scope.$on('graphics.initialize', function (event, data) {
            var canvas = $document.find('canvas');
            canvas.on('click.controller', function ($event) {
                var vector = new THREE.Vector3(($event.clientX / $window.innerWidth) * 2 - 1, -($event.clientY / $window.innerHeight) * 2 + 1, 0.5);
                Graphics.click(vector);
            });
        });
}]);