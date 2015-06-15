var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var file = 'test.db';
var exists = fs.existsSync(file);
var sqlite3 = Promise.promisifyAll(require('sqlite3').verbose());
var db = new sqlite3.Database(file);
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

if (!exists){
  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255), password VARCHAR(255), salt VARCHAR(255))');
  db.run('CREATE TABLE facts (user_id INTEGER, fact TEXT)');

  // Tables of all unique kanji, words and a junction table
  db.run('CREATE TABLE kanji (id INTEGER PRIMARY KEY, kanji TEXT UNIQUE)');
  db.run('CREATE TABLE words (id INTEGER PRIMARY KEY, word TEXT UNIQUE)');
  db.run('CREATE TABLE kanji_words (kanji_id INTEGER, word_id INTEGER, FOREIGN KEY(kanji_id) REFERENCES kanji(id), FOREIGN KEY(word_id) REFERENCES words(id))');

  // Tables of seen words/kanji on a per-user basis
  db.run('CREATE TABLE seen_words (user_id INTEGER, word_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(word_id) REFERENCES words(id))');
  db.run('CREATE TABLE seen_kanji (user_id INTEGER, kanji_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji_id) REFERENCES kanji(id))');

  // Queue of items to study for each user
  db.run('CREATE TABLE study_queue (user_id INTEGER, queue TEXT, FOREIGN KEY(user_id) REFERENCES users(id))');
}


module.exports = fn = {

  checkUser2: function(name, password){
    // First, we get users with provided name
    return db.allAsync('SELECT id, name, password, salt FROM users WHERE name = ?', name)
      .then(function(rows){
        // Get salt, hashed password for user
        var salt = rows[0].salt;
        var hashedPassword = rows[0].password;
        // Generate hash from provided password and retrieved salt
        return bcrypt.hashAsync(password, salt, null)
          .then(function(hash){
            // Check against DB values
            if (hash === hashedPassword){
              return {
                id: rows[0].id,
                name: rows[0].name
              };
            } else {
              return null;
            }
          });
      })
      .catch(function(e){
        console.error(e);
      });
  },

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
  addNewUser2: function(name, password){
    // Generate salt for password
    return bcrypt.genSaltAsync(8)
      .then(function(salt){
        // Generate salted hash
        return bcrypt.hashAsync(password, salt, null)
          .then(function(hash){
            // Save name, hashed password and salt to DB
            return db.run('INSERT INTO users (name, password, salt) VALUES (?, ?, ?)', name, hash, salt)
              .then(function(){
                // Create initial entry in study_queue
                var user_id = this.lastID;
                var q = JSON.stringify([0]);
                return db.run('INSERT INTO study_queue (user_id, queue) VALUES (?, ?)', user_id, q)
                  .then(function(){
                    return true;
                  });
              });
          });
      })
      .catch(function(e){
        console.error(e);
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
        db.run('INSERT INTO users (name, password, salt) VALUES (?, ?, ?)', name, hash, salt, function(err){
          // Create initial entry in study_queue
          var user_id = this.lastID;
          var q = JSON.stringify([0]);
          db.run('INSERT INTO study_queue (user_id, queue) VALUES (?, ?)', user_id, q);
        });

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
    db.serialize(function(){
      // Add word to 'words' table.
      db.run('INSERT OR IGNORE INTO words (word) VALUES (?)', word);
      db.get('SELECT id FROM words WHERE word = ?', word, function(err, row){
        var word_id = row.id;
        var kanjiIds = []; // to be pushed to study_queue

        // Clean non-kanji chars out
        word = fn.filterKanji(word);

        // For each character in word:
        word.split('').forEach(function(char){

          // 1) Add kanji to 'kanji' table...
          db.serialize(function(){
            db.run('INSERT OR IGNORE INTO kanji (kanji) VALUES (?)', char);
            db.get('SELECT id FROM kanji WHERE kanji = ?', char , function(err, row){
              var kanji_id = row.id;
              kanjiIds.push(kanji_id);

              // 2) Add relationship to kanji_words junction table.
              db.run('INSERT INTO kanji_words (kanji_id, word_id) VALUES (?, ?)', kanji_id, word_id);

              // 3) Add to seen tables for current user_id
              db.run('INSERT INTO seen_words (user_id, word_id) VALUES (?, ?)', userId, word_id);
              db.run('INSERT INTO seen_kanji (user_id, kanji_id) VALUES (?, ?)', userId, kanji_id);
            });
          });

        });

        // 4) Add kanji_id to 'study_queue' table...
        fn.enqueue(userId, kanjiIds);

      });
      
    });
  },

  // Get next character to study, and related words
  getNextChar: function(userId){
    // db.run('SELECT kanji FROM kanji, study_queue WHERE kanii.kanji_id = study_queue.kanji_id AND study_queue.user_id = ?', userId);
  },

  getAllSeenKanji: function(userId){
    db.get('SELECT kanji FROM seen_kanji WHERE seen_kanji.user_id = ?', userId, function(err, row){
      return row;
    });
  },
  getAllSeenWords: function(userId){
    db.get('SELECT words FROM seen_words WHERE seen_words.user_id = ?', userId, function(err, row){
      return row;
    });
  },

  // Add to queue
  enqueue: function(userId, kanjiIds){
    db.get('SELECT queue FROM study_queue WHERE study_queue.user_id = ?', userId, function(err, row){
      var q = row && JSON.parse(row.queue);
      q = q.concat(kanjiIds);
      var q_string = JSON.stringify(q);
      db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
    });

  },

  // Update queue (ie. we're done with the last value)
  dequeue: function(userId){
    db.get('SELECT queue FROM study_queue WHERE user_id = ?', userId, function(err, row){
      var q = JSON.parse(row.queue);
      var first = q.shift();
      var q_string = JSON.stringify(q);
      db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
    });
  },

  // Read from queue (next kanji_id to show to user)
  getNextFromQueue: function(userId, cb){
    db.get('SELECT queue FROM study_queue WHERE user_id = ?', userId, function(err, row){
      var q = JSON.parse(row.queue);
      if (q.length === 0) {
        cb(null);
        return;
      }
      var first = q.shift();
      var q_string = JSON.stringify(q);
      db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
      db.get('SELECT kanji FROM kanji WHERE id = ?', first, function(err, kanjiRow){
        var nextKanji = kanjiRow.kanji;
        cb(nextKanji);
      });
    });
  },

  // Helper function to strip out non-kanji characters
  filterKanji: function(str){
     return str.replace(/[^\u4e00-\u9faf]/g, '');
  },


};
