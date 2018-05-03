'use strict';

var express = require('express');
var session = require('express-session');

var mongoose = require('mongoose');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
//var mongo = require('mongodb');
var routes = require('./App/index.js');
var bodyParser = require('body-parser');
var ejs = require("ejs");
var asyncr = require('async');
var http = require('http');
var io = require('socket.io');
var sharedsession = require("express-socket.io-session");
var MongoDBStore = require('connect-mongodb-session')(session);

//Easy autocomplete
//var easyAutocomplete =require("easy-autocomplete");

//Introduce packages for oAuth
var passport = require('passport');

var app = express();
require('dotenv').load();
require('./config/passport')(passport);

//Connect to the database
var url = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/investment-app';
mongoose.connect(url, {
  useMongoClient: true,
});
mongoose.Promise = global.Promise;

var store = new MongoDBStore(
  {
    uri: url,
  });

// Configure
app.use(express.static(process.cwd() + "/Controllers"));
app.use(express.static(process.cwd() + "/Stock_list"));
app.use(express.static(process.cwd() + "/Public"));
app.use(express.static(process.cwd() + "/Public/styles"));
app.set('views', __dirname + '/Public/views');
app.engine('html', ejs.renderFile); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser('keyboard cat'));
app.use(flash());

var sessionMiddleware = session({
   	secret: process.env.session_secret,
   	resave: false,
   	saveUninitialized: true,
    cookie: { maxAge:  new Date(Date.now() + 3600000), secure: 'auto' },
    store: store
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());


//initialize a simple http server
let port = process.env.PORT || 8000;
const server = http.createServer(app);

server.listen(port, function() {
    console.log('Node.js listening on port ', ":" + port);
});

//initialize the WebSocket server instance
var ios = io.listen(server);
// ios.use(sharedsession(sessionMiddleware, {
//     autoSave:true
// }));
ios.use(function(socket, next){
        // Wrap the express middleware
        console.log("Wrap the session middleware");
        sessionMiddleware(socket.request, {}, next);
    });

//call the app
routes(app, passport, asyncr, ios);


// Send current time to all connected clients
/*function sendTime() {
    ios.emit('time', { time: new Date().toJSON() });
}

// Send current time every 10 secs
setInterval(sendTime, 10000);*/

// Emit welcome message on connection
/*ios.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('welcome', { message: 'Welcome!', id: socket.id });

    socket.on('i am client', console.log);
});*/

//for testing, we're just going to send data to the client every second
/*setInterval( function() {

  
   // our message we want to send to the client: in this case it's just a random
    //number that we generate on the server
  
  var msg = Math.random();
  ios.emit('message', msg);
  console.log (msg);

}, 1000);*/




