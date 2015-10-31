var $ = require('./utils');

var input = `
  <form>
    <label for="ian">Fill it out:</label>
    <input type="text" id="ian" placeholder="type here!">
    <button>Hey!</button>
  </form>  
`;

$.on(document, 'DOMContentLoaded', function(e){
  var body = $.qs('body');
  body.innerHTML = input;
});