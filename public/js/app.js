angular.module('engage', ['ui.router', 'ngMaterial'])

///////////////////// Setup & Config /////////////////////

.config(function($stateProvider, $urlRouterProvider, $httpProvider){

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        })
        .state('nav', { // Just a container with the nav bar & headers
            url: '',
            templateUrl: 'partials/nav.html',
            controller: 'NavCtrl'
        })
        .state('nav.home', { // The actual default homepage
            url: '/home',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .state('nav.ideas', {
            url: '^/ideas',
            templateUrl: 'partials/ideas.html',
            controller: 'IdeasCtrl'
        })
        .state('nav.idea', {
            url: '^/ideas/:id',
            templateUrl: 'partials/idea.html',
            controller: 'IdeaCtrl'
        })
        .state('nav.profile', {
            url: '^/profile',
            templateUrl: 'partials/profile.html',
            controller: 'ProfileCtrl'
        })
        .state('nav.profile.user', {
            url: '/:id',
            templateUrl: 'partials/profile.html',
            controller: 'ProfileCtrl'
        });

    $urlRouterProvider.otherwise('/home');
})
.run(function($rootScope, $location, LocalStorage, AuthService){
    // Listener that checks on each state change whether or not we have an auth token. If we don't, redirect to /login.
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
        var isLoggedIn = AuthService.validate();

        if (!isLoggedIn) {
            $location.path('/login');
            return;
        }

        // If trying to go to /login (while logged in already), 
        // or coming from /login (just finished AuthService.oAuthAuthorize), 
        // or navigating to the base URL (awesome.com/)
        // go /home
        if (toState.name === 'login' || fromState.name === 'login' || !toState.url) {
            $location.path('/home');
        }
    });
})

///////////////////// Factories & Services /////////////////////

.factory('LocalStorage', function($window){
    var store = $window.localStorage;

    return service = {
        set: function(key, value){
           return store.setItem(key, value);
        },
        get: function(key){
            return store.getItem(key);
        },
        remove: function(key){
            return store.removeItem(key);
        },
        clear: function(){
            return store.clear();
        }
    };
})
.factory('AuthService', function($rootScope, $q, $window, $http, $state, $location, LocalStorage){

    function parseResponse(oAuthObj) {
        for (var key in oAuthObj) {
            var value = oAuthObj[key];
            oAuthObj[key] = decodeURIComponent(value);
        }
        return oAuthObj;
    }

    return auth = {
        simpleLogin: function(username, password){

            var loginConfig = {
                method: 'POST',
                url: '/api/login',
                data: {
                    username: username,
                    password: password
                }
            };

            return $http(loginConfig)
                .then(function(response){
                    LocalStorage.set('userinfo', JSON.stringify( response.data ) );
                    console.log('Signed in: ', response.data);
                    // $state.go('nav.home');
                    $location.path('/home');
                    return response.data;
                })
                .catch(function(response){
                    console.log('Sign-in failed: ', response.data);
                    return response.data;
                });

        },
        validate: function(){ // If at any time we don't have a session on a state change, redirect to /login
            var session = LocalStorage.get('userinfo');
            var hasSession = session && JSON.parse(session).id;
            if (hasSession) {
                console.log('Logged in.');
                return true;
            } else {
                console.log('Not logged in.');
                return false;
            }
        },
        logout: function(){

            var logoutConfig = {
                method: 'POST',
                url: '/api/logout'
            };

            return $http(logoutConfig)
                .then(function(response){
                    console.log('Logged out.');
                    LocalStorage.remove('userinfo');
                    $location.path('/login');
                    return response.data;
                })
                .catch(function(response){
                    console.log('Error logging out: ', response);
                    return response.data;
                });

        },
    };
})
.factory('K', function($http, $q, LocalStorage){

    // Public methods to be used elsewhere in the app.
    return K = {
    };
})

///////////////////// Controllers /////////////////////

.controller('LoginCtrl', function($scope, AuthService){

    $scope.simpleLogin = function(){
        AuthService.simpleLogin($scope.username, $scope.password);
    };
})
.controller('NavCtrl', function($scope, $state, $mdSidenav, AuthService){
    function logout(){
        AuthService.logout();
    }

    function go(state){
        $state.go(state);
    }

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
                go('nav.home');
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Add Words',
            action: function(){
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
                logout();
                $mdSidenav('left').close();
            }
        },
    ];
})
.controller('HomeCtrl', function($scope, K){

});