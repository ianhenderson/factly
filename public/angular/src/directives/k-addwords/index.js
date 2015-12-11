module.exports = function(){
  return {
    restrict: 'E',
    scope: {},
    template: require('./template.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: function(Toast, K){
      var ctrl = this;
      ctrl.addWord = function(){
          var word = ctrl.word;
          K.addWord(word, true)
          .then(function(data){
              ctrl.word = '';
              Toast(data);
          });
      };

    }
  };
};
