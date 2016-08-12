'use strict';


var _ = require('lodash');

function $RootScopeProvider() {

    this.$get = function () {

        function Scope() {
            this.$$watchers = [];

        }

        function initWatchVal() {
        }

        Scope.prototype.$watch = function (watchFn, listenerFn) {
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function () {
                },
                last: initWatchVal
            };
            this.$$watchers.push(watcher);
        };

        Scope.prototype.$digest = function () {
            var self = this;
            var newValue, oldValue;
            _.forEach(this.$$watchers, function (watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;
                if (newValue !== oldValue) {
                    watcher.last = newValue;
                    watcher.listenerFn(newValue,
                        (oldValue === initWatchVal ? newValue : oldValue),
                        self);
                }
            });
        };

        var $rootScope = new Scope();
        return $rootScope;
    };
}

module.exports = [$RootScopeProvider];
