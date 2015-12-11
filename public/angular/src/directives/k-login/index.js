module.exports = function(){
  return {
    restrict: 'E',
    scope: {},
    template: require('./template.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: function(AuthService, Toast){
      var ctrl = this;

      ctrl.select = function(label){
          ctrl.tabs.forEach(function(tab){
              tab.selected = (tab.title === label) ? true : false;
          });
      };

      ctrl.tabs = [
          {
              title: 'Sign-in / Sign-up',
              action: AuthService.superSignIn
          },
          // {
          //     title: 'New User',
          //     action: AuthService.signupAndLogin
          // }
      ];

      ctrl.submit = function(){
          var selectedTab = ctrl.tabs.filter(function(tab){ return tab.selected === true; }).pop();
          selectedTab
          .action(ctrl.username, ctrl.password)
          .then(function(response){
              console.log('Success: ', response);
          })
          .catch(Toast);
      };
    }
  };
};
