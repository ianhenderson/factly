var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var checkSession = require('./server/checkSession');
var app = express();
var port = process.env.PORT || 3000;

// require('./server/build')();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', checkSession);
app.use(express.static(__dirname + '/public'));

require('./server/routes.js')(app);
app.listen(port);

console.log("Server listening on port ", port);