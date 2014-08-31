angular.module('app.login', ['app.facts'])
.controller('loginCtrl', function($scope, $http, data){

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
      .success(function(response, status){
        console.log(status, response);
        data.addFact(response);
      })
      .error(function(response, status){
        console.log(status, response);
      });

  };

});