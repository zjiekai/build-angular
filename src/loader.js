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
                invokeQueue.unshift(['constant', [key, value]]);
            },
            provider: function(key, provider) {
                invokeQueue.push(['provider', [key, provider]]);
            },
            _invokeQueue: invokeQueue
        };
        modules[name] = moduleInstance;
        return moduleInstance;
    };

    var getModule = function(name, modules) {
        if (modules.hasOwnProperty(name)) {
            return modules[name];
        } else {
            throw 'Module '+name+' is not available!';
        }
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
