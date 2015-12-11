module.exports = function(){
  return {
    restrict: 'E',
    scope: {},
    template: require('./template.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: function(K){
      var ctrl = this;

      ctrl.getNextChar = function(){
          K.getNextChar()
          .then(function(data){
              ctrl.type = data;
          });
      };

    }
  };
};
