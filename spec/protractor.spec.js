process.env.FACTLY = 'test';
var config = require('../server/config');
var app = require('express')();
var fs = require('fs');


describe('angularjs homepage todo list', function() {
  var localUrl;

  // Setup: Start the server using the test config
  beforeAll(function() {
    require('../server/middleware.js')(app);
    require('../server/routes.js')(app);
    server = app.listen(config.port);
    localUrl = 'http://localhost:' + config.port;
  });

  // Teardown: Shut down server and delete test DB file
  afterAll(function() {
    server.close();
    var fs = require('fs');
    fs.unlink(config.file);
  });

  beforeEach(function(){
    browser.get(localUrl);
  });

  xit('should add a todo', function() {
    browser.get('https://angularjs.org');

    element(by.model('todoList.todoText')).sendKeys('write first protractor test');
    element(by.css('[value="add"]')).click();

    var todoList = element.all(by.repeater('todo in todoList.todos'));
    expect(todoList.count()).toEqual(3);
    expect(todoList.get(2).getText()).toEqual('write first protractor test');

    // You wrote your first test, cross it off the list
    todoList.get(2).element(by.css('input')).click();
    var completedAmount = element.all(by.css('.done-true'));
    expect(completedAmount.count()).toEqual(2);
  });

  it('homepage title sould be KSTool', function(){
    expect(browser.getTitle()).toEqual('KSTool');
  });

  it('homepage title sould be KSTool', function(){
    var username = element(by.model('username'));
    var password = element(by.model('password'));
    var form = element(by.css('form'));

    username.sendKeys('bob');
    password.sendKeys('bob');
    form.submit();
    expect(browser.getLocationAbsUrl()).toEqual('KSTool');
  });

});