var db = require('./db.js');
var Promise = require('bluebird');

module.exports = function(app){

  // Check for session
  // function checkSession(req, res, next){
  //   var c = req.cookies;
  //   if (c && c.session && c.session.id) {
  //     next();
  //   } else {
  //     res.status(403).send("User not authorized.");
  //   }
  // }
  app.all('/api/*', function(req, res, next){

    var c = req.cookies;
    var isLoginUrl = RegExp('/api/login').test(req.url);
    var isLogoutUrl = RegExp('/api/logout').test(req.url);
    if (isLoginUrl || isLogoutUrl) {
      next();
    } else if (c && c.session && c.session.id) {
      next();
    } else {
      res.status(403).send("User not authorized.");
    }

  });

  // Get kanji
  app.get('/api/kanji', function(req, res){

    var c = req.cookies;
    var id = c.session.id;

    db.getNextFromQueue(id, function(kanji){

      if (kanji) {
        res.status(200).send(kanji);
      } else {
        res.status(404).send("Nothing more to study.");
      }

    });

  });

  // Get facts
  app.get('/api/facts', function(req, res){

    var c = req.cookies;
    var id = c.session.id;

    db.getFacts(id, function(rows){

      res.status(200).send(rows);

    });

  });

  // Add a new fact to a user's collection
  app.post('/api/facts', function(req, res){

    if (!req.body.fact){

      res.status(400).send("Error: POST must include a fact.");

    } else {

      var c = req.cookies;
      var id = c.session.id;
      var name = c.session.name;
      var fact = req.body.fact;

      // db.addFact(id, fact);
      db.addWord(id, fact);

      res.status(201).send(["Success! Fact added to ", name, "'s collection: ", fact].join(''));
    }

  });

  // Add new user & password to database
  app.post('/api/adduser', function(req,res){

    if (!req.body.name || !req.body.password){

      res.status(400).send("Error: POST must include a name and password.");

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(session){

        if (session){

          res.status(409).send("User already in database.");

        } else {

          db.addNewUser(name, password);

          res.status(201).send(["Success! New user added: ", name].join(''));

        }

      });

    }

  });

  // Authenticate username/password
  app.post('/api/login', function(req,res){

    var c = req.cookies;
    if (c && c.session && c.session.id) {
      res.status(200).send('Already logged in as ' + c.session.name);
      return;
    }

    if (!req.body.name || !req.body.password){

      res.status(400).send("Error: POST must include a name and password.");

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(session){

        if (session){

          res.cookie('session', session);
          res.status(200).send(session);

        } else {

          res.status(403).send("Error: username / password incorrect.");

        }

      });

    }

  });
  // Logout & clear cookies
  app.post('/api/logout', function(req,res){
    res.clearCookie('session');
    res.status(200).send('User signed out.');
  });

  app.get('/*', function(req,res){

    res.sendFile('public/index.html');

  });
};