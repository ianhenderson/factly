var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');

module.exports = function(app){
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json({limit: '2mb'}));
  app.use(cookieParser());
  app.use(express.static(__dirname + '/../public', {
    maxAge: 2592000000
  }));
};