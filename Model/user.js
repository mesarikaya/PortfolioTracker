'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var User = new Schema({
   social_login:{
      oauthID: {},
      name: String,
      created: Date
   },
   local_login:{
     email: {
       type: String,
       trim: true
     },
     isVerified: { type: Boolean, default: false },
     verify_token: String,
     verify_token_expires: Date,
     permalink: String,
     password_reset_token: String,
     password_reset_expires: Date,
     password: {
       type: String
     }
   },
   stock_list: Array,
   crypto_list: Array
});

module.exports = mongoose.model('User', User);
