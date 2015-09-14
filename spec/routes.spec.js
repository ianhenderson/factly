process.env.FACTLY = 'test';
var request = require('supertest');
var config = require('../server/config');
var app = require('express')();
var fs = require('fs');
var agent = request.agent(app); // to save cookies

// Workaround helper for Jasmine + Supertest...
// https://github.com/jasmine/jasmine-npm/issues/31
function finish(done){
  return function(err){
    if (err) done.fail(err);
    else done();
  };
}

var newUser1 = {
  username: 'ian',
  password: 'ian123',
  fact: '日本語盛り上がりの',
  fact_stripped: '日本語盛上'
};

describe("Integration tests:", function() {

  // Setup
  beforeAll(function(){
    require('../server/middleware.js')(app);
    require('../server/routes.js')(app);
  });

  // Teardown
  afterAll(function(){
    var fs = require('fs');
    fs.unlink(config.file);
  });

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

  xit('Get facts when list is empty', function(done) {
    agent
      .get('/api/facts')
      .expect(404)
      .end(finish(done));
  });

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

});
