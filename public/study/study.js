angular.module('app.study', ['app.facts'])
.controller('studyCtrl', function($scope, data){
  $scope.getNextFact = function(){
    $scope.currentFact = data.getNextFact();
  };
  $scope.currentFact = $scope.getNextFact();
});