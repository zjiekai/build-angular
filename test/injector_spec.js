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

    // pg419
    it('overrides dependencies with locals when invoking', function() {
        
    });
});
