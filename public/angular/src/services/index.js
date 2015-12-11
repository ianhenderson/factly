var angular = require('angular');

module.exports = angular.module('KSTool.services', [])
  .factory('LocalStorage', require('./localstorage'))
  .factory('AuthService', require('./authservice'))
  .factory('K', require('./k'))
  .factory('Toast', require('./toast'));
