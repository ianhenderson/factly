var $ = require('../utils');
var Routes = require('../routes');
var Page = require('page');

var input = `
  <form>
    <label for="ian">Fill it out:</label>
    <input type="text" id="ian" placeholder="type here!">
    <button id="navigate">Hey!</button>
  </form>  
`;

function attachRouter(){
  var el = $.qs('form');
  $.on(el, 'submit', function(e){
    e.preventDefault();
    var path = $.qs('form input').value;
    Page('/'+path);
  })
}

function init(){
  var body = $.qs('body');
  body.innerHTML = input;
  attachRouter();
}

module.exports = {
  init: init
};