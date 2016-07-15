'use strict';

var setupModuleLoader = require('../src/loader');

describe('injector', function() {

    // pg407
    beforeEach(function() {
        delete window.angular;
        setupModuleLoader(window);
    });

    // pg408
    it('has a constant that has been registered to a module', function() {

    });

    // pg419
    it('overrides dependencies with locals when invoking', function() {
        
    });
});
