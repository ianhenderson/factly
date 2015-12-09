var db = require('./db.js');

function login(req, res){

  var c = req.cookies;
  var username = req.body.username;
  var password = req.body.password;

  if (c && c.session && c.session.id) {
    res.status(200).send('Already logged in as ' + c.session.name);
    return;
  }

  if (!username || !password){

    res.status(400).send("Error: POST must include a name and password.");

  } else {

    db.checkUser(username, password)
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

  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password){

    res.status(400).send("Error: POST must include a username and password.");

  } else {

    db.checkUser(username, password)
      .then(function(user){

        if (user.exists){

          res.status(409).send("User already in database.");

        } else {

          db.addNewUser(username, password)
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
        db.getSeenWordsRelatedToKanji(id, kanji)
          .then(function(words){
            var response = {
              kanji: kanji,
              words: words
            };
            res.status(200).send(response);
          });
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

  var c = req.cookies;
  var id = c.session.id;
  var name = c.session.name;
  var fact = req.body.fact;

  if (!fact){

    res.status(400).send("Error: POST must include a fact.");

  } else {

    if (!Array.isArray(fact)) { fact = [fact] }

    db.addWords(id, fact)
      .then(function(added){
        res.status(201).send(["Success! Fact added to ", name, "'s collection: ", fact].join(''));
      });

  }
}

function getRelatedWords(req, res){

  var c = req.cookies;
  var id = c.session.id;
  var kanji = req.body.kanji;

  db.getSeenWordsRelatedToKanji(kanji, id)
    .then(function(rows){

      res.status(200).send(rows);

    });

}

module.exports = {
  login: login,
  logout: logout,
  signup: signup,
  getKanji: getKanji,
  getFacts: getFacts,
  addFact: addFact,
  getRelatedWords: getRelatedWords
};