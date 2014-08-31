var db = require('./db.js');

module.exports = function(app){

  // Get facts for a particular user
  app.get('/api/facts/:user', function(req, res){

    var name = req.params.user;

    db.getFacts(name, function(rows){

      res.send(rows);

    });

  });

  // Add a new fact to a user's collection
  app.post('/api/facts', function(req, res){

    if (!req.body.name || !req.body.fact){

      res.send("Error: POST must include a name and a fact.");

    } else {

      var name = req.body.name;
      var fact = req.body.fact;

      db.addFact(name, fact);

      res.send(["Success! Fact added to ", name, "'s collection: ", fact].join(''));
    }

  });

  // Add new user & password to database
  app.post('/api/adduser', function(req,res){

    if (!req.body.name || !req.body.password){

      res.send("Error: POST must include a name and password.");

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(rows){

        if (rows.length > 0){

          res.send("User already in database");

        } else {

          db.addNewUser(name, password);

          res.send(["Success! New user added: ", name].join(''));

        }

      });

    }

  });

  // Authenticate username/password
  app.post('/api/login', function(req,res){

    if (!req.body.name || !req.body.password){

      res.send("Error: POST must include a name and password.");

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(rows){

        if (rows.length > 0){

          res.send("User found!");

        } else {

          res.send("Error: username / password incorrect.");

        }

      });

    }

  });

  app.get('/*', function(req,res){

    res.sendfile('./public/index.html');

  });
};