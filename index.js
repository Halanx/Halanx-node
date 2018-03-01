var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var port = 3700;
var bodyParser = require('body-parser');
var redis = require('redis').createClient();
var cache = require('redis').createClient();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

redis.psubscribe("onMessage");
redis.psubscribe("onChat");

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

    console.log(socket.id, "Connected");

    socket.on('setCache',function(msg){
        var id = msg.id;
        cache.get(id, function (err, data) {
            if (err) throw err;
    
            if (data != null) {
                socket.disconnect();
            } else {
                cache.set(id,socket.id);
                cache.set(socket.id,id);
                console.log("Customer Id : ", id," Socket-Id : " , socket.id);
            }
        });
    });

    redis.on("pmessage", function (pattern, channel, msg) {
        msg = JSON.parse(msg);
        socket.emit('onMessage', msg);
    });

    socket.on('join', function (msg) {
        socket.join(msg.room);
    });

    socket.on('onMessage', function (msg) {
        socket.to(msg.room).emit('onMessage', {"text": msg.text});
    });

    socket.on('disconnect', function () {
        cache.get(socket.id, function (err, data) {
            if (err) throw err;
    
            if (data != null) {
                // Delete customer id : socket.id
                cache.del(data,function(err,response){
                    if (response == 1) {
                        console.log("Customer-Id:Socket-Id  Deleted Successfully!")
                    } else{
                        console.log("Cannot delete")
                    }
                });
                // Delete socket.id : customer id
                cache.del(socket.id,function(err,response){
                    if (response == 1) {
                        console.log("Socket-Id:Customer-Id Deleted Successfully!")
                    } else{
                        console.log("Cannot delete")
                    }
                });
            }
        });
        console.log(socket.id, "Disconnected");
    })
});
