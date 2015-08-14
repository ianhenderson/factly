var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var sqlite3 = Promise.promisifyAll(require('sqlite3').verbose());
var bcrypt = Promise.promisifyAll(require('bcryptjs'));

module.exports = function(config){
  config = config || {};
  var file = config.file || 'test.db';
  var db = new sqlite3.Database(file);
  var debug = config.debug || false;
  var stmtCache;
  initDatabase(file);

  // For debugging:
  if (debug) {

    db.on('trace', function(query){
      console.log('TRACE: ', query);

    });

    db.on('profile', function(query, time){
      console.log('PROFILE: ', time, ':::',query);
    });

  }


  function initDatabase(name){

    if (fs.existsSync(name)) {

      console.log('Creating DB file: ', name);
      fs.openSync(name, 'w');
      db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255) UNIQUE, password VARCHAR(255), salt VARCHAR(255))')
        // Tables of all unique kanji, words and a junction table
        .run('CREATE TABLE kanji (id INTEGER PRIMARY KEY, kanji TEXT UNIQUE)')
        .run('CREATE TABLE words (id INTEGER PRIMARY KEY, word TEXT UNIQUE)')
        .run('CREATE TABLE kanji_words (kanji TEXT, word_id INTEGER, FOREIGN KEY(kanji) REFERENCES kanji(kanji), FOREIGN KEY(word_id) REFERENCES words(id), CONSTRAINT unq UNIQUE (kanji, word_id))')
        // Tables of seen words/kanji on a per-user basis
        .run('CREATE TABLE seen_words (user_id INTEGER, word_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(word_id) REFERENCES words(id))')
        .run('CREATE TABLE seen_kanji (user_id INTEGER, kanji TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji) REFERENCES kanji(kanji))')
        // Queue of items to study for each user
        .run('CREATE TABLE study_queue (user_id INTEGER, queue TEXT, FOREIGN KEY(user_id) REFERENCES users(id))', function(err){
          // Prepare statements. (must be done AFTER tables have been created else throws error)
          stmtCache = {
            addKanji: db.prepare('INSERT OR IGNORE INTO kanji (kanji) VALUES (?)'),
            addKanjiWords: db.prepare('INSERT OR IGNORE INTO kanji_words (kanji, word_id) VALUES (?, ?)'),
            addSeenWords: db.prepare('INSERT INTO seen_words (user_id, word_id) VALUES (?, ?)'),
            addSeenKanji: db.prepare('INSERT INTO seen_kanji (user_id, kanji) VALUES (?, ?)')
          };
        });
    }
  }

  function handleError(e) {
    console.error(e);
  }



  return fn = {

    checkUser_: function(name, password){
      var salt;
      var hashedPassword;
      var userInfo;
      var user = {
        exists: false,
        data: null
      };
      // First, we get users with provided name
      return db.allAsync('SELECT id, name, password, salt FROM users WHERE name = ?', name)
        .then(function(rows){
          userInfo = rows;
          if (!rows.length) return user;
          user.exists = true;
          // Get salt, hashed password for user
          salt = rows[0].salt;
          hashedPassword = rows[0].password;
          // Generate hash from provided password and retrieved salt
          return bcrypt.hashAsync(password, salt)
            .then(function(hash){
              // Check against DB values
              if (hash === hashedPassword){
                user.data = {
                  id: userInfo[0].id,
                  name: userInfo[0].name
                };
              }
              return user;
            });
        })
        .catch(function(e){
          console.error(e);
        });
    },

    addNewUser_: function(name, password){
      // Generate salt for password
      return bcrypt.genSaltAsync(8)
        .then(function(salt){
          // Generate salted hash
          return bcrypt.hashAsync(password, salt)
            .then(function(hash){
              // Save name, hashed password and salt to DB, then create initial entry in study_queue.
              var q = JSON.stringify([0]);
              return db.run('BEGIN TRANSACTION')
                .run('INSERT OR IGNORE INTO users (name, password, salt) VALUES (?, ?, ?)', name, hash, salt)
                .run('INSERT OR IGNORE INTO study_queue (user_id, queue) SELECT id, ? FROM users WHERE name=?', q, name)
                .run('COMMIT')
                .getAsync('SELECT id, name FROM users WHERE name=? AND password=?', name, hash);
            });
        })
        .catch(function(e){
          console.error(e);
          return e;
        });
    },

    addFact_: function(id, fact){
      return db.runAsync('INSERT INTO facts (user_id, fact) VALUES (?, ?)', id, fact)
        .then(function(){
          console.log(this);
          return this;
        })
        .catch(function(e){
          console.error(e);
        });
    },

    getFacts_: function(id){
      return db.allAsync('SELECT fact FROM users, facts WHERE facts.user_id = users.id AND users.id = ?', id)
        .then(function(rows){
          return rows;
        })
        .catch(handleError);
    },

    addWord_: function(userId, word){
      var kanjiIds;
      // Add word to 'words' table.
      return db.run('INSERT OR IGNORE INTO words (word) VALUES (?)', word)
               .getAsync('SELECT id FROM words WHERE word = ?', word)
        .then(function(row){
          var word_id = row.id;
          kanjiIds = []; // to be pushed to study_queue

          // Clean non-kanji chars out
          word = fn.filterKanji(word);
          var chars = word.split('');

          // For each character in word...
          var promises = chars.map(function(char){
            // ...create a promise:
            return new Promise(function(resolve, reject){
              // 1) Add kanji to 'kanji' table...
              db.run('INSERT OR IGNORE INTO kanji (kanji) VALUES (?)', char)
                .getAsync('SELECT id FROM kanji WHERE kanji = ?', char)
                .then(function(row){
                  var kanji_id = row.id;
                  kanjiIds.push(kanji_id);

                  // 2) Add relationship to kanji_words junction table.
                  // 3) Add to seen tables for current user_id
                  db.run('INSERT OR IGNORE INTO kanji_words (kanji_id, word_id) VALUES (?, ?)', kanji_id, word_id)
                    .run('INSERT INTO seen_words (user_id, word_id) VALUES (?, ?)', userId, word_id)
                    .run('INSERT INTO seen_kanji (user_id, kanji_id) VALUES (?, ?)', userId, kanji_id);
                  resolve(true);
                });
            });
          });
          // Once all are done:
          return Promise.all(promises);
        })
        .then(function(){
          // 4) Add kanji_id(s) to 'study_queue' table...
          return fn.enqueue(userId, kanjiIds);
        })
        .then(function(added){
          return added;
        })
        .catch(handleError);
    },

    // Get next character to study, and related words
    getNextChar: function(userId){
      // db.run('SELECT kanji FROM kanji, study_queue WHERE kanii.kanji_id = study_queue.kanji_id AND study_queue.user_id = ?', userId);
    },

    getAllSeenKanji_: function(userId){
      return db.getAsync('SELECT kanji FROM seen_kanji WHERE seen_kanji.user_id = ?', userId)
        .then(function(row){
          return row;
        })
        .catch(handleError);
    },

    getAllSeenWords_: function(userId){
      return db.getAsync('SELECT words FROM seen_words WHERE seen_words.user_id = ?', userId)
        .then(function(row){
          return row;
        })
        .catch(handleError);
    },

    // Add to queue
    enqueue: function(userId, kanjiIds){
      return db.getAsync('SELECT queue FROM study_queue WHERE study_queue.user_id = ?', userId)
        .then(function(row){
          var q = row && JSON.parse(row.queue);
          q = q ? q.concat(kanjiIds) : kanjiIds ;
          var q_string = JSON.stringify(q);
          if (row){
            db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
          } else {
            db.run('INSERT INTO study_queue (user_id, queue) VALUES (?, ?)', userId, q_string);
          }
          return true;
        })
        .catch(handleError);
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
    getNextFromQueue_: function(userId, cb){
      return db.getAsync('SELECT queue FROM study_queue WHERE user_id = ?', userId)
        .then(function(row){
          var q = JSON.parse(row.queue);
          if (q.length === 0) {
            cb(null);
            return;
          }
          var first = q.shift();
          var q_string = JSON.stringify(q);
          db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
          return db.getAsync('SELECT kanji FROM kanji WHERE id = ?', first)
            .then(function(kanjiRow){
              var nextKanji = kanjiRow.kanji;
              return nextKanji;
            });
        })
        .catch(handleError);
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
    }

  };
  
};
