var moduleName = "gravitySimulator";
describe("Module Exists", function () {
    it(moduleName, function () {
        var app = module(moduleName);
        expect(app).toBeDefined();
    });

});
describe("Provider Exists", function () {
    var $compile,
        $rootScope,
        $window,
        $document;
    // Load the myApp module, which contains the directive
    beforeEach(module(moduleName));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$compile_, _$rootScope_, _$window_, _$document_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $window = _$window_;
        $document = _$document_;
    }));

    beforeEach(function () {
        jasmine.addMatchers({
            toBeNumber: function () {
                return {
                    compare: function (actual, isFinite) {
                        var pass = isFinite ? Number.isFinite(actual) : !Number.isNAN(actual),
                            message = actual.toString(10);

                        if (pass)
                            message += " is a";
                        else
                            message += " is not a";

                        if (isFinite)
                            message += " finite";

                        return { pass: pass,  message: message + " number."};
                    }
                };
            }
        });
    });

    it('Service: gObject', function () {
        var gObject = $service('gObject');
        expect(gObject).toBeDefined();
    });
    it('Service: force', function () {
        var force = $service('force', {
            gObject: gObject
        });
        expect(force).toBeDefined();
        expect(force.G).toBeDefined();
    });
    it('Service: graphics', function () {
        var graphics = $service('graphics');
        expect(graphics).toBeDefined();
    });
    it('Directive: gControls', function () {
        var gControls = $directive('gControls');
        expect(gControls).toBeDefined();
    });
    it('Controller: gController', function () {
        var gController = $directive('gController');
        expect(gController).toBeDefined();
    });
    it('Filter: numb', function () {
        var numb = $filter('numb');
        expect(numb).toBeDefined();
    });
    it('Filter: vector3', function () {
        var vector3 = $filter('vector3');
        expect(vector3).toBeDefined();;
    });
    it('Filter: velocity', function () {
        var velocity = $filter('velocity');
        expect(velocity).toBeDefined();;
    });
});

n1 < 0
n2 < 0
n3 < 0
n4 < 0
n5 < 0

n1 >> 31
n2 >> 31
n3 >> 31
n4 >> 31
n5 >> 31


n1 > 0;
n1 > 0;
n1 > 0;
n1 > 0;
n1 > 0;

!n1 >> 31;
!n1 >> 31;
!n1 >> 31;
!n1 >> 31;
!n1 >> 31;
