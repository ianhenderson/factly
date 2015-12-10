var angular = require('angular');

module.exports = angular.module('KSTool.directives', [])
  .directive('kAddWords', require('./k-addwords'))
  .directive('kHome', require('./k-home'))
  .directive('kLogin', require('./k-login'))
  .directive('kNav', require('./k-nav'));
