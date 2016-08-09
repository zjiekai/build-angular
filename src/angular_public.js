var setupModuleLoader = require('./loader');

function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module('ng', []);
    ngModule.provider('$filter', require)
}
