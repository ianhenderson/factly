var db = require('./db.js');
var Promise = require('bluebird');

function login(req, res){

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
}

function logout(req, res){
  res.clearCookie('session');
  res.status(200).send('User signed out.');
}

function signup(req, res){

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
}

function getKanji(req, res){

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
}

function getFacts(req, res){

  var c = req.cookies;
  var id = c.session.id;

  db.getFacts_(id)
    .then(function(rows){

      res.status(200).send(rows);

    });
}

function addFact(req, res){

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
}

module.exports = {
  login: login,
  logout: logout,
  signup: signup,
  getKanji: getKanji,
  getFacts: getFacts,
  addFact: addFact
};