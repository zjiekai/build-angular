'use strict';

var register = require('../src/filter').register;
var filter = require('../src/filter').filter;

describe('filter', function () {

    //pg308
    it('can be registered and obtained', function () {
        var myFilter = function () {
        };

        //pg503
        // var myFilterFactory = function () {
        //     return myFilter;
        // };
        // register('my', myFilterFactory);
        // expect(filter('my')).toBe(myFilter);
    });

    //pg503
    it('can be registered through module API', function () {
    });

});
