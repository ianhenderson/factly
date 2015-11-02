var angular = require('angular');

module.exports = angular.module('KSTool', [])

///////////////////// Setup & Config /////////////////////
.config(function($stateProvider, $urlRouterProvider, $httpProvider){

    // Interceptor to redirect to /login upon errors due to no session
    $httpProvider.interceptors.push(function($q, $injector){

        return {
            'responseError': function(rejection){

                // If we get a 403 error, we're assuming that it means there is no session
                if (rejection.status === 403){
                    $injector.invoke(function(AuthService){
                        AuthService.logout();
                    });
                }

                return $q.reject(rejection);
            }
       }; 
    });
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        })
        .state('nav', { // Just a container with the nav bar & headers
            abstract: true,
            templateUrl: 'partials/nav.html',
            controller: 'NavCtrl'
        })
        .state('nav.home', { // The actual default homepage
            url: '/home',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .state('nav.addwords', {
            url: '/addwords',
            templateUrl: 'partials/add-words.html',
            controller: 'AddWordsCtrl'
        })
        .state('nav.idea', {
            url: '/ideas/:id',
            templateUrl: 'partials/idea.html',
            controller: 'IdeaCtrl'
        })
        .state('nav.profile', {
            url: '/profile',
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
            AuthService.logout();
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