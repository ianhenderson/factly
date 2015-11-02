var angular = require('angular');

require('./services');
require('./config');
require('./directives');

angular.module('KSTool', [
    require('angular-ui-router'),
    // require('angular-material'),
    require('angular-sanitize')
]);

