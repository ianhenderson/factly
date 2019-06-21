var router = require('express').Router();
var checkSession = require('./checkSession');
var ctrl = require('./controller');

// require session for /login, /logout and /signup routes
router.use(checkSession);

// Get kanji
router.route('/kanji')
  .get(ctrl.getKanji)
  .post(ctrl.markComplete);

// Get/add words
router.route('/facts')
  .post(ctrl.addFact);

// Add new user & password to database
router.route('/signup')
  .post(ctrl.signup);

// Authenticate username/password
router.route('/login')
  .post(ctrl.login);

// Logout & clear cookies
router.route('/logout')
  .post(ctrl.logout);

module.exports = function(app){
  app.use('/api', router);
};