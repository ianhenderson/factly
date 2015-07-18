var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var checkSession = require('./checkSession');
var app = express();
var port = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', checkSession);
app.use(express.static(__dirname + '/public'));

require('./routes.js')(app);
app.listen(port);

console.log("Server listening on port ", port);