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
  db.run('CREATE TABLE facts (user_id INTEGER, fact TEXT)');

  db.run('CREATE TABLE kanji (id INTEGER PRIMARY KEY, kanji TEXT)');
  db.run('CREATE TABLE words (id INTEGER PRIMARY KEY, word TEXT)');
  db.run('CREATE TABLE kanji_words (kanji_id INTEGER, word_id INTEGER, FOREIGN KEY(kanji_id) REFERENCES kanji(id), FOREIGN KEY(word_id) REFERENCES words(id))');

  db.run('CREATE TABLE seen_words (user_id INTEGER, word_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(word_id) REFERENCES words(id))');
  db.run('CREATE TABLE seen_kanji (user_id INTEGER, kanji_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji_id) REFERENCES kanji(id))');

  db.run('CREATE TABLE study_queue (user_id INTEGER, kanji_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji_id) REFERENCES kanji(id))');
}

// if ()


module.exports = {

  checkUser: function(name, password, cb){

    // First, we get users with provided name
    db.all('SELECT id, name, password, salt FROM users WHERE name = ?', name, function(err, rows){
      if (err) {

        console.error(err);

      } else {

        // If no results, return
        if (!rows.length) {

          cb(null);

        } else {

          // Get salt, hashed password for user
          var salt = rows[0].salt;
          var hashedPassword = rows[0].password;

          // Generate hash from provided password and retrieved salt
          bcrypt.hash(password, salt, null, function(err, hash){

            // Check against DB values
            if (hash === hashedPassword){

              cb({
                id: rows[0].id,
                name: rows[0].name
              });

            } else {

              cb(null);

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

  addFact: function(id, fact){
    // db.run('INSERT INTO facts (id, fact) SELECT users.id, ? FROM users WHERE users.id = ?', fact, id);
    db.run('INSERT INTO facts (user_id, fact) VALUES (?, ?)', id, fact, function(err){
      console.log(err, this);
    });
  },

  getFacts: function(id, cb){
    db.all('SELECT fact FROM users, facts WHERE facts.user_id = users.id AND users.id = ?', id, function(err, rows){
      if (err) {
        console.error(err);
      } else {
        cb(rows);
      }
    });
  },

  addWord: function(userId, word){
    var kanji_id;
    var word_id;
    // Add word to 'words' table.
    db.run('INSERT INTO words (word) VALUES (?)', word, function(err){
      word_id = this.lastID;
    });

    // TODO: clean non-kanji chars out

    // For each character in word:
    word.split('').forEach(function(char){

      // 1) Add kanji to 'kanji' table...
      db.run('INSERT INTO kanji (kanji) VALUES (?)', char, function(err){
        kanji_id = this.lastID;
      });

      // 2) Add kanji_id to 'study_queue' table...
      db.run('INSERT INTO study_queue (user_id, kanji_id) VALUES (?, ?)', userId, kanji_id);

      // 3) Add relationship to kanji_words junction table.
      db.run('INSERT INTO kanji_words (kanji_id, word_id) VALUES (?, ?)', kanji_id, word_id);

      // 4) Add to seen tables for current user_id
      db.run('INSERT INTO seen_words (user_id, word_id) VALUES (?, ?)', userId, word_id);
      db.run('INSERT INTO seen_kanji (user_id, kanji_id) VALUES (?, ?)', userId, kanji_id);

    });
  },

  // Get next character to study, and related words
  getNextChar: function(userId){
    // db.run('SELECT kanji FROM kanji, study_queue WHERE kanii.kanji_id = study_queue.kanji_id AND study_queue.user_id = ?', userId);
  },

  getKanji: function(userId){
    db.run('SELECT kanji FROM seen_kanji WHERE seen_kanji.user_id = ?', userId, function(rows){
      return rows;
    });
  },
  getWords: function(userId){
    db.run('SELECT words FROM seen_words WHERE seen_words.user_id = ?', userId, function(rows){
      return rows;
    });
  },

  // Update queue with seen characters
  updateStudyQueue: function(userId, kanjiId){}
};
