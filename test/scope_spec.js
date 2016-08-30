'use strict';

var publishExternalAPI = require('../src/angular_public');
var createInjector = require('../src/injector');

describe('Scope', function () {

    //pg514

    // it('can be constructed and used as an object', function () {
    //     var scope = new Scope();
    //     scope.aProperty = 1;
    //     expect(scope.aProperty).toBe(1);
    // });

    describe('digest', function () {
        var scope;
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector(['ng']).get('$rootScope');
        });

        it('calls the listener function of a watch on first $digest', function () {
            var watchFn = function () {
                return 'wat';
            };
            var listenerFn = jasmine.createSpy();
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(listenerFn).toHaveBeenCalled();
        });

        it('calls the watch function with the scope as the argument', function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () {
            };

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when the watched value changes', function () {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';

            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('calls the listener when watch value is first undefined', function () {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('calls listener with new value as old value the first time', function () {
            scope.someValue = 123;
            var oldValueGiven;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );

            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it('may have watchers that omit the listener function', function () {
            var watchFn = jasmine.createSpy();
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it('triggers chained watchers in the same digest', function () {
            //41
            scope.name = 'Jane';

            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );

            scope.$watch(
                function (scope) {
                    return scope.name;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });

    });

    describe('$eval', function() {
        //pg62
        var scope;
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector(['ng']).get('$rootScope');
        });

        it('executes $evaled function and returns result', function() {
            scope.aValue = 42;

            var result = scope.$eval(function(scope) {
                return scope.aValue;
            });

            expect(result).toBe(42);
        });

        it('passes the second $eval argument straight through', function() {
            scope.aValue = 42;

            var result = scope.$eval(function(scope, arg) {
                return scope.aValue + arg;
            }, 2);

            expect(result).toBe(44);
        });

    });

    describe('$apply', function() {
        //pg63
        var scope;
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector(['ng']).get('$rootScope');
        });

        it('executes the given function and starts the digest', function() {
            scope.aValue = 'someValue';
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$apply(function(scope) {
                scope.aValue = 'someOtherValue';
            });
            expect(scope.counter).toBe(2);
        });

    });

    describe('$evalAsync', function() {
        //pg65
        var scope;

        beforeEach(function() {
            publishExternalAPI();
            scope = createInjector(['ng']).get('$rootScope');
        });

        it('executes given function later in the same cycle', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.$evalAsync(function(scope) {
                        scope.asyncEvaluated = true;
                    });
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            );

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });
    });

    describe('$applyAsync', function() {});

    describe('$$postDigest', function() {});

    describe('$watchGroup', function() {});
});
