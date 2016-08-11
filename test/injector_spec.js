'use strict';

var setupModuleLoader = require('../src/loader');
var createInjector = require('../src/injector');
var _ = require('lodash');

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
    
    it('instantiates an annotated constructor function', function() {
        var module = window.angular.module('myModule', []);
        module.constant('a', 1);
        module.constant('b', 2);
        var injector = createInjector(['myModule']);

        function Type(one, two) {
            this.result = one + two;
        }

        Type.$inject = ['a', 'b'];

        var instance = injector.instantiate(Type);
        expect(instance.result).toBe(3);
    });

    //pg433
    it('uses the prototype of the constructor when instantiating', function() {

    });

    it('supports locals when instantiating', function() {

    });

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
    it('injects the $get method of a provider', function() {
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

    //pg439
    it('injects the $get method of a provider lazily', function() {
        var module = window.angular.module('myModule', []);
        module.provider('b', {
            $get: ['a', function(a) {
                return a + 2;
            }]
        });
        module.provider('a', {$get: _.constant(1)});

        var injector = createInjector(['myModule']);
        expect(injector.get('b')).toBe(3);
    });

    //pg442
    it('instantiates a dependency only once', function() {
        var module = window.angular.module('myModule', []);
        module.provider('a', {$get: [function() {return {}; }]});

        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(injector.get('a'));
    });

    //pg443 circular dependency
    it('notifies the user about a circular dependency', function() {
        var module = window.angular.module('myModule', []);
        module.provider('a', {$get: ['b', function(b) {}]});
        module.provider('b', {$get: ['c', function(c) {}]});
        module.provider('a', {$get: ['a', function(a) {}]});

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.get('a');
        }).toThrowError();
    });

    it('cleans up the circular marker when instantiation fails', function() {
        var module = window.angular.module('myModule', []);
        module.provider('a', {$get: function() {
            throw 'Failing instantiation';
        }});

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.get('a');
        }).toThrow('Failing instantiation');
        expect(function() {
            injector.get('a');
        }).toThrow('Failing instantiation');
    });

    //pg445
    it('notifies the user about a circular dependency', function() {
        var module = window.angular.module('myModule', []);
        module.provider('a', {$get: ['b', function(b) {}] });
        module.provider('b', {$get: ['c', function(c) {}] });
        module.provider('c', {$get: ['a', function(a) {}] });

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.get('a');
        }).toThrowError('Circular dependency found: a <- c <- b <- a');
    });

    //pg447 Provider Constructors
    it('instantiates a provider if given as a constructor function', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = [function() { return 42; }];
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(42);
    });


    it('injects the given provider constructor function', function() {
        var module = window.angular.module('myModule', []);

        module.constant('b', 2);
        module.provider('a', ['b', function AProvider(b) {
            this.$get = function() { return 1 + b; };
        }]);

        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(3);
    });

    //pg448
    it('injects another provider to a provider constructor function', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            var value = 1;
            this.setValue = function(v) { value = v; };
            this.$get = function() { return value; };
        }]);

        module.provider('b', ['aProvider', function BProvider(aProvider) {
            aProvider.setValue(2);
            this.$get = function() { };
        } ]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(2);
    });

    //pg450
    it('does not inject an instance to a provider constructor function', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = function() { return 1; };
        }]);

        module.provider('b', ['a', function BProvider(a) {
            this.$get = function() { return a; };
        } ]);

        expect(function() {
            createInjector(['myModule']);
        }).toThrow();

    });

    it('does not inject a provider to a $get function', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = [function() { return 1; }];
        }]);
        module.provider('b', [function BProvider() {
            this.$get = ['aProvider', function(aProvider) {return aProvider.$get();}];
        }]);

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.get('b');
        }).toThrow();
    });

    it('does not inject a provider to invoke', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = [function() { return 1; }];
        }] );

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.invoke(['aProvider', function(aProvider) {}]);
        }).toThrow();
    });

    it('does not give access to providers through get', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = [function() { return 1; }];
        }]);

        var injector = createInjector(['myModule']);
        expect(function() {
            injector.get('aProvider');
        }).toThrow();
    });

    //pg458
    it('registers constants first to make them available to providers', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', ['b', function AProvider(b) {
            this.$get = function() { return b; };
        }]);
        module.constant('b', 42);

        var injector = createInjector(['myModule']);
        expect(injector.get('a')).toBe(42);
    });

    //pg462
    it('allows injecting the instance injector to $get', function() {
        var module = window.angular.module('myModule', []);

        module.constant('a', 42);
        module.provider('b', [function BProvider() {
            this.$get = ['$injector', function($injector) {
                return $injector.get('a');
            }];
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('b')).toBe(42);
    });

    //pg463
    it('allows injecting the provider injector to provider', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.value = 42;
            this.$get = [function() { return this.value; }];
        }]);

        module.provider('b', ['$injector', function BProvider($injector){
            var aProvider = $injector.get('aProvider');
            this.$get = [function() {
                return aProvider.value;
            }];
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('b')).toBe(42);
    });

    //pg464 $provide
    it('allows injecting the provider injector to provider', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', ['$provide', function AProvider($provide) {
            $provide.constant('b', 2);
            this.$get = ['b', function(b) { return 1 + b; }];
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(3);
    });

    it('does not allow injecting the $provide servie to $get', function() {
        var module = window.angular.module('myModule', []);

        module.provider('a', [function AProvider() {
            this.$get = ['$provide', function($provide) {  }];
        }]);

        var injector = createInjector(['myModule']);

        expect(function() {
            injector.get('a');
        }).toThrow();
    });



    //pg465 Config
    it('runs config blocks when the injector is created', function() {
        var module = window.angular.module('myModule', []);

        var hasRun = false;
        module.config(function() {
            hasRun = true;
        });

        createInjector(['myModule']);

        expect(hasRun).toBe(true);
    });

    it('injects config blocks with provider injector', function() {
        var module = window.angular.module('myModule', []);

        module.config(['$provide', function($provide) {
            $provide.constant('a', 42);
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(42);
    });

    it('allows registering config blocks before providers', function() {
        var module = window.angular.module('myModule', []);

        module.config(['aProvider', function(aProvider) { }]);
        module.provider('a', [function() {
            this.$get = _.constant(42);
        }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(42);
    });

    //pg471
    it('runs run blocks when the injector is created', function() {

    });

    it('injects run blocks with the instance injector', function() {

    });

    it('configures all modules before running any run blocks', function() {

    });

    /*
     * Config blocks are executed during module loading and
     * run blocks are executed after all modules loaded
     */

    //pg473 Function Modules

    //pg476 Hash Key

    //pg484 Factories

    it('allows registering a factory', function() {

    });

    it('injects a factory function with instances', function() {
        var module = window.angular.module('myModule', []);

        module.factory('a', [function() {return 1; }]);
        module.factory('b', ['a', function(a) { return a + 2; }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('b')).toBe(3);
    });

    it('only calls a factory function once', function() {
        var module = window.angular.module('myModule', []);

        module.factory('a', [function() {return {}; }]);

        var injector = createInjector(['myModule']);

        expect(injector.get('a')).toBe(injector.get('a'));
    });

    //pg487 Values

    //pg490 Services

    //pg493 Decorators
});
