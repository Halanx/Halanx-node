var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: '/node/'})(http);
var port = process.env.PORT || 3700;

app.get('/node/', function(req, res){
    res.sendFile(__dirname + '/index1.html');
});

io.on('connection', function(socket){
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});