angular.module('app.edit', ['app.facts'])
.controller('editCtrl', function($scope, data){
  $scope.addFact = function(){
    data.addFact($scope.question, $scope.answer);
  };
  $scope.getAllFacts = data.getAllFacts;
});