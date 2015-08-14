var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var checkSession = require('./server/checkSession');
var compression = require('compression');
var app = express();
var port = process.env.PORT || 3000;

app.use(compression());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '2mb'}));
app.use(cookieParser());
app.use('/api', checkSession);
app.use(express.static(__dirname + '/public', {
  maxAge: 2592000000
}));

require('./server/routes.js')(app);
app.listen(port);

console.log("Server listening on port ", port);