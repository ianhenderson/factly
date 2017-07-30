var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var sqlite3 = Promise.promisifyAll(require('sqlite3').verbose());
var bcrypt = Promise.promisifyAll(require('bcryptjs'));
var config = require('./config');
var db = new sqlite3.Database(config.file);
var stmtCache;

initDatabase(config.file)
  .then(initStmtCache);

// For debugging:
if (config.trace) {
  db.on('trace', function(query){
    console.log('TRACE: ', query);
  });
}
if (config.profile) {
  db.on('profile', function(query, time){
    console.log('PROFILE: ', time, ':::',query);
  });
}



function initDatabase(name){
  return new Promise(function(resolve, reject){
    fs.stat(name, function(err, stats){
      if (!stats) {
        fs.openSync(name, 'w');
        console.log(name, 'created.');
      }
      console.log('Initializing tables for', name);
      db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name VARCHAR(255) UNIQUE, password VARCHAR(255), salt VARCHAR(255))')
        // Tables of all unique kanji, words and a junction table
        .run('CREATE TABLE IF NOT EXISTS kanji (id INTEGER PRIMARY KEY, kanji TEXT UNIQUE)')
        .run('CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY, word TEXT UNIQUE)')
        .run('CREATE TABLE IF NOT EXISTS kanji_words (kanji TEXT, word_id INTEGER, FOREIGN KEY(kanji) REFERENCES kanji(kanji), FOREIGN KEY(word_id) REFERENCES words(id), CONSTRAINT unq UNIQUE (kanji, word_id))')
        // Tables of seen words/kanji on a per-user basis
        .run('CREATE TABLE IF NOT EXISTS seen_words (user_id INTEGER, word_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(word_id) REFERENCES words(id))')
        .run('CREATE TABLE IF NOT EXISTS seen_kanji (user_id INTEGER, kanji TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(kanji) REFERENCES kanji(kanji))')
        // Queue of items to study for each user
        .run('CREATE TABLE IF NOT EXISTS study_queue (user_id INTEGER, queue TEXT, FOREIGN KEY(user_id) REFERENCES users(id))', function(err){
          resolve(true);
        });
    });
  });
}

function initStmtCache(created){
  // Prepare statements. (must be done AFTER tables have been created else throws error)
  console.log('Preparing statements...');
  stmtCache = {
    addKanji: db.prepare('INSERT OR IGNORE INTO kanji (kanji) VALUES (?)'),
    addKanjiWords: db.prepare('INSERT OR IGNORE INTO kanji_words (kanji, word_id) VALUES (?, ?)'),
    addKanjiWords_: db.prepare('INSERT OR IGNORE INTO kanji_words (kanji, word_id) SELECT $kanji, words.id FROM words WHERE words.word = $word'),
    addSeenWords: db.prepare('INSERT INTO seen_words (user_id, word_id) VALUES (?, ?)'),
    addSeenWords_: db.prepare('INSERT INTO seen_words (user_id, word_id) SELECT $userId, words.id FROM words WHERE words.word = $word'),
    addSeenKanji: db.prepare('INSERT INTO seen_kanji (user_id, kanji) VALUES (?, ?)'),
    addWordToWordsTable: db.prepare('INSERT OR IGNORE INTO words (word) VALUES ($word)'),
    getRelatedWords: db.prepare('SELECT kanji, word FROM kanji_words AS kw, words AS w, seen_words AS sw WHERE kw.kanji = $kanji AND kw.word_id = w.id AND kw.word_id = sw.word_id AND sw.user_id = $userId')
  };
  console.log('Preparing statements finished.');
  return;
}

function handleError(e) {
  console.error(e);
}

function getSeenWordsRelatedToKanji(userId, kanji){
  return new Promise(function(resolve, reject){
    var args = {$kanji: kanji, $userId: userId};
    stmtCache.getRelatedWords.reset().allAsync(args)
      .then(function(rows){
        return rows.map(function(row){ return row.word; });
      })
      .then(resolve)
      .catch(handleError);
  });
}

module.exports = fn = {

  checkUser: function(name, password){
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
        return bcrypt.hashAsync(password, salt);
      })
      .then(function(hash){
        // Check against DB values
        if (hash === hashedPassword){
          user.data = {
            id: userInfo[0].id,
            name: userInfo[0].name
          };
        }
        return user;
      })
      .catch(handleError);
  },

  addNewUser: function(name, password){
    var salt;
    // Generate salt for password
    return bcrypt.genSaltAsync(8)
      .then(function(_salt){
        salt = _salt;
        // Generate salted hash
        return bcrypt.hashAsync(password, salt);
      })
      .then(function(hash){
        // Save name, hashed password and salt to DB, then create initial entry in study_queue.
        var q = JSON.stringify([0]);
        return db.run('BEGIN TRANSACTION')
          .run('INSERT OR IGNORE INTO users (name, password, salt) VALUES (?, ?, ?)', name, hash, salt)
          .run('INSERT OR IGNORE INTO study_queue (user_id, queue) SELECT id, ? FROM users WHERE name=?', q, name)
          .run('COMMIT')
          .getAsync('SELECT id, name FROM users WHERE name=? AND password=?', name, hash);
      })
      .catch(handleError);
  },

  addWords: function(userId, wordArray){
    return new Promise(function(resolve, reject){
      var allSeenKanji = [];
      db.serialize(function(){
        db.run('BEGIN TRANSACTION');
        wordArray.forEach(function(word){
          var cleanword = fn.filterKanji(word);
          var kanjiArray = cleanword.split('');
          allSeenKanji = allSeenKanji.concat(kanjiArray); // save big list for later

          // 1. Add word to words table
          stmtCache.addWordToWordsTable.reset().run({$word: word});
          // 2) Add to seen words table for current user_id
          stmtCache.addSeenWords_.reset().run({$userId: userId, $word: word});

          // 3. For each kanji in the word...
          kanjiArray.forEach(function(kanji){
            // 3a. Add kanji to 'kanji' table...
            stmtCache.addKanji.reset().run(kanji);
            // 3b. Add relationship to kanji_words junction table.
            stmtCache.addKanjiWords_.reset().run({$kanji: kanji, $word: word});
            // 3c. Add to seen tables for current user_id
            stmtCache.addSeenKanji.reset().run(userId, kanji);
          });
        });
        db.runAsync('COMMIT')
          // 4. Add kanji to 'study_queue' table...
          .then(fn.enqueue(userId, allSeenKanji))
          .then(resolve);
      });

    });
  },

  // Add to queue (shuffle before adding)
  enqueue: function(userId, kanjiArray){
    return db.getAsync('SELECT queue FROM study_queue WHERE study_queue.user_id = ?', userId)
      .then(function(row){
        var shuffled = fn.shuffleArray(kanjiArray);
        var q = row && JSON.parse(row.queue);
        q = q ? q.concat(shuffled) : shuffled ;
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

  // Read from queue (next kanji_id to show to user)
  getNextFromQueue_: function(userId){
    return db.getAsync('SELECT queue FROM study_queue WHERE user_id = ?', userId)
      .then(function(row){
        var q = JSON.parse(row.queue);
        if (q.length === 0) { return null; }
        var first = q.shift();
        var q_string = JSON.stringify(q);
        db.run('UPDATE study_queue SET queue = ? WHERE user_id = ?', q_string, userId);
        return first;
      })
      .catch(handleError);
  },

  // Get words that the current user has seen thus far, that contain the target kanji
  getSeenWordsRelatedToKanji: getSeenWordsRelatedToKanji,

  // Helper function to strip out non-kanji characters
  filterKanji: function(str){
     return str.replace(/[^\u4e00-\u9faf]/g, '');
  },

  // Helper function to shuffle array before insertion into queued kanji
  shuffleArray: function shuffleArray(arrOrig) {
    var arr = arrOrig.slice();
    var newArr = [];
    while (arr.length) {
      var randomIndex = Math.floor(Math.random() * arr.length);
      newArr.push( arr[randomIndex] );
      arr.splice(randomIndex, 1);
    }

    return newArr;
  },

  // Expose db connection for testing
  _db: db

};