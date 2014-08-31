angular.module('app.login', [])
.controller('loginCtrl', function($scope, $http){

  $scope.loginUser = function(){

    // Set POST parameters for login request
    var params = {
      method: 'POST',
      url: 'api/login',
      data: {
        name: $scope.userName,
        password: $scope.userPassword
      }
    };

    // Send login request to server
    $http(params)
      .success(function(data, status){
        console.log(status, data);
      })
      .error(function(data, status){
        console.log(status, data);
      });

  };

});