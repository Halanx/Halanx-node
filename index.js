var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var port = 3700;
var bodyParser = require('body-parser');
var redis = require('redis').createClient();
var cache = require('redis').createClient();
var request = require('request');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('view engine','ejs');

redis.psubscribe("onMessage");
redis.psubscribe("onChat");

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get("/polls",(req,res,next)=>{
    request({url:"https://api.halanx.com/users/fbsharer/"+req.query.id +'/'},
    function(error, response, body) { 
        body = JSON.parse(body);
        res.render('polls',{"name":body.name,"img":body.img,});
    }); 
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
    
            cache.set(id,socket.id);
            cache.set(socket.id,id);

            if (data != null) {
                console.log("New Customer Id : ", id," New Socket-Id : " , socket.id);
            } else {
                console.log("Customer Id : ", id," Socket-Id : " , socket.id);
            }
        });
    });

    socket.on('join', function (msg) {
        socket.join(msg.room);
    });

    socket.on('onMessage', function (msg) {
        socket.to(msg.room).emit('onMessage', {"text": msg.text});
    });

    socket.on('disconnect', function () {
        cache.get(socket.id, function (err, customer_id) {
            if (err) throw err;
    
            if (customer_id != null) {
                // Delete customer id : socket.id
                cache.del(customer_id,function(err,response){
                    if (response == 1) {
                        console.log( customer_id +":" + socket.id  +  " Deleted Successfully!")
                    } else{
                        console.log("Cannot delete Customer to Socket")
                    }
                });
                // Delete socket.id : customer id
                cache.del(socket.id,function(err,response){
                    if (response == 1) {
                        console.log( socket.id + ":" + customer_id  + " Deleted Successfully!")
                    } else{
                        console.log("Cannot delete Socket id to Customer")
                    }
                });
            }
        });
        console.log(socket.id, "Disconnected");
    })
});

redis.on("pmessage", function (pattern, channel, msg) {
    msg = JSON.parse(msg);
    if(channel == 'onChat'){
        cache.get(msg.receiver,function(err,id){
            if (err) throw err;
            
            if(id != null){
                socket.to(id).emit("onChat",msg);
            }
        });
    }else{
        socket.emit('onMessage', msg);
    }
});
