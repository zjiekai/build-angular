'use strict';

var _ = require('lodash');

function createInjector(modulesToLoad, strictDi) {
    var INSTANTIATING = {};

    var providerCache = {};
    var providerInjector = createInternalInjector(providerCache, function() {
        throw 'Unknown provider: ' + path.join(' <- ');
    });
    providerCache.$injector = providerInjector;
    
    var instanceCache = {};
    var instanceInjector = createInternalInjector(instanceCache, function(name) {
        var provider = providerInjector.get(name + 'Provider');
        return instanceInjector.invoke(provider.$get, provider);
    });
    instanceCache.$injector = instanceInjector;

    var loadedModules = {};
    var path = [];

    strictDi = (strictDi === true);



    providerCache.$provide = {
        constant: function(key, value) {
            providerCache[key] = value;
            instanceCache[key] = value;
        },
        provider: function(key, provider) {
            if (_.isArray(provider)) {
                provider = providerInjector.instantiate(provider);
            }
            providerCache[key + 'Provider'] = provider;
        },
        factory: function(key, factoryFn) {
            this.provider(key, {$get: factoryFn});
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

    function runInvokeQueue(queue) {
        _.forEach(queue, function(invokeArgs) {
            var service = providerInjector.get(invokeArgs[0]);
            var method = invokeArgs[1];
            var args = invokeArgs[2];
            service[method].apply(service, args);
        });
    }


    _.forEach(modulesToLoad, function loadModule(moduleName) {
        if (!loadedModules.hasOwnProperty(moduleName)) {
            loadedModules[moduleName] = true;
            var module = window.angular.module(moduleName);
            _.forEach(module.requires, loadModule);
            runInvokeQueue(module._invokeQueue);
            runInvokeQueue(module._configBlocks);
        }
    });

    function createInternalInjector(cache, factoryFn) {

        function getService(name) {
            if (cache.hasOwnProperty(name)) {
                if (cache[name] === INSTANTIATING) {
                    throw new Error('Circular dependency found: ' +
                        name + ' <- ' + path.join(' <- '));
                }
                return cache[name];
            } else {
                path.unshift(name);
                cache[name] = INSTANTIATING;
                try {
                    return (cache[name] = factoryFn(name));
                } finally {
                    path.shift();
                    if (cache[name] === INSTANTIATING) {
                        delete cache[name];
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

        function instantiate(Type, locals) {
            var instance = {};
            invoke(Type, instance);
            return instance;
        }

        return {
            has: function(name) {
                return cache.hasOwnProperty(name) ||
                        providerCache.hasOwnProperty(name + 'Provider');
            },
            get: getService,
            annotate: annotate,
            invoke: invoke,
            instantiate: instantiate
        };
    }

    return instanceInjector;
}

module.exports = createInjector;
