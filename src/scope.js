'use strict';


var _ = require('lodash');

function $RootScopeProvider() {

    this.$get = function () {

        function Scope() {
            this.$$watchers = [];

            this.$$asyncQueue = [];

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

        Scope.prototype.$digest = function() {
            var dirty;
            do {
                while (this.$$asyncQueue.length) {
                    var asyncTask = this.$$asyncQueue.shift();
                    asyncTask.scope.$eval(asyncTask.expression);
                }
                dirty = this.$$digestOnce();
            } while (dirty);
        };

        Scope.prototype.$$digestOnce = function () {
            var self = this;
            var newValue, oldValue, dirty;
            _.forEach(this.$$watchers, function (watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;
                if (newValue !== oldValue) {
                    watcher.last = newValue;
                    watcher.listenerFn(newValue,
                        (oldValue === initWatchVal ? newValue : oldValue),
                        self);
                    dirty = true;
                }
            });
            return dirty;
        };

        Scope.prototype.$eval = function(expr, locals) {
            return expr(this, locals);
        };

        Scope.prototype.$apply = function(expr) {
            try {
                return this.$eval(expr);
            } finally {
                this.$digest();
            }
        };

        Scope.prototype.$evalAsync = function(expr) {
            this.$$asyncQueue.push({
                scope: this,
                expression: expr
            });
        };

        var $rootScope = new Scope();
        return $rootScope;
    };
}

module.exports = [$RootScopeProvider];
