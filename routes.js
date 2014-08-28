var db = require('./db.js');

module.exports = function(app){

  app.get('/api', function(req, res){

    db.getData(function(rows){
      res.send(rows);
    });

  });

  app.get('*', function(req,res){

    res.sendfile('./public/index.html');

  });

  app.post('/api', function(req,res){

    console.log(req.body);

    var validFields = ['$name', '$age'];

    var data = {};

    validFields.forEach(function(v){
      data[v] = req.body[v];
    });

    db.saveData(data);

    res.send("ok");
  });

};