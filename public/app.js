angular.module('app', [
  'ui.router', 
  'app.facts',
  'app.home',
  'app.study',
  'app.login',
  'app.edit'])
.config(function($stateProvider, $urlRouterProvider){
  
  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'home/home.html'
    })
    .state('edit', {
      url: '/edit',
      templateUrl: 'edit/edit.html'
    })
    .state('study', {
      url: '/study',
      templateUrl: 'study/study.html'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'login/login.html'
    });

});