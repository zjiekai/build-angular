'use strict';

var _ = require('lodash');

function createInjector(modulesToLoad, strictDi) {
    var providerCache = {};
    var instanceCache = {};
    var loadedModules = {};
    strictDi = (strictDi === true);

    var $provide = {
        constant: function(key, value) {
            instanceCache[key] = value;
        },
        provider: function(key, provider) {
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
            return instanceCache[name];
        } else if (providerCache.hasOwnProperty(name + 'Provider')) {
            var provider = providerCache[name + 'Provider'];
            return invoke(provider.$get, provider);
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

        invoke: invoke
    };
}

module.exports = createInjector;
