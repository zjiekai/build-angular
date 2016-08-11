'use strict';

function setupModuleLoader(window) {

    var ensure = function(obj, name, factory) {
        return obj[name] || (obj[name] = factory());
    };

    var angular = ensure(window, 'angular', Object);

    var createModule = function(name, requires, modules) {
        var invokeQueue = [];
        var configBlocks = [];

        var invokeLater = function(service, method, arrayMethod, queue) {
            return function() {
                queue = queue || invokeQueue;
                queue[arrayMethod || 'push']([service, method, arguments]);
                return moduleInstance;
            };
        };

        var moduleInstance = {
            name: name,
            requires: requires,
            constant: invokeLater('$provide', 'constant', 'unshift'),
            provider: invokeLater('$provide', 'provider', 'push'),
            factory: invokeLater('$provide', 'factory', 'push'),
            config: invokeLater('$injector', 'invoke', 'push', configBlocks),
            _invokeQueue: invokeQueue,
            _configBlocks: configBlocks
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
