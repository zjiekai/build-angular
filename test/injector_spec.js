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

    // pg419
    it('overrides dependencies with locals when invoking', function() {
        
    });


});
