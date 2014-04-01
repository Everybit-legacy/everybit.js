var express = require('express');
var port = process.env.PORT || 3000;
var app = express();
var path = require('path');

app.configure(function(){
    app.use(require('less-middleware')(path.join(__dirname, '/public'))); 
    app.use(express.static(__dirname + '/public'));
    app.use('/components',  express.static(__dirname + '/components'));
    app.use(app.router);
    app.use(express.logger());
    
});

app.listen(port, function(){
    console.log('Express server listening on port ' + port);
});