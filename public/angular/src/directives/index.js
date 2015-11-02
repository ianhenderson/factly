var angular = require('angular');

module.exports = angular.module('KSTool', [])

/////////////////// Controllers /////////////////////
.controller('LoginCtrl', function($scope, AuthService, Toast){

    $scope.select = function(label){
        $scope.tabs.forEach(function(tab){
            tab.selected = (tab.title === label) ? true : false;
        });
    };

    $scope.tabs = [
        {
            title: 'Sign-in / Sign-up',
            action: AuthService.superSignIn
        },
        // {
        //     title: 'New User',
        //     action: AuthService.signupAndLogin
        // }
    ];

    $scope.submit = function(){
        var selectedTab = $scope.tabs.filter(function(tab){ return tab.selected === true; }).pop();
        selectedTab.action($scope.username, $scope.password)
            .then(function(response){
                console.log('Success: ', response);
            })
            .catch(function(response){
                Toast(response);
            });
    };
})
.controller('NavCtrl', function($scope, $state, $mdSidenav, AuthService){

    $scope.openLeftMenu = function(){
        $mdSidenav('left').toggle();
    };

    $scope.closeLeftMenu = function(){
        $mdSidenav('left').close();
    };

    $scope.navOptions = [
        {
            label: 'Review Kanji',
            action: function(){
                $state.go('nav.home');
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Add Words',
            action: function(){
                $state.go('nav.addwords');
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Settings',
            action: function(){
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Sign Out',
            action: function(){
                AuthService.logout();
                $mdSidenav('left').close();
            }
        },
    ];
})
.controller('HomeCtrl', function($scope, K){

    $scope.getNextChar = function(){
        K.getNextChar()
        .then(function(data){
            $scope.type = data;
        });
    };

})
.controller('AddWordsCtrl', function($scope, Toast, K){

    $scope.addWord = function(){
        var word = $scope.word;
        K.addWord(word, true)
        .then(function(data){
            $scope.word = '';
            Toast(data);
        });
    };

});