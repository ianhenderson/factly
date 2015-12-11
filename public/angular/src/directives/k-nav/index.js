module.exports = function(){
  return {
    restrict: 'E',
    scope: {},
    template: require('./template.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: function($state, $mdSidenav, AuthService){
      var ctrl = this;

      ctrl.openLeftMenu = function(){
          $mdSidenav('left').toggle();
      };

      ctrl.closeLeftMenu = function(){
          $mdSidenav('left').close();
      };

      ctrl.navOptions = [
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
    }
  };
};
