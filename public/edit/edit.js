angular.module('app.edit', ['app.facts'])
.controller('editCtrl', function($scope, data){
  
  $scope.getAllFacts = data.getAllFacts;

  $scope.addFact = function(){
    data.addFact($scope.fact);
    $scope.fact = '';
  };

});