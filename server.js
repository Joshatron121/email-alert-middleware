'use strict';

const express = require('express');
const morgan = require('morgan');
const emailer = require('./emailer');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

const {logger} = require('./utilities/logger');
// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

app.use((err, req, res, next) => {
  if (err.name == 'FooError' || err.name == 'BarError') {
    let emailData = { 
      from: "arkanoxphotography@gmail.com", 
      to: "jeimer3184@gmail.com",
      subject: `Alert: a ${err.name} occured`,
      text: `Error: ${err.message}. Stack Trace: ${err.stack}`,
      html: `<p>Error: ${err.message}</p><p>Stack Trace: ${err.stack}</p>`
    }
    emailer.sendEmail(emailData);
    res.status(500).json({error: `Application threw a ${err.name}`}).end();
    
  } else {
    console.log('BizzError: Don\'t send')
    res.status(500).json({error: `Application threw a ${err.name}`}).end();
  }
  
})


app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
