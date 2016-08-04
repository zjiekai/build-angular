'use strict';

var _ = require('lodash');

function createInjector(modulesToLoad, strictDi) {
    var INSTANTIATING = {};

    var providerCache = {};
    var instanceCache = {};
    var loadedModules = {};
    var path = [];

    strictDi = (strictDi === true);



    var $provide = {
        constant: function(key, value) {
            instanceCache[key] = value;
        },
        provider: function(key, provider) {
            if (_.isArray(provider)) {
                provider = instantiate(provider);
            }
            providerCache[key + 'Provider'] = provider;
        }
    };

    function annotate(fn) {
        if (_.isArray(fn)) {
            return fn.slice(0, fn.length-1);
        } else if (fn.$inject) {
            return fn.$inject;
        } else {
            if (strictDi) {
                throw 'fn is not using explicit annotation';
            }
        }
    }

    function getService(name) {
        if (instanceCache.hasOwnProperty(name)) {
            if (instanceCache[name] === INSTANTIATING) {
                throw new Error('Circular dependency found: ' +
                    name + ' <- ' + path.join(' <- '));
            }
            return instanceCache[name];
        } else if (providerCache.hasOwnProperty(name)) {
            return providerCache[name];
        } else if (providerCache.hasOwnProperty(name + 'Provider')) {
            path.unshift(name);
            instanceCache[name] = INSTANTIATING;
            try {
                var provider = providerCache[name + 'Provider'];
                var instance = instanceCache[name] = invoke(provider.$get, provider);
                return instance;
            } finally {
                path.shift();
                if (instanceCache[name] === INSTANTIATING) {
                    delete instanceCache[name];
                }
            }
        }
    }

    function invoke(fn, self, locals) {
        var args = _.map(annotate(fn), function(token) {
            if (_.isString(token)) {
                return locals && locals.hasOwnProperty(token) ?
                    locals[token] :
                    getService(token);
            } else {
                throw 'Incorrect injection token! Expected a string, got ' + token;
            }
        });
        if (_.isArray(fn)) {
            fn = _.last(fn);
        }
        return fn.apply(self, args);
    }

    function instantiate(Type) {
        var instance = {};
        invoke(Type, instance);
        return instance;

    }

    _.forEach(modulesToLoad, function loadModule(moduleName) {
        if (!loadedModules.hasOwnProperty(moduleName)) {
            loadedModules[moduleName] = true;
            var module = window.angular.module(moduleName);
            _.forEach(module.requires, loadModule);
            _.forEach(module._invokeQueue, function (invokeArgs) {
                var method = invokeArgs[0];
                var args = invokeArgs[1];
                $provide[method].apply($provide, args);
            });
        }
    });

    return {
        has: function(key) {
            return instanceCache.hasOwnProperty(key) ||
                providerCache.hasOwnProperty(key + 'Provider');
        },

        get: getService,

        annotate: annotate,

        invoke: invoke,

        instantiate: instantiate
    };
}

module.exports = createInjector;
