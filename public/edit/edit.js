angular.module('app.edit', ['app.facts'])
.controller('editCtrl', function($scope, data){
  
  $scope.getAllFacts = data.getAllFacts;

  $scope.addFact = function(){
    var newFact = {fact: $scope.fact};
    data.addFact(newFact);
    $scope.fact = '';
  };

  $scope.deleteFact = function(i){
    data.deleteFact(i);
  };
});