var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

require('./routes.js')(app);
app.listen(port);

console.log("Server listening on port ", port);