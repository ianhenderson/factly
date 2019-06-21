var dbpg = require('./db_postgres.js');

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
    dbpg.userCheck(username, password)
    .then(results => {
      if (results.length){
        const [user] = results
        res.cookie('session', user, {httpOnly: true});
        res.status(200).send(user);
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
    dbpg.userCheck(username, password)
      then(results => {
        if (results.length) {
          res.status(409).send("User already in database.");
        } else {
          dbpg.userAdd(username, password)
            .then(resultsAdd => {
              const [user] = resultsAdd
              res.status(201).send(user);
            });
        }
      })
  }
}

function getKanji(req, res){
  var c = req.cookies;
  var id = c.session.id;
  
  dbpg.userGetNextStudyRow(id)
  .then(results => {
    if (results.length) {
      const [ item ] = results
      var response = {
        queue_id: item.queue_id,
        total_unseen: item.total_unseen,
        kanji: item.next_char,
        words: item.rel_words
      };
      res.status(200).send(response);
    } else {
      res.status(404).send("Nothing more to study.");
    }

  })
}

function addFact(req, res){
  var c = req.cookies;
  var id = c.session.id;
  var name = c.session.username;
  var fact = req.body.fact;
  if (!fact){
    res.status(400).send("Error: POST must include a fact.");
  } else {
    if (!Array.isArray(fact)) { fact = [fact] }

    dbpg.wordInsert(fact, id)
      .then(results => {
        res.status(201).send(`Success! Fact added to ${name}'s collection: ${fact.join()}`);
      })

  }
}
module.exports = {
  login: login,
  logout: logout,
  signup: signup,
  getKanji: getKanji,
  addFact: addFact
}
