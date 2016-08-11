'use strict';

var filters = {};

function register(name, factory) {
    var filter = factory();
    filters[name] = filter;
    return filter;
}

function filter(name) {
    return filters[name];
}

//module.exports = {register: register, filter: filter};

//pg 499
function $FilterProvider() {
    var filters = {};

    this.register = function(name, factory) {

    };

    this.$get = function() {

    };
}

module.exports = $FilterProvider;
