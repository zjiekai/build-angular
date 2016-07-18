'use strict';

function setupModuleLoader(window) {

    var ensure = function(obj, name, factory) {
        return obj[name] || (obj[name] = factory());
    };

    var angular = ensure(window, 'angular', Object);

    var createModule = function(name, requires, modules) {
        var invokeQueue = [];
        var moduleInstance = {
            name: name,
            requires: requires,
            constant: function(key, value) {
                invokeQueue.push(['constant', [key, value]]);
            },
            _invokeQueue: invokeQueue
        };
        modules[name] = moduleInstance;
        return moduleInstance;
    };

    var getModule = function(name, modules) {
        return modules[name];
    };

    ensure(angular, 'module', function() {
        var modules = {};
        return function(name, requires) {
            if (requires) {
                return createModule(name, requires, modules);
            } else {
                return getModule(name, modules);
            }
        };
    });
}

module.exports = setupModuleLoader;
