var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session=require('express-session');
var passport=require('passport');
var FacebookStrategy=require('passport-facebook').Strategy;
var print = require('./routes/print').routes;
var user = require('./routes/users').routes;
var shop=require('./routes/shops').routes;
var orders=require('./routes/orders').routes;
var config=require('./config/config.js');
var ConnectMongo=require('connect-mongo')(session);
var configDB=require('./config/database');
var mongoose=require('mongoose').connect(configDB.url);
var env=process.env.NODE_ENV||'development';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
var sessionSchema=mongoose.Schema({
  user:String
});

var ssn=mongoose.model('sessions',sessionSchema);
var yadu=new ssn({
  user:'yadunandan4992@gmail.com'
});
yadu.save(function(err)
{
if(!err)
{
  console.log('done!!');
}
  
});

if(env==='development')
{
  //development level settings
  app.use(session({secret:config.sessionSecret,saveUninitialized:true,resave:true}));
}
else
{
  //production level settings
  app.use(session({secret:'printing app',saveUninitialized:true,resave:true,
    store:new ConnectMongo({
      mongooseConnection:mongoose.connections[0],
      stringify:true
    })
  }));
}
console.log('env: '+env);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/prints', print);
app.use('/users',user);
app.use('/shops',shop);
app.use('/orders',orders);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
require('./auth/passportauth.js')(passport,FacebookStrategy,config,mongoose);
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {err:'some server issue please bear with us!!'}
  });
});

module.exports = app;
