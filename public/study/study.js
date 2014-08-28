angular.module('app.study', ['app.facts'])
.controller('studyCtrl', function($scope, data){
  $scope.currentFact = "Click the button below to study your facts.";
  $scope.getNextFact = function(){
    $scope.currentFact = data.getNextFact();
  };
});