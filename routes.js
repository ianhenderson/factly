var db = require('./db.js');

module.exports = function(app){

  app.get('/api', function(req, res){

    db.getData(function(rows){
      res.send(rows);
    });

  });

  // Add new user & password to database
  app.post('/api/adduser', function(req,res){

    if (!req.body.name || !req.body.password){

      res.send("Error: POST must include a name and password.")

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(rows){

        if (rows.length > 0){

          res.send("User already in database");

        } else {

          db.addNewUser(name, password);

          res.send(["Success! New user add: ", name].join(''))

        }

      });

    }

  });

  // Authenticate username/password
  app.post('/api/login', function(req,res){

    if (!req.body.name || !req.body.password){

      res.send("Error: POST must include a name and password.")

    } else {

      var name = req.body.name;
      var password = req.body.password;

      db.checkUser(name, password, function(rows){

        if (rows.length > 0){

          res.send("User found!");

        } else {

          res.send("Error: username / password incorrect.")

        }

      });

    }

  });

  app.get('/*', function(req,res){

    res.sendfile('./public/index.html');

  });
};