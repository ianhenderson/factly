var angular = require('angular');

module.exports = angular.module('KSTool', [])

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