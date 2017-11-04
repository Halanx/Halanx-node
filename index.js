var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: '/node/'}).listen(http);
var port = process.env.PORT || 3700;

app.get('/node/', function (req, res) {
    console.log(req.headers);
    res.sendFile(__dirname + '/index.html');
});


http.listen(port, function () {
    console.log('listening on *:' + port);
});


io.on('connection', function (socket) {
    socket.on('onmessage', function (msg) {
        io.emit('onmessage', msg);
    });
});