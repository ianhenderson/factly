var config = require('./server/config');
var app = require('express')();

require('./server/middleware.js')(app);
require('./server/routes.js')(app);

app.listen(config.port);
console.log("Server listening on port ", config.port);