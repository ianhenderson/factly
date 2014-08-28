angular.module('app.edit', ['app.facts'])
.controller('editCtrl', function($scope, data){
  $scope.addFact = function(){
    data.addFact($scope.fact);
  };
  $scope.getAllFacts = data.getAllFacts;
});