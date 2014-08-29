var db = require('./db.js');

module.exports = function(app){

  app.get('/api', function(req, res){

    db.getData(function(rows){
      res.send(rows);
    });

  });

  app.post('/api/addfact', function(req,res){

    console.log(req.body);

    var validFields = ['$name', '$password'];

    var data = {};

    validFields.forEach(function(v){
      data[v] = req.body[v];
    });

    db.saveData(data);

    res.send("ok");
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