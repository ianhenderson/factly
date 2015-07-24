// function checkSession('/api/*', function(req, res, next){
function checkSession(req, res, next){

  var c = req.cookies;
  var isLoginUrl = RegExp('/login').test(req.url);
  var isLogoutUrl = RegExp('/logout').test(req.url);
  var isAddUserUrl = RegExp('/signup').test(req.url);

  if (isLoginUrl || isLogoutUrl || isAddUserUrl) { // Logging in, logging out, adding a user
    next();
  } else if (c && c.session && c.session.id) { // Session established
    next();
  } else {
    res.status(403).send("User not authorized.");
  }

}

module.exports = checkSession;