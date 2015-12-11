var angular = require('angular');

module.exports = angular.module('KSTool.config', [])

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
            template: '<k-login></k-login>'
        })
        .state('nav', { // Just a container with the nav bar & headers
            abstract: true,
            template: '<k-nav></k-nav>'
        })
        .state('nav.home', { // The actual default homepage
            url: '/home',
            template: '<k-home></k-home>'
        })
        .state('nav.addwords', {
            url: '/addwords',
            template: '<k-add-words></k-add-words>'
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
