var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);

var io = require('socket.io')(server, {path: '/node/'}).listen(server);

server.listen(3700);

app.get('/node/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log("Connected succesfully to the socket ...");

    var news = [
        {title: 'The cure of the Sadness is to play Videogames', date: '04.10.2016'}
    ];

    socket.emit('news', news);

    socket.on('message', function (data) {
        console.log(data);
        socket.emit('message', data)
    });
});