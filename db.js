var fs = require('fs');
var file = 'test.db';
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);
var bcrypt = require('bcrypt-nodejs');

if (!exists){
  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255), password VARCHAR(255), salt VARCHAR(255))');
  db.run('CREATE TABLE facts (id INTEGER PRIMARY KEY, fact TEXT)');
  db.run('CREATE TABLE kanji (id INTEGER PRIMARY KEY, kanji TEXT)');
  db.run('CREATE TABLE words (id INTEGER PRIMARY KEY, word TEXT)');
  db.run('CREATE TABLE kanji_words (kanji_id INTEGER, word_id INTEGER, FOREIGN KEY(kanji_id) REFERENCES kanji(id), FOREIGN KEY(word_id) REFERENCES words(id))');
  db.run('CREATE TABLE study_queue (user_id INTEGER, kanji_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji_id) REFERENCES kanji(id))');
}

// if ()


module.exports = {

  checkUser: function(name, password, cb){

    // First, we get users with provided name
    db.all('SELECT name, password, salt FROM users WHERE name = ?', name, function(err, rows){
      if (err) {

        console.error(err);

      } else {

        // If no results, return
        if (!rows.length) {

          cb(rows);

        } else {

          // Get salt, hashed password for user
          var salt = rows[0].salt;
          var hashedPassword = rows[0].password;

          // Generate hash from provided password and retrieved salt
          bcrypt.hash(password, salt, null, function(err, hash){

            // Check against DB values
            if (hash === hashedPassword){

              cb(rows);

            } else {

              cb([]);

            }

          });

        }

      }

    });
      
  },

  addNewUser: function(name, password){

    // Generate salt for password
    bcrypt.genSalt(8, function(err, salt){

      if (err){
        console.error(err);
      }

      // Generate salted hash
      bcrypt.hash(password, salt, null, function(err, hash){

        if (err){
          console.error(err);
        }

        // Save name, hashed password and salt to DB
        db.run('INSERT INTO users (name, password, salt) VALUES (?, ?, ?)', name, hash, salt);

      });
      
    });

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
  },

  // Add word to 'words' table.
  getNextFact: function(){},

  // For each character in word, add kanji to 'kanji' table...
  // ...add kanji_id to 'study_queue' table...
  // ...and add relationship to kanji_words junction table.

  // Get next character to study, and related words

  // Update queue with seen characters
};
