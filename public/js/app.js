angular.module('KSTool', ['ui.router', 'ngMaterial', 'ngSanitize'])

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
                    $location.path('/home');
                    return response.data;
                })
                .catch(function(response){
                    throw response.data;
                });

        },
        signUp: function(username, password){
            var loginConfig = {
                method: 'POST',
                url: '/api/signup',
                data: {
                    username: username,
                    password: password
                }
            };

            return $http(loginConfig)
                .then(function(response){
                    LocalStorage.set('userinfo', JSON.stringify( response.data ) );
                    return response.data;
                })
                .catch(function(response){
                    throw response.data;
                });

        },
        signupAndLogin: function(username, password){
            return auth.signUp(username, password)
                .then(function(response){
                    return auth.simpleLogin(username, password);
                })
                .catch(function(response){
                    throw response;
                });
        },
        superSignIn: function(username, password){
            return auth.simpleLogin(username, password)
                .catch(function(response){
                    return auth.signupAndLogin(username, password);
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
                    $state.go('login');
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

    function addWord(word, splitOnNewline){
        word = word.replace(/\n+/g, '\n');
        if (splitOnNewline) {
            word = word.split(/\n/);
        }
        var config = {
            method: 'POST',
            url: '/api/facts',
            data: {
                fact: word
            }
        };
        return $http(config)
            .then(function(response){
                return response.data;
            })
            .catch(function(response){
                return response.data;
            });
    }

    function getNextChar(){
        var config = {
            method: 'GET',
            url: '/api/kanji'
        };
        return $http(config)
            .then(function(response){
                var highlight = highlightKanji(response.data.kanji);
                response.data.words = response.data.words.map(highlight);
                return response.data;
            })
            .catch(function(response){
                return response.data;
            });
    }

    function wrapKanji(kanji){
        return [
            '<span class="hl">',
            kanji,
            '</span>'
        ].join('');
    }

    function highlightKanji(kanji, str){
        return function(str){
            return str.replace(kanji, wrapKanji(kanji));
        };
    }

    // Public methods to be used elsewhere in the app.
    return K = {
        addWord: addWord,
        getNextChar: getNextChar
    };
})
.factory('Toast', function($mdToast){

    function showToast(message){
        $mdToast.show(
            $mdToast.simple()
            .content(message)
            .position('bottom')
        );
    }

    return showToast;
})

///////////////////// Controllers /////////////////////

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