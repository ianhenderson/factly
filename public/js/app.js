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
    LocalStorage.set('BASE_URL', 'https://www.devtrunk.spigit.com'); // TODO: make this settable from login page
    LocalStorage.set('CLIENT_ID', '1yVHkoF75ZDL'); 
    LocalStorage.set('CLIENT_SECRET', '');  //TODO: Inlcuding secret here would be insecure...How to specify secret when refreshing via user agent flow?

    // Listener that checks on each state change whether or not we have an auth token. If we don't, redirect to /login.
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
        var isLoggedIn = AuthService.validate();

        if (!isLoggedIn) {
            $location.path('/login');
            return;
        }

        // If trying to go to /login (while logged in already), or coming from /login (just finished AuthService.oAuthAuthorize), go /home
        if (toState.name === 'login' || fromState.name === 'login') {
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
                .success(function(data, status, headers, config){
                    LocalStorage.set('userinfo', JSON.stringify( data.userinfo ) );
                    console.log('Signed in: ', data);
                    return data;
                })
                .error(function(data, status, headers, config){
                    console.log('Sign-in failed: ', data);
                    return data;
                });

        },
        samlLogin: function(){},
        oAuthAuthorize: function(){

            return $q(function(resolve, reject){

                var authorizeURL =  LocalStorage.get('BASE_URL') + 
                                    '/oauth/authorize?response_type=token&client_id=' + 
                                    LocalStorage.get('CLIENT_ID') + 
                                    '&redirect_uri=' + 
                                    LocalStorage.get('BASE_URL') + 
                                    '/html/api/oauthRedirect.html';

                var dimensions = 'top=100,left=100,width=400,height=400';
                var popup = $window.open(authorizeURL, '', dimensions);

                popup.onload = function(e){
                    var hash = popup.location.hash.slice(1);
                    var params = hash.split('&');
                    var oAuth = {};
                    popup.close();
                    angular.forEach(params, function(param){
                        var parts = param.split('=');
                        oAuth[parts[0]] = parts[1];
                    });
                    LocalStorage.set('oAuth', JSON.stringify( parseResponse(oAuth) ) );
                    resolve(oAuth);
                    $state.go('nav.home');
                };

            });

        },
        oAuthRefreshToken: function(){

            var oAuth = JSON.parse( LocalStorage.get('oAuth') );

            var refreshConfig = {
                method: 'POST',
                url: LocalStorage.get('BASE_URL') + '/oauth/token',
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: oAuth.refresh_token,
                    client_id: LocalStorage.get('CLIENT_ID'),
                    client_secret: LocalStorage.get('CLIENT_SECRET')
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: {} // Without this property, Angular will strip the 'Content-Type' header above (see Angular v1.3.9 source line 9317)
            };

            return $q(function(resolve, reject){
                $http(refreshConfig)
                    .success(function(data){
                        oAuth.access_token = data.access_token;
                        LocalStorage.set( 'oAuth', JSON.stringify( parseResponse(oAuth) ) );
                        resolve(oAuth);
                    })
                    .error(function(data){
                        reject(data);
                    });
            });

        },
        validate: function(){ // If at any time we don't have an access_token on a state change, redirect to /login
            var oAuth = LocalStorage.get('oAuth');
            var hasToken = oAuth && JSON.parse(oAuth).access_token;
            if (hasToken) {
                console.log('Logged in.');
                return true;
            } else {
                console.log('Not logged in.');
                return false;
            }
        },
        logout: function(){
            LocalStorage.remove('oAuth');
            LocalStorage.remove('userinfo');
            console.log('Logged out.');
            $location.path('/login');
        },
    };
})
.factory('Engage', function($http, $q, LocalStorage){

    // Mapping function to generate config object for $http() and list of postprocessing fn's after request succeeds.
    function configMap(obj) {

        var userinfo = JSON.parse(LocalStorage.get('userinfo'));
        var currentUserId = userinfo.userId;

        var mapping = {
            // obj === {
            //     type: 'ideas', (MUST)
            //     id: <int> (OPT) [id of community, defaults to id of currently logged in]
            // }
            ideas: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/widget/rest/RestWidgetService/ideas',
                    params: {   // 'fields', 'pageSize', 'sort', 'version', 'after'
                        pageSize: obj.pageSize || null,
                    }
                },
                postProcessing: function(data, status, headers, config){
                    data = fn2(data);
                    data = setIdeaImagePath(data);
                    return data;
                }
            },
            idea: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/widget/rest/RestWidgetService/ideas',
                    params: {   // 'fields', 'pageSize', 'sort', 'version', 'after'
                        ideaid: obj.id
                    }
                },
                postProcessing: function(data, status, headers, config){
                    data = fn2(data);
                    return data;
                }
            },
            // obj === {
            //     type: 'challenges', (MUST)
            //     id: <int> (OPT) 
            // }
            challenges: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/api/ds1/comm-1/inquiries',
                    params: {}
                },
                postProcessing: function(data, status, headers, config){
                    data = fn1(data);
                    return data;
                }
            },
            // obj === {
            //     type: 'profile', (MUST)
            //     id: <int> (OPT) 
            // }
            profile: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/widget/rest/RestWidgetService/profile',
                    params: {   // 'fields', 'pageSize', 'sort', 'version', 'after'
                        userid: obj.id || null,
                        pageSize: obj.pageSize || null,
                    }
                },
                postProcessing: function(data, status, headers, config){
                    data = fn2(data);
                    return data;
                }
            },
            // obj === {
            //     type: 'communities', (MUST)
            //     id: <int> (OPT) 
            // }
            communities: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/api/ds1/tenant-1/communities'
                },
                postProcessing: function(data, status, headers, config){
                    data = fn1(data);
                    return data;
                }
            },
            config: {
                httpConfig: {
                    method: 'GET',
                    url: LocalStorage.get('BASE_URL') + '/widget/rest/RestWidgetService/features/config'
                },
                postProcessing: function(data, status, headers, config){
                    data = fn2(data);
                    return data;
                }
            },
        };

        return mapping[obj.type];
    }

    // Postprocessing helper functions
    function fn1(data){
        return  data.results[0].data;
    }
    function fn2(data){
        return data.data;
    }
    function setIdeaImagePath(data){
        data.forEach(function(idea){
            if (!RegExp('/upload').test(idea.ideaImagePath)) { // Check whether prop exists, and whether it is a valid path
                idea.ideaImagePath = '/img/idea_image_default.png';
            }
        });
        return data;
    }

    // Error handler for when a request fails.
    function errorHandler(data, status, headers, config){} // TODO

    // Pager class. We create an instance of this when we want to lazy-load just a pageful at a time.
    function Pager(obj){
        this.argsObj = obj;
        this.collection = [];
        this.pageNum = 0;
        this.total = null;
        this.finished = false;
        this.nextPage(); // Get first page of results
    }
    Pager.prototype = {
        nextPage: function(){
            // Break out if we already have all the records
            if (this.finished) {
                return;
            }

            var self = this;
            var httpConfig = configMap(this.argsObj).httpConfig;
            var postProcessing = configMap(this.argsObj).postProcessing;
            httpConfig.params.pageNum = this.pageNum++;

            $http(httpConfig)
                .success(function(data, status, headers, config){

                    // Set total collection size:
                    if (!self.total) {
                        var de = data.dataExtention; // obj holding metadata
                        var tk = Object.keys(de).filter(function(v){return /total/.test(v);})[0]; // "total key". Is it de.totalIdeas, de.totalComments, de.totalFoobars...?
                        var total = de[tk]; // total # of items in this list
                        self.total = total;
                    }

                    // Process results and append to collection
                    var newData = postProcessing(data, status, headers, config);
                    self.collection = self.collection.concat(newData);
                    if (self.collection.length >= self.total) {
                        self.finished = true;
                    }
                })
                .error(errorHandler);
        }
    };

    // Public methods to be used elsewhere in the app.
    return Engage = {
        call: function(obj){ // For simple one-off calls to the API where we don't need to paginate.
            var httpConfig = configMap(obj).httpConfig;
            var postProcessing = configMap(obj).postProcessing;
            return $http(httpConfig)
                .success(postProcessing)
                .error(errorHandler);
        },
        pager: function(obj){ // Creates a paging object to be used with lazy-loading menus.
            return new Pager(obj);
        }
    };
})

///////////////////// Controllers /////////////////////

.controller('LoginCtrl', function($scope, AuthService){
    $scope.login = function(){
        AuthService.oAuthAuthorize()
            .then(function(oAuth){
                console.log('Successfully logged in: ', oAuth);
            });
    };

    // Simple login to Engage backend
    $scope.simpleLogin = function(){
        AuthService.simpleLogin($scope.username, $scope.password)
            .then(function(){});
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
            label: 'Home',
            action: function(){
                go('nav.home');
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Post Idea',
            action: function(){
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Ideas',
            action: function(){
                go('nav.ideas'); 
                $mdSidenav('left').close();
            }
        },
        {
            label: 'My Profile',
            action: function(){
                go('nav.profile'); 
                $mdSidenav('left').close();
            }
        },
        {
            label: 'Communities',
            action: function(){
                $mdSidenav('left').close();
            }
        },
        {
            label: 'About',
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
.controller('HomeCtrl', function($scope, Engage){
    $scope.type = 'ideasR';

    // Reset results
    $scope.newPager = function() {
        $scope.pager = Engage.pager({type: $scope.type, pageSize: 40});
    };

})
.controller('IdeasCtrl', function($scope, $state, Engage){

    $scope.go = function(id){
        $state.go('nav.idea', {id: id});
    };

    $scope.pager = Engage.pager({type: 'ideas', pageSize: 40});
})
.controller('IdeaCtrl', function($scope, $state, Engage){

    var id = $state.params.id;
    $scope.idea = 'Loading idea';
    Engage.call({type: 'idea', id: id})
        .success(function(data){
            $scope.idea = data;
        });
})
.controller('ProfileCtrl', function($scope, $state, Engage){
    
    // Getting profile stuff
    var id = $state.params.id;
    $scope.profile = 'Loading profile';
    Engage.call({type: 'profile', id: id})
        .success(function(data){
            $scope.profile = data;
        });

    // Navigate to an idea's details
    $scope.go = function(id){
        $state.go('nav.idea', {id: id});
    };

    // Tabs stuff
    var totalTabs = 2; // zero-indexed...
    $scope.activeTab = 0;
    $scope.nextTab = function(){
        $scope.activeTab = Math.min($scope.activeTab + 1, totalTabs);
    };

    $scope.prevTab = function(){
        $scope.activeTab = Math.max($scope.activeTab - 1, 0);
    };

});