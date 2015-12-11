module.exports = function($window) {
  var store = $window.localStorage;

  return service = {
    set: function(key, value) {
      return store.setItem(key, value);
    },
    get: function(key) {
      return store.getItem(key);
    },
    remove: function(key) {
      return store.removeItem(key);
    },
    clear: function() {
      return store.clear();
    }
  };
};