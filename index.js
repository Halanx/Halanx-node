const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io').listen(http);
const port = 3700;
const bodyParser = require('body-parser');
const redis = require('redis').createClient();
const cache = require('redis').createClient();
const online = require('redis').createClient();
const request = require('request');
const axios = require('axios');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

redis.psubscribe("onMessage");
redis.psubscribe("onChat");

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/polls", (req, res) => {
    request({url: "https://api.halanx.com/users/fbsharer/" + req.query.id + '/'}, function (error, response, body) {
        body = JSON.parse(body);
        res.render('polls', {"name": body.name, "img": body.img,});
    });
});

app.post('/vTransactionEvent', function (request, response) {
	var txnObj = request.body;
    var obj = {}
    var token = request.query.token;
    obj.DeliveryAddress = request.query.address;
    obj.AsSoonAsPossible = request.query.isASAP;
    obj.DeliveryDate = request.query.deliverydate;
    obj.StartTime = request.query.starttime;
    obj.EndTime = request.query.starttime;
    obj.Notes = null;
    obj.Latitude = request.query.lat;
    obj.Longitude = request.query.long;
    obj.TransactionID = txnObj.txnid;
    obj.Total = txnObj.amount;
    obj.CashOnDelivery = false;
    obj.PaymentGateway = "payu";
	if (txnObj.status === 'success') {
        response.render('success', {"object": obj,"token":token});
	}
	else {
		response.render("cancel");
	}
});

app.get('/room/:rname/', (req, res) => {
    if (req.params.rname) {
        res.sendFile(__dirname + '/room.html');
    } else {
        res.redirect('/');
    }
});


app.get('/online/:id', (req, res) => {
    const customer_id = req.params.id;
    online.get(customer_id, function (err, id) {
        if (err) throw err;

        if (id) {
            res.json({
                online: true
            })
        } else {
            res.json({
                online: false
            })
        }
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

io.on('connection', function (socket) {

    console.log(socket.id, "Connected");

    socket.on('setCache', function (msg) {
        const id = msg.id;
        cache.get(id, function (err, data) {
            if (err) throw err;

            cache.set(id, socket.id);
            cache.set(socket.id, id);

            if (data != null) {
                console.log("New Customer Id : ", id, " New Socket-Id : ", socket.id);
            } else {
                console.log("Customer Id : ", id, " Socket-Id : ", socket.id);
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
                cache.del(customer_id, function (err, response) {
                    if (response == 1) {
                        console.log(customer_id + ":" + socket.id + " Deleted Successfully!")
                    } else {
                        console.log("Cannot delete Customer to Socket")
                    }
                });
                // Delete socket.id : customer id
                cache.del(socket.id, function (err, response) {
                    if (response == 1) {
                        console.log(socket.id + ":" + customer_id + " Deleted Successfully!")
                    } else {
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
    if (channel === 'onChat') {
        cache.get(msg.receiver, function (err, id) {
            if (err) throw err;

            if (id != null) {
                io.sockets.to(id).emit("onChat", msg);
            }
        });
    } else {
        io.sockets.emit('onMessage', msg);
    }
});
