'use strict';

var setupModuleLoader = require('../src/loader');

describe('setupModuleLoader', function() {

    // pg401
    it('exposes angular on the window', function() {
        setupModuleLoader(window);
        expect(window.angular).toBeDefined();
    });
});
