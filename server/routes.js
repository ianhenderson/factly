var db = require('./db.js');
var router = require('express').Router();
var Promise = require('bluebird');
var ctrl = require('./controller');

// Get kanji
router.get('/kanji', function(req, res){

  var c = req.cookies;
  var id = c.session.id;

  db.getNextFromQueue_(id)
    .then(function(kanji){

      if (kanji) {
        res.status(200).send(kanji);
      } else {
        res.status(404).send("Nothing more to study.");
      }

    });

});

// Get facts
router.get('/facts', function(req, res){

  var c = req.cookies;
  var id = c.session.id;

  db.getFacts_(id)
    .then(function(rows){

      res.status(200).send(rows);

    });

});

// Add a new fact to a user's collection
router.post('/facts', function(req, res){

  if (!req.body.fact){

    res.status(400).send("Error: POST must include a fact.");

  } else {

    var c = req.cookies;
    var id = c.session.id;
    var name = c.session.name;
    var fact = req.body.fact;

    db.addWord_2(id, fact)
      .then(function(added){
        res.status(201).send(["Success! Fact added to ", name, "'s collection: ", fact].join(''));
      });

  }

});

// Add new user & password to database
router.post('/signup', function(req,res){

  if (!req.body.username || !req.body.password){

    res.status(400).send("Error: POST must include a username and password.");

  } else {

    var username = req.body.username;
    var password = req.body.password;

    db.checkUser_(username, password)
      .then(function(user){

        if (user.exists){

          res.status(409).send("User already in database.");

        } else {

          db.addNewUser_(username, password)
            .then(function(user){

              res.status(201).send(user);
              
            });

        }

      });

  }

});

// Authenticate username/password
router.post('/login', function(req,res){

  var c = req.cookies;
  if (c && c.session && c.session.id) {
    res.status(200).send('Already logged in as ' + c.session.name);
    return;
  }

  if (!req.body.username || !req.body.password){

    res.status(400).send("Error: POST must include a name and password.");

  } else {

    var name = req.body.username;
    var password = req.body.password;

    db.checkUser_(name, password)
    .then(function(session){

      if (session.data){

        res.cookie('session', session.data, {httpOnly: true});
        res.status(200).send(session.data);

      } else {

        res.status(403).send("Error: username / password incorrect.");

      }

    });

  }

});
// Logout & clear cookies
router.post('/logout', function(req,res){
  res.clearCookie('session');
  res.status(200).send('User signed out.');
});

router.get('/', function(req,res){

  res.sendFile('public/index.html');

});

module.exports = function(app){
  app.use('/api', router);
};