var fs = require('fs');
var file = 'test.db';
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

if (!exists || process.env.PERSIST_DB === false){
  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255), password VARCHAR(255))');
  db.run('CREATE TABLE facts (id INTEGER, fact TEXT)');
}


module.exports = {

  checkUser: function(name, password, cb){
    db.all('SELECT * FROM users WHERE name = ? AND password = ?', name, password, function(err, rows){
      if (err) {
        console.error(err);
      } else {
        cb(rows);
      }
    });
  },

  addNewUser: function(name, password){
    db.run('INSERT INTO users (name, password) VALUES (?, ?)', name, password);
  },

  addFact: function(name, fact){
    db.run('INSERT INTO facts (id, fact) SELECT users.id, ? FROM users WHERE users.name = ?', fact, name);
  },

  getFacts: function(name, cb){
    db.all('SELECT fact FROM users, facts WHERE facts.id = users.id AND users.name = ?', name, function(err, rows){
      if (err) {
        console.error(err);
      } else {
        cb(rows);
      }
    });
  }
};
