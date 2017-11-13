var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var port = process.env.PORT || 3700;
var bodyParser = require('body-parser');
var redis = require('redis').createClient();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

redis.psubscribe("onMessage");

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/room/:rname/', function (req, res) {
    if (req.params.rname) {
        res.sendFile(__dirname + '/room.html');
    } else {
        res.redirect('/');
    }
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});


io.on('connection', function (socket) {

    socket.on('join', function (msg) {
        socket.join(msg.room);
    });

    redis.on("pmessage", function (pattern, channel, msg) {
        console.log(pattern, channel, msg);
        socket.to(msg.room).emit(channel, msg);
    });

    socket.on('onMessage', function (msg) {
        socket.to(msg.room).emit('onMessage', {"text": msg.text});
    });
});
