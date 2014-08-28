angular.module('app', [
  'ui.router', 
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

})
.factory('data', function($rootScope){
  var facts = [
    {q: "fact1", a: "answer1"},
    {q: "fact2", a: "answer2"},
    {q: "fact3", a: "answer3"},
  ];
  return {
    getFacts: function(){
      return facts;
    },
    addFact: function(question, answer){
      var fact = {
        q: question,
        a: answer
      }
      facts.push(fact);
    }
  };

})
.controller('mainCtrl', function($scope, data){
  $scope.addFact = function(){
    data.addFact($scope.question, $scope.answer);
  };
  $scope.getFacts = data.getFacts;
});