var fs = require('fs');
var file = 'test.db';
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

if (!exists){
  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  db.run('CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), age INT)');
}


module.exports = {

  saveData: function(data){
    db.run('INSERT INTO users VALUES ($name, $age)', data);
  },

  getData: function(cb){

    db.all('SELECT * FROM users', function(err, rows){

      if (err) {

        console.error(err);

      } else {

        cb(rows);

      }

    });
  }
};