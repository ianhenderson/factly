module.exports = function($rootScope, $q, $window, $http, $state, $location, LocalStorage) {

  function parseResponse(oAuthObj) {
    for (var key in oAuthObj) {
      var value = oAuthObj[key];
      oAuthObj[key] = decodeURIComponent(value);
    }
    return oAuthObj;
  }

  return auth = {
    simpleLogin: function(username, password) {

      var loginConfig = {
        method: 'POST',
        url: '/api/login',
        data: {
          username: username,
          password: password
        }
      };

      return $http(loginConfig)
        .then(function(response) {
          LocalStorage.set('userinfo', JSON.stringify(response.data));
          $location.path('/home');
          return response.data;
        })
        .catch(function(response) {
          throw response.data;
        });

    },
    signUp: function(username, password) {
      var loginConfig = {
        method: 'POST',
        url: '/api/signup',
        data: {
          username: username,
          password: password
        }
      };

      return $http(loginConfig)
        .then(function(response) {
          LocalStorage.set('userinfo', JSON.stringify(response.data));
          return response.data;
        })
        .catch(function(response) {
          throw response.data;
        });

    },
    signupAndLogin: function(username, password) {
      return auth.signUp(username, password)
        .then(function(response) {
          return auth.simpleLogin(username, password);
        })
        .catch(function(response) {
          throw response;
        });
    },
    superSignIn: function(username, password) {
      return auth.simpleLogin(username, password)
        .catch(function(response) {
          return auth.signupAndLogin(username, password);
        });
    },
    validate: function() { // If at any time we don't have a session on a state change, redirect to /login
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
    logout: function() {

      var logoutConfig = {
        method: 'POST',
        url: '/api/logout'
      };

      return $http(logoutConfig)
        .then(function(response) {
          console.log('Logged out.');
          LocalStorage.remove('userinfo');
          $state.go('login');
          return response.data;
        })
        .catch(function(response) {
          console.log('Error logging out: ', response);
          return response.data;
        });

    },
  };
}