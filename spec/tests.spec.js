process.env.FACTLY = 'test';
var request = require('supertest');
var config = require('../server/config');
var app = require('express')();
var fs = require('fs');
var agent = request.agent(app); // to save cookies
var jsdom = require("jsdom");

// Workaround helper for Jasmine + Supertest...
// https://github.com/jasmine/jasmine-npm/issues/31
function finish(done){
  return function(err){
    if (err) done.fail(err);
    else done();
  };
}

function uniqs(str){
  var hash = {};
  str.split('').forEach(function(c){
    hash[c] = true;
  });
  return Object.keys(hash).join('');
}

// Dummy data
var newUser1 = {
  username: 'ian',
  password: 'ian123',
  fact: ['日本語盛り上がりの'],
  fact_stripped: '日本語盛上',
  facts: [
    '名称は、',
    '宇宙の膨張を発見した天文学者・エドウィン',
    'ハッブルに因む。'
  ],
  facts_stripped: '名称宇宙膨張発見天文学者因',
};

describe("Tests:", function() {

  var server;
  var db;

  // Setup: Start the server using the test config
  beforeAll(function(){
    require('../server/middleware.js')(app);
    require('../server/routes.js')(app);
    server = app.listen(config.port);
    db = require('../server/db.js')._db;
    filter = require('../server/db.js').filterKanji;
  });

  // Teardown: Shut down server and delete test DB file
  afterAll(function(){
    server.close();
    var fs = require('fs');
    fs.unlink(config.file);
  });

  describe('Server tests -', function(){

    it('Get kanji w/out session', function(done) {
      agent
        .get('/api/kanji')
        .expect(403)
        .end(finish(done));
    });

    it('Sign up', function(done) {
      var expectedResponse = {
        id: 1,
        name: newUser1.username
      };
      agent
        .post('/api/signup')
        .send(newUser1)
        .expect(201, expectedResponse)
        .end(finish(done));
    });

    it('Sign in w/ wrong info', function(done) {
      var badInfo = {
        username: newUser1.username,
        password: 'abcdefg'
      };
      agent
        .post('/api/login')
        .send(badInfo)
        .expect(403)
        .end(finish(done));
    });

    it('Sign in w/ correct info', function(done) {
      var goodInfo = {
        username: newUser1.username,
        password: newUser1.password
      };
      var expectedResponse = {
        id: 1,
        name: newUser1.username
      };
      agent
        .post('/api/login')
        .send(goodInfo)
        .expect(200, expectedResponse)
        .end(finish(done));
    });

    it('Get kanji when list is empty', function(done) {
      agent
        .get('/api/kanji')
        .expect(404)
        .end(finish(done));
    });

    // it('Get facts when list is empty', function(done) {
    //   agent
    //     .get('/api/facts')
    //     .expect(404)
    //     .end(finish(done));
    // });

    it('Add words', function(done) {
      var fact = {
        fact: newUser1.fact
      };

      agent
        .post('/api/facts')
        .send(fact)
        .expect(201)
        .end(finish(done));
    });

    describe('DB Integrity - ', function(){

      it('add words to words table', function(done){
        db.all('SELECT * FROM words', function(err, rows){
          expect(rows.length).toEqual(1);
          done();
        });
      });

      it('add kanji to kanji table', function(done){
        db.all('SELECT * FROM kanji', function(err, rows){
          expect(rows.length).toEqual(newUser1.fact_stripped.length);
          done();
        });
      });

      it('add kanji-word relations to kanji_words table', function(done){
        db.all('SELECT * FROM kanji_words', function(err, rows){
          var uniqChars = uniqs(newUser1.fact_stripped);
          expect(rows.length).toEqual(uniqChars.length);
          done();
        });
      });

      it('add words to seen_words table', function(done){
        db.all('SELECT * FROM seen_words', function(err, rows){
          expect(rows.length).toEqual(1);
          done();
        });
      });

      it('add kanji to seen_kanji table', function(done){
        db.all('SELECT * FROM seen_kanji', function(err, rows){
          expect(rows.length).toEqual(newUser1.fact_stripped.length);
          done();
        });
      });

      it('add kanji to study_queue table', function(done){
        db.all('SELECT * FROM study_queue', function(err, rows){
          var queue = JSON.parse(rows[0].queue);
          var q2string = queue.join('');
          expect(q2string).toEqual(newUser1.fact_stripped);
          done();
        });
      });
    })


    describe('Get kanji when list is non-empty:', function(){

      var kanjiOnly = newUser1.fact_stripped.split('');

      it('Non-kanji characters should be stripped out', function(done) {
        var k = kanjiOnly.shift(); // 日
        agent
          .get('/api/kanji')
          .expect(200, k)
          .end(finish(done));
      });
      
      it('Non-kanji characters should be stripped out', function(done) {
        var k = kanjiOnly.shift(); // 本
        agent
          .get('/api/kanji')
          .expect(200, k)
          .end(finish(done));
      });
      
      it('Non-kanji characters should be stripped out', function(done) {
        var k = kanjiOnly.shift(); // 語
        agent
          .get('/api/kanji')
          .expect(200, k)
          .end(finish(done));
      });
      
      it('Non-kanji characters should be stripped out', function(done) {
        var k = kanjiOnly.shift(); // 盛
        agent
          .get('/api/kanji')
          .expect(200, k)
          .end(finish(done));
      });
      
      it('Non-kanji characters should be stripped out', function(done) {
        var k = kanjiOnly.shift(); // 上
        agent
          .get('/api/kanji')
          .expect(200, k)
          .end(finish(done));
      });
      
      it('All chars in queue seen', function(done) {
        agent
          .get('/api/kanji')
          .expect(404)
          .end(finish(done));
      });
      
    });

    it('Add multiple words', function(done) {
      var fact = {
        fact: newUser1.facts
      };

      agent
        .post('/api/facts')
        .send(fact)
        .expect(201)
        .end(finish(done));
    });

    describe('DB Integrity 2 - ', function(){

      var uniqChars = uniqs(
        newUser1.fact_stripped + 
        newUser1.facts_stripped
      );

      // should be one kanji-word relation for each char seen
      var fact = newUser1.fact_stripped
      var facts = newUser1.facts_stripped;
      var allChars = fact + facts;
      var relations = allChars.length;

      it('add words to words table', function(done){
        db.all('SELECT * FROM words', function(err, rows){
          expect(rows.length).toEqual(4);
          done();
        });
      });

      it('add kanji to kanji table', function(done){
        db.all('SELECT * FROM kanji', function(err, rows){
          expect(rows.length).toEqual(uniqChars.length);
          done();
        });
      });

      it('add kanji-word relations to kanji_words table', function(done){
        db.all('SELECT * FROM kanji_words', function(err, rows){
          expect(rows.length).toEqual(relations);
          done();
        });
      });

      it('add words to seen_words table', function(done){
        db.all('SELECT * FROM seen_words', function(err, rows){
          expect(rows.length).toEqual(4);
          done();
        });
      });

      it('add kanji to seen_kanji table', function(done){
        db.all('SELECT * FROM seen_kanji', function(err, rows){
          expect(rows.length).toEqual(relations);
          done();
        });
      });

      it('add kanji to study_queue table', function(done){
        db.all('SELECT * FROM study_queue', function(err, rows){
          var queue = JSON.parse(rows[0].queue);
          var q2string = queue.join('');
          expect(q2string).toEqual(newUser1.facts_stripped);
          done();
        });
      });
    })

    it('Logout', function(done) {
      agent
        .post('/api/logout')
        .expect(200)
        .end(finish(done));
    });

    it('Get after logout', function(done) {
      agent
        .get('/api/kanji')
        .expect(403)
        .end(finish(done));
    });
    
  });

  xdescribe('Browser tests -', function(){

    var $;
    var angular;
    var module;
    var injector;
    var window;
    var document;
    var qs;
    var qsa;

    // Helper function to set up a window
    beforeEach(function(done){
      jsdom.env({
        url: 'http://localhost:3000/',
        features: {
          FetchExternalResources: ["script"],
          ProcessExternalResources: ["script"],
        },
        done: function(errors, win){
          // DOM helpers for tests
          window = win;
          document = window.document;
          angular = window.angular;
          module = angular.module;
          $ = angular.element;
          injector = $(document.body).injector();
          qs = function(sel){
            return document.querySelector(sel);
          };
          qsa = function(sel){
            return document.querySelectorAll(sel);
          };

          done();
        }
      });
    });

    describe('Basic JSDOM tests -', function(){

      it('should load Angular', function(done){
        console.log(window);
        expect(angular).toBeDefined();
        done();
      });

      it('should load the main app', function(done){
        var app = module('KSTool');
        expect(app).toBeDefined();
        done();
      });

      it('should have a $ selector', function(done){
        expect($).toBeDefined();
        done();
      });

      it('should be able to get an instance of a service', function(done){
        var K = injector.get('K');
        var AuthService = injector.get('AuthService');
        expect(K).toBeDefined();
        expect(AuthService).toBeDefined();
        done();
      });

    });

    describe('Angular tests -', function(){

      it('should login', function(done){
        module('KSTool');
        // console.log('before', document.location.href);
        // var inputs = qsa('#index input');
        // var button = qs('#index button');
        // console.log(inputs);
        // console.log(document.documentElement.outerHTML);
        // inputs[0].value = 'hey';
        // inputs[1].value = 'hey';
        // button.click();
        // console.log('after', document.location.href);
        expect(true).toEqual(false);
        done();
      });

    });

  });

});
