'use strict';

var mongoose = require('mongoose');
// Connection URL
//var url = process.env.MONGOLAB_URI2 || 'mongodb://localhost:27017/stock_list';
// Connection URL

//Connect to the database
var Schema = mongoose.Schema;

var Stock = new Schema({
   Ticker: String,
   Name: String,
   Exchange: String,
   Category: String,
   Country: String,
   Weight: String,
   Type: String
}, {collection:'stocks'});

module.exports = mongoose.model('Stock', Stock);
