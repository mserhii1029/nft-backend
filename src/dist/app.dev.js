"use strict";

var express = require('express');

var helmet = require('helmet');

var xss = require('xss-clean');

var mongoSanitize = require('express-mongo-sanitize');

var compression = require('compression');

var cors = require('cors');

var passport = require('passport');

var httpStatus = require('http-status');

var config = require('./config/config');

var morgan = require('./config/morgan');

var _require = require('./config/passport'),
    jwtStrategy = _require.jwtStrategy;

var _require2 = require('./middlewares/rateLimiter'),
    authLimiter = _require2.authLimiter;

var routes = require('./routes/v1');

var v2Routes = require('./routes/v2');

var _require3 = require('./middlewares/error'),
    errorConverter = _require3.errorConverter,
    errorHandler = _require3.errorHandler;

var ApiError = require('./utils/ApiError');

var app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
} // set security HTTP headers


app.use(helmet()); // parse json request body

app.use(express.json()); // parse urlencoded request body

app.use(express.urlencoded({
  extended: true
})); // sanitize request data

app.use(xss());
app.use(mongoSanitize()); // gzip compression

app.use(compression()); // enable cors

app.use(cors());
app.options('*', cors()); // jwt authentication

app.use(passport.initialize());
passport.use('jwt', jwtStrategy); // limit repeated failed requests to auth endpoints

if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
} // v1 api routes


app.use('/v1', routes);
app.use('/v2', v2Routes); // send back a 404 error for any unknown api request

app.use(function (req, res, next) {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
}); // convert error to ApiError, if needed

app.use(errorConverter); // handle error

app.use(errorHandler);
module.exports = app;