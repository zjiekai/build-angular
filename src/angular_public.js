var setupModuleLoader = require('./loader');

function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = window.angular.module('ng', []);

    ngModule.provider('$q', require('./q'));
}

module.exports = publishExternalAPI;
