module.exports = function($mdToast) {

  function showToast(message) {
    $mdToast.show(
      $mdToast.simple()
      .content(message)
      .position('bottom')
    );
  }

  return showToast;
};