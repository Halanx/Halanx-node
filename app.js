var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);

var io = require('socket.io')(server, { path: '/sockets/test/' }).listen(server);

server.listen(3700);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static('node_modules'));

io.on('connection', function (socket) {
    console.log("Connected succesfully to the socket ...");

    var news = [
        {title: 'The cure of the Sadness is to play Videogames', date: '04.10.2016'},
    ];

    socket.emit('news', news);

    socket.on('my other event', function (data) {
        console.log(data);
    });
});