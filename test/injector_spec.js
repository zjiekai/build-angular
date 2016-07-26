'use strict';

var setupModuleLoader = require('../src/loader');
var createInjector = require('../src/injector');

describe('injector', function() {

    // pg407
    beforeEach(function() {
        delete window.angular;
        setupModuleLoader(window);
    });

    it('can be created', function() {
        var injector = createInjector([]);
        expect(injector).toBeDefined();
    });

    // pg408
    it('has a constant that has been registered to a module', function() {
        var module = window.angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(true);
    });

    // pg409

    /*
    The modules should hold a collection of tasks that the injector
    should carry out when it loads the module.

    This collection of tasks is called the invoke queue.
     */

    it('does not have a non-registered constant', function() {
        var module = window.angular.module('myModule', []);
        var injector = createInjector(['myModule']);
        expect(injector.has('aConstant')).toBe(false);
    });
    
    it('can return a registered constant', function() {
        var module = window.angular.module('myModule', []);
        module.constant('aConstant', 42);
        var injector = createInjector(['myModule']);
        expect(injector.get('aConstant')).toBe(42);
    });

    // pg413 Requiring Other Modules
    it('loads multiple modules', function() {
        var module1 = window.angular.module('myModule', []);
        var module2 = window.angular.module('myOtherModule', []);

        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);

        var injector = createInjector(['myModule', 'myOtherModule']);

        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });
    
    it('loads the required modules of a module', function() {
        var module1 = window.angular.module('myModule', []);
        var module2 = window.angular.module('myOtherModule', ['myModule']);

        module1.constant('aConstant', 42);
        module2.constant('anotherConstant', 43);

        var injector = createInjector(['myOtherModule']);

        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('anotherConstant')).toBe(true);
    });

    // pg414
    it('loads each module only once', function() {
        window.angular.module('myModule', ['myOtherModule']);
        window.angular.module('myOtherModule', ['myModule']);

        createInjector(['myModule']);
    });

    it('invokes an annotated function with dependency injection', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        var fn = function(one, two) { return one + two; };
        fn.$inject = ['a', 'b'];

        expect(injector.invoke(fn)).toBe(3);
    });

    it('does not accept non-strings as injection tokens', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        var injector = createInjector(['myModule']);

        var fn = function(one, two) { return one + two; };
        fn.$inject = ['a', 2];

        expect(function() {
            injector.invoke(fn);
        }).toThrow();
    });

    // pg418
    it('invokes a function with the given this context', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        var injector = createInjector(['myModule']);

        var obj = {
            two: 2,
            fn: function(one) { return one + this.two; }
        };
        obj.fn.$inject = ['a'];

        expect(injector.invoke(obj.fn, obj)).toBe(3);
    });

    // pg419
    // locals: $scope $element $attrs in directive controllers
    it('overrides dependencies with locals when invoking', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        var fn = function(one, two) { return one + two; };
        fn.$inject = ['a', 'b'];

        expect(injector.invoke(fn, undefined, {b: 3})).toBe(4);
    });

    // pg420
    describe('annotate', function() {

        it('returns the $inject annotation of a function when it has one', function() {
            var injector = createInjector([]);

            var fn = function() {};
            fn.$inject = ['a', 'b'];

            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        });

        it('returns the array-style annotations of a function', function() {
            var injector = createInjector([]);
            var fn = ['a', 'b', function() {}];
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        });

        it('throws when using a non-annotated fn in strict mode', function() {
            var injector = createInjector([], true);

            var fn = function(a, b, c) { };

            expect(function() {
                injector.annotate(fn);
            }).toThrow();
        });

        it('invokes an array-annotated function with DI', function() {
            var module = window.angular.module('myModule', []);
            module.constant('a', 1);
            module.constant('b', 2);
            var injector = createInjector(['myModule']);

            var fn = ['a', 'b', function(one, two) {
                return one + two;
            }];

            expect(injector.invoke(fn)).toBe(3);
        });
    });

    //pg430 instantiate

    //pg436
    // Providers are objects that know how to make dependencies.

    it('allows registering a provider and uses its $get', function() {
        var module = window.angular.module('myModule', []);
        module.provider('a', {
            $get: function() {
                return 42;
            }
        });

        var injector = createInjector(['myModule']);

        expect(injector.has('a')).toBe(true);
        expect(injector.get('a')).toBe(42);
    });

    //pg438
    xit('injects the $get method of a provider', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        module.provider('b', {
            $get: ['a', function(a) {
                return a + 2;
            }]
        });

        var injector = createInjector(['myModule']);

        expect(injector.get('b')).toBe(3);
    });
});
