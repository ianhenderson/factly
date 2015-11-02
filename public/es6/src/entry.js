var $ = require('./utils');
var App = require('./app');

$.on(document, 'DOMContentLoaded', function(e){
  App.init();
});