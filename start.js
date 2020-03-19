// eslint-disable-next-line import/no-extraneous-dependencies
require('@babel/register')({
  presets: ['@babel/preset-env'],
});

require('dotenv').config()

module.exports = require('./server');
