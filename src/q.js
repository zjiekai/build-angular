'use strict';

function $QProvider() {

    this.$get = ['$rootScope', function($rootScope) {

        function processQueue(state) {
            state.pending(state.value);
        }

        function scheduleProcessQueue(state) {
            $rootScope.$evalAsync(function() {
                
            });
        }

        function Promise() {
            this.$$state = {};
        }

        Promise.prototype.then = function(onFulfilled) {
            this.$$state.pending = onFulfilled;

        };

        function Deferred() {
            this.promise = new Promise();
        }

        Deferred.prototype.resolve = function(value) {
            this.promise.$$state.pending(value);
        };

        function defer() {
            return new Deferred();
        }

        return {
            defer: defer
        };

    }];
}

module.exports = [$QProvider];
