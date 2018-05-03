'use strict';

var User = require('../Model/user.js');

function handleForms(db) {
    
    this.verifyEmail = function(req,res){
        var email = req.params.email;
        var token = req.params.token;
        User.findOne({'local_login.email': email}, function (err, user) {
            if (err) {
               return res.send("Error in user email verification:", err);
            }
            
            // Get the expiry time of the token
            var d = new Date();
            var current_time = d.getTime();
            var expiry_timestamp = new Date(user.local_login.verify_token_expires).getTime();
            
            if (user.local_login.verify_token == token & expiry_timestamp>=current_time ) {

                User.findOneAndUpdate({'local_login.email': email}, {'local_login.isVerified': true}, function (err, resp) {
                    if (err) {
                        //console.log("Error in user email verification:", err);
                        return res.send("Error in user email verification. Error details:", err);
                    }
                    else {
                        //console.log('The user has been verified! Redirecting to start page.',user);
                        return res.redirect('/');
                    }
                });
            } 
            else {
                //console.log('The token is wrong or outdated! Reject the user.');
                return res.send('The token is wrong or outdated!  Your request is rejected.');
            }
        }); 
    };
    
    // Add the ticker to the database
    this.get_portfolio = function(req,res){
        User.findOne({$or:[{'local_login.email': req.params.username},
                           {'social_login.oauthID': req.params.username}]}, function (err, user) {
            if (err) {
               return res.send("Error with user account database:", err);
            }
            
            if (user) {
                //console.log("stock exists. Do not add");
                return res.json(user.stock_list);    
            }
            else{
                //Save the ticker to the list of the users followed tickers
                return res.json(user.stock_list);
            }
        });
     };
    
    // Add the ticker to the database
    this.addTicker = function(userId, symbol, ios, socket, roomId){
        var ticker_name = symbol;
        var stock_exists = "Yes";
        User.findOne({'_id': userId}, function (err, user) {
            if (err) {
               console.error("Error with user account database:", err);
            }
            
            if (user.stock_list.includes(ticker_name)) {
                if (user !== undefined){
                    //console.log("stock exists. Do not add");
                    stock_exists = "Yes";
                    //console.log("Stock exists, calling the emit");
                    ios.to(roomId).emit('stock_exists', {stock_exists: ""+stock_exists, ticker: ""+ticker_name, room: ""+ roomId  });
                    //return res.json(stock_exists);    
                }
                else{
                    console.error("No such user document exists:", user);
                }
            }
            else{
                //Save the ticker to the list of the users followed tickers
                stock_exists = "No";
                user.stock_list.push(ticker_name);
                user.markModified('stock_list');
                user.save(function (err, doc) {
                    if (err) { console.error("Error:", err); }
                    //console.log("Update is successful. Saved document: ", doc);
                });
                ios.to(roomId).emit('stock_exists', {stock_exists: ""+stock_exists, ticker: ""+ticker_name, room: ""+ roomId });
            }
        });
     };
     
     // Delete the ticker from the database
     this.deleteTicker = function(userId,symbol, ios, socket, roomId){
        var ticker_name = symbol;
       
        User.findOne({'_id': userId}, function (err, user) {
            if (err) {
               console.error("Error with database connection during stock ticker actions");
            }

            if (user.stock_list.includes(ticker_name)) {
                if(user !== undefined){
                    //Delete the stock since it exists in the stock list
                    for (let i=0; i<user.stock_list.length; i++){
                        if (user.stock_list[i] === ticker_name) {
                           user.stock_list.splice(i, 1);
                           break;//there will be only one from each record
                        }
                    }

                    user.markModified('stock_list');
                    user.save(function (err, doc) {
                        if (err) { console.error("Error:", err); }
                    });
                    ios.sockets.to(roomId).emit('delete_stock_confirmed', {ticker: ""+ticker_name, room: ""+ roomId });
                }
                else{
                    console.error("No such document exists:", user);
                }
               
            }
            else{
                //No such ticker exists
                console.error("No such ticker exists", user, "User data is:", userId);
                //return res.json("donotdelete");
            }
        });
     };
}

module.exports = handleForms;