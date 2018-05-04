'use strict';
var Stock = require('../Model/stock_list.js');
console.log("Inside the autocomplete");        
console.log("Stock list:", Stock);
function autocomplete(db) {

    this.search = function(req, res){
        console.log("searching for data:", req.body.stock_name_data);
        Stock.find({ $or:[{'Stocks.Ticker': { $regex: new RegExp(".*"+req.body.stock_name_data+".*", "i")}},
                          {'Stocks.Name': { $regex: new RegExp(".*"+req.body.stock_name_data+".*", "i")}}]}).sort({'Stocks.Weight': 1}).limit(5)
        .exec(function (err, doc) { 
            if (err) { console.log("Stock list database search resulted with error:", err);}
            if (doc){
                console.log("Stock list:", doc);
                res.json(doc);
            }
        });
    };

}




module.exports = autocomplete;
