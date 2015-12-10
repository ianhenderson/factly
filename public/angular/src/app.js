var angular = require('angular');

angular.module('KSTool', [
    require('angular-ui-router'),
    require('angular-animate'),
    require('angular-aria'),
    require('angular-material'),
    require('angular-sanitize'),
    require('./services').name,
    require('./config').name,
    require('./controllers').name,
    require('./directives').name
]);
