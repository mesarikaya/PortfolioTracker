'use strict';

// Create a function that is enclosed and can trigger ajax function and on Ready fucnction
(function ($) {
  // introduce the client side items as variables
  let plot = document.querySelector('#plot');
  let stock_name_input = document.querySelector("#stock_name");
  let apiUrl = 'https://investment-tracker-mesarikaya-1.c9users.io';
  let dataList = document.getElementById('json-datalist');
  let portfolioCard = document.getElementById("Portfolio_Card");
  let portfolioCardinitmsg = document.getElementById("initial_portfolio_msg");
  let alphavantage_url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=";
  let alpha_vantage_intraday = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=';
  let alphavantage_apikey = "LJW6LGHLXU0G7TUG";
  let addStockButton = document.getElementById("AddTicker");
  let Loading_indication = document.querySelector("#Loading");
  let Colors = {};
  var socket = io();
  let card = document.getElementById('_card');
  let url_link = window.location.href; 
   
  //For facebook login, reshape the hashed url extension
  if (window.location.hash == '#_=_' || window.location.hash == '#'){url_link = window.location.href.split('#')[0];}
  url_link = url_link.replace("#","");
   
  //Set the room Id
  let roomId = url_link.split("/")[4].toString();
  socket.emit('join', {ch: roomId });
      
  //Set te Plotly chart data as empty array in refresh
  var plot_data =[];
   
  // Set the color pallette for the Plotly graph
  Colors.names = {
       aqua: "#00ffff",
       azure: "#f0ffff",
       beige: "#f5f5dc",
       black: "#000000",
       blue: "#0000ff",
       brown: "#a52a2a",
       cyan: "#00ffff",
       darkblue: "#00008b",
       darkcyan: "#008b8b",
       darkgrey: "#a9a9a9",
       darkgreen: "#006400",
       darkkhaki: "#bdb76b",
       darkmagenta: "#8b008b",
       darkolivegreen: "#556b2f",
       darkorange: "#ff8c00",
       darkorchid: "#9932cc",
       darkred: "#8b0000",
       darksalmon: "#e9967a",
       darkviolet: "#9400d3",
       fuchsia: "#ff00ff",
       gold: "#ffd700",
       green: "#008000",
       indigo: "#4b0082",
       khaki: "#f0e68c",
       lightblue: "#add8e6",
       lightcyan: "#e0ffff",
       lightgreen: "#90ee90",
       lightgrey: "#d3d3d3",
       lightpink: "#ffb6c1",
       lightyellow: "#ffffe0",
       lime: "#00ff00",
       magenta: "#ff00ff",
       maroon: "#800000",
       navy: "#000080",
       olive: "#808000",
       orange: "#ffa500",
       pink: "#ffc0cb",
       purple: "#800080",
       violet: "#800080",
       red: "#ff0000",
       silver: "#c0c0c0",
       white: "#ffffff",
       yellow: "#ffff00"
   };
    
  // Set the portfolio in the page refresh
  ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', window.location.href, init));

  //Initiate the portfolio and the chart 
  function init(){
     set_portfolio();
  }
   
  //Set the portfolio of the user and call the plot chart method
  function set_portfolio(){
       //Create the AJAX call commands
      let xmlhttp2 = new XMLHttpRequest();
      plot_data = []; //set the plot data to empty
      xmlhttp2.onreadystatechange = function () {
            if (xmlhttp2.readyState == 4 ) {
                if (xmlhttp2.status == 200) {
                    var result =  xmlhttp2.responseText;

                    // Parse the JSON
                    let portfolio = JSON.parse(result);
                    if (portfolio.length>0){
                        //Reset the portfolio content to empty
                        portfolioCardinitmsg.innerHTML="";
                        portfolioCard.innerHTML=""; 
                        
                        //For each item in the portfolio create the Ticker button
                        portfolio.forEach(function(item){
                          var content = portfolioCard.innerHTML;
                          var ticker_name = item;
                          add_ticker(ticker_name, content);//Create the button inside the card
                        });                  
                        
                        //Create the data to send to the plot from Plotly.js
                        var promises = [];
                        for(var i=0; i<portfolio.length;i++){
                           //Get the stock prices via AJAX call to AlphaVantage api and add to the promise list 
                           promises.push(get_stock_value(portfolio[i]));
                           //promises.push(get_intra_day_stock_value(portfolio[i])); // add intraday data promise int the future
                        }
                        
                        //Inform the user that the chart is now in update phase
                        Loading_indication.innerHTML = "Updating the chart data...";
                        
                        //Use Promise.all to wait for all the stock prices retrieved
                        Promise.all(promises).then(
                           values => { 
                             create_chart(plot_data);
                        }); // if all promises are completed, send the data to the create chart function
                    }
                    else{
                      portfolioCardinitmsg.innerHTML="Please add your investment items...";//If there is not item in the portfolio set the default message
                      portfolioCard.innerHTML = "";
                    }
                }
                else{
                    portfolioCardinitmsg.innerHTML="Please add your investment items...";//If AJAX is unsuccessful, set the default message
                    portfolioCard.innerHTML = "";
                }
            }
            else{
                //console.log('something else other than 200 was returned', xmlhttp2.status);
            }
      };
      xmlhttp2.open('GET', url_link+''+ '/portfolio_list', true);
      xmlhttp2.setRequestHeader("Content-type", "application/json");
      xmlhttp2.send();
   }
   
  //Create generic Ajax Call
  /*function makeAjaxCall(url, methodType){
       var promiseObj = new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();
          var data = {};
          xhr.open(methodType, url, true);
          xhr.send();
          xhr.onreadystatechange = function(){
          if (xhr.readyState === 4){
             if (xhr.status === 200){
                console.log("xhr done successfully");
                var result = xhr.responseText;
                data = JSON.parse(result);
                resolve(data);
                
             } else {
                reject(xhr.status);
                console.log("xhr failed");
             }
          } else {
             console.log("xhr processing going on");
          }
       };
       console.log("request sent succesfully");
     });
     return promiseObj;
   }*/
   
  //Make API call to Alphavantage to get the stock realtime daily values
  function get_stock_value(stock_name){
       //Create a Promise Object
       var promiseObj = new Promise(function(resolve, reject){
          //Create the AJAX call within the Promise object
          var xmlhttp = new XMLHttpRequest();
          
          //Alphavantage initial response data
          var data = {};
          xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 ) {
                    if (xmlhttp.status == 200) {
                        var result =  xmlhttp.responseText;
                         
                        //Parse the JSON
                        data = JSON.parse(result);

                        //Push the data to the plot_data array
                        plot_data.push(data);
                        resolve(data);
                    }
                    else{
                       reject(xmlhttp.status);
                       console.log("xhr failed on stock value update promise");
                    }
                }
                else {
                    //console.log('something else other than 200 was returned', xmlhttp.status);
                }
          };
    
          xmlhttp.open('GET', alphavantage_url + stock_name + "&outputsize=full&apikey=" + alphavantage_apikey, true);
          xmlhttp.setRequestHeader("Content-type", "application/json");
          xmlhttp.send();
       });
       return promiseObj;
      
   }
   
   //interval=1min'
   //Make API call to Alphavantage to get the stock realtime values
   /*function get_intra_day_stock_value(stock_name){
          var promiseObj = new Promise(function(resolve, reject){
          var xmlhttp = new XMLHttpRequest();
          //Alpha vantage initial response data
          var data = {};
          xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 ) {
                    if (xmlhttp.status == 200) {
                        var result =  xmlhttp.responseText;
                        console.log("Ajax call is successful for get stock.");
                         
                        //Parse the JSON
                        data = JSON.parse(result);
                        //console.log("Alphavantage response is: ", data);
                        //Push the data to the plot_data array
                        plot_data.push(data);
                        //console.log("push data is now after addition:", stock_name, plot_data);
                        resolve(data);
                    }
                    else{
                       reject(xmlhttp.status);
                       console.log("xhr failed");
                    }
                }
                else {
                    console.log('something else other than 200 was returned', xmlhttp.status);
                }
          };
    
          xmlhttp.open('GET', alpha_vantage_intraday + stock_name + "&interval=15min&outputsize=full&apikey=" + alphavantage_apikey, true);
          xmlhttp.setRequestHeader("Content-type", "application/json");
          xmlhttp.send();
          console.log("Request sent succesfully. Loading data.");
       });
       return promiseObj;
      
   }*/
   
  //Create the chart
  function create_chart(parsedjson){
        //Set the D3.js object
        var d3 = Plotly.d3;
        
        //Unpack the arriving data
        function unpack_data(data,key) {
             var res = [];
             for (var i in data){
                res.push(data[i][key]);
             }
             return res;
        }
        
        //Function to set a random color to the plot line color
        function randomColor () {
            var max = 0xffffff;
            return '#' + Math.round( Math.random() * max ).toString( 16 );
        }
        
        // Function to set the color from the earlier set color pallette
        function set_color(i){
            var color_pallete_len = Object.keys(Colors.names).length;
            if (i<color_pallete_len){
               return color_pallete_len[i];
            }
            else{
               return randomColor();
            }
        }
        
        //Create the data trace for each portfolio item
        let json_size = parsedjson.length;
        let data = [];//Initiate the data as empty array
        let trace ={};//Set the initial data trace for the Plotly
        for (let i=0; i<json_size; i++)
        {
           if (parsedjson[i]["Meta Data"]["2. Symbol"] !== undefined){//If the data exists or in the expected format
               trace = {
                  type: "scatter",
                  mode: "lines",
                  name: parsedjson[i]["Meta Data"]["2. Symbol"],
                  x: Object.keys(parsedjson[i]["Time Series (Daily)"]),
                  y: unpack_data(parsedjson[i]["Time Series (Daily)"], "5. adjusted close"),
                  line: {color: set_color(i)},
                  connectgaps:true
               };
  
               //Push the data to the data
               data.push(trace);
           }
        }

        //Reset the plot depnding on the available width and height on the page
        var WIDTH_IN_PERCENT_OF_PARENT = 100;
        var HEIGHT_IN_PERCENT_OF_PARENT = 60;
         
        var container = d3.select('body');
        var gd3 = container.selectAll("div.plot")
                       .style({
                         width: WIDTH_IN_PERCENT_OF_PARENT + '%',
                         'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 8 + '%',
                         'margin-right': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 8 + '%',
                         height: HEIGHT_IN_PERCENT_OF_PARENT + '%',
                          'margin-top': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 8 + '%',
                          'margin-bottom': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 8 + '%'
                       });
        //Create the plot object
        var plot = gd3.node();
        //Create the layout
        var layout = {
           title: 'PORTFOLIO PERFORMANCE',
           titlefont: {size: 24},
           autosize: true,
           hidesources:	false,
           hoverlabel: { namelength:15,	font:{family:"Arial, sans-serif", size	:	14}},
           xaxis: {
             autorange: true, 
             rangeselector: {buttons: [
                {
                   count: 1, 
                   label: '1d', 
                   step: 'day', 
                   stepmode: 'backward'
                 },
                 {
                   count: 5, 
                   label: '5d', 
                   step: 'day', 
                   stepmode: 'backward'
                 },
                 {
                   count: 7, 
                   label: '1w', 
                   step: 'day', 
                   stepmode: 'backward'
                 },
                 {
                   count: 1, 
                   label: '1m', 
                   step: 'month', 
                   stepmode: 'backward'
                 }, 
                 {
                   count: 3, 
                   label: '3m', 
                   step: 'month', 
                   stepmode: 'backward'
                 }, 
                 {
                   count: 6, 
                   label: '6m', 
                   step: 'month', 
                   stepmode: 'backward'
                 },
                 {
                   count: 12, 
                   label: '1Y', 
                   step: 'month', 
                   stepmode: 'backward'
                 },
                 {
                   count: 36, 
                   label: '3Y', 
                   step: 'month', 
                   stepmode: 'backward'
                 },
                 {
                   count: 60, 
                   label: '5Y', 
                   step: 'month', 
                   stepmode: 'backward'
                 },
                 {step: 'all'}
               ],
               font:{ size:12},
             },
             rangeslider: {}, 
             type: 'date'
           },
           yaxis: {
             autorange: true,
             visible: true,
             type: 'linear',
             rangemode: "normal",
             nticks: 15,
             tickangle: "auto",
             showline: true,
             titlefont:{size: 16}
           },
           hovermode:	"closest",
           hoverdistance:	20,
           spikedistance:	20,
           dragmode	:	"zoom",
           legend:{orientation: "h", x: 0.3, xanchor: "left", y: -0.7, yanchor: "bottom", traceorder: "normal", font:{size:18}},
           showlegend: true
        };
        Loading_indication.innerHTML = "";
        Plotly.newPlot(plot, data, layout);
         
        //Event listener ==> Reset the plot size on screen resize
        window.onresize = function(e) {
             e.preventDefault();
             Plotly.Plots.resize(plot);
        };
    }


  
  //Send the autosuggestions on new potfolio item type
  var changeTimer = false;
  stock_name_input.addEventListener("keyup",function(e){
        if(changeTimer !== false) {
          clearTimeout(changeTimer);
        }
        changeTimer = setTimeout(function(){
            // CALL AJAX to request the autocomplete from the mongodb database
            var post_data = '{"stock_name_data":' + '"' + e.target.value + '"' +'}';
            var xmlhttp2 = new XMLHttpRequest();
            xmlhttp2.onreadystatechange = function () {
                  if (xmlhttp2.readyState == 4 ) {
                      if (xmlhttp2.status == 200) {
                          var result =  xmlhttp2.responseText;

                          // Parse the JSON
                          var jsonOptions = JSON.parse(result);
                          dataList.value = "";
                          dataList.innerHTML="";
                          
                          //Loop over the JSON array.
                          jsonOptions.forEach(function(item) {
                              // Create a new <option> element.
                              var option = document.createElement('option');
                              // Set the value using the item in the JSON array.
                              var option_value= '<strong style="font-color: blue">'+item.Stocks.Ticker+"</strong>"+ " " + 
                                                 item.Stocks.Name + "-" + item.Stocks.Exchange + "-" + item.Stocks.Country;
                              option.innerHTML = option_value;
                              option.style.fontSize = "6px";
                         
                              //Add the <option> element to the <datalist>.
                              dataList.appendChild(option);
                          });

                          //Update the placeholder text.
                          stock_name_input.placeholder = "Search";
                      }
                  }
                  else {
                      //console.log('something else other than 200 was returned', xmlhttp2.status);
                  }
            };

            //Update the placeholder text.
            stock_name_input.placeholder = "Loading options...";
            xmlhttp2.open('POST', url_link + '/autocomplete', true);
            xmlhttp2.setRequestHeader("Content-type", "application/json");
            xmlhttp2.send(post_data);
            changeTimer = false;
        },300);
   });
   
  //Write the abbreviated version of the selected ticker
  stock_name_input.addEventListener("input",function() {
        var val = stock_name_input.value;
        var options = dataList.childNodes;
        for (var i = 0; i < options.length; i++) {
          if (options[i].value === val) {
            //An item was selected from the list
            stock_name_input.value = options[i].value.split(" ")[0];
            break;
          }
        }
   });
  
  //On Add button click for new portfolio item addition, 
  //let the socket emit the add_stock command with the relevant roomId
  addStockButton.addEventListener("click",function(){
      var content = portfolioCard.innerHTML;
      var ticker_name = stock_name_input.value.toUpperCase() ;
      var post_data = '{"ticker_name":' + '"' + ticker_name+ '"' +'}';
      var roomId = url_link.split("/")[4];
      socket.emit('add_stock', {ticker: ticker_name, room: roomId});
      //check_ticker_exists(ticker_name, content);
  });
   
  
   
  // Add the htmel for adding the relvant portfolio item to the portfolio list
  function add_ticker(ticker_name, content){
      content +=  '<div class="row" style="padding-top: 1%; margin: 0.2rem">' + 
                      '<div class="row-fluid">' +
                          '<div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">' +
                             '<div class="btn-group" role="group" aria-label="First group">' +
                                '<button type="button" class="btn btn-sm btn-labeled btn-success deletebutton"' + 
                                    '" style="border-radius: 12px; padding: 0.1rem; font-size: 16px; text-align: center;">' +
                                    ticker_name + '<span class="btn-label">' + 
                                    '<i class="fas fa-times-circle fa-lg" style="float: right;" ' + 'id="' + 
                                    ticker_name + "_delete"+ '" </i>' + '</span>' +
                                '</button>'+
                             '</div>'+
                          '</div>' +
                      '</div>' +
                  '</div>';

      portfolioCard.innerHTML = content;
      portfolioCardinitmsg.innerHTML="";//clear the initial message html
   }
   
  //On click to the delete icon inside the stock ticker, emit the remove_stock action via socket
  Portfolio_Card.addEventListener("click", function(e){
        var id_ = e.target.id;
        var ticker_name = id_.split("_")[0];
        var action=id_.split("_")[1];
        //var post_data = '{"ticker_name":' + '"' + ticker_name+ '"' +'}';
        //If the clicked item is the delete button, do the action, o.w. do nothing
        if  (action==="delete"){
            var roomId = url_link.split("/")[4];
            //Send the emit message
            socket.emit('remove_stock',{ticker: ticker_name, room: roomId});
        }
        
   });

  //Upon receiving the stock_exists information from the socket,
  //check if the sent message is for the right roomId and execute if true
   socket.on('stock_exists', function(data){
           var roomId = url_link.split("/")[4];
           if (data.stock_exists==="No"){//If the portfolio item does not exist

              if (roomId===data.room){//If it is for this room
                  set_portfolio();//Get all the portfolio items againa nd update the chart
              }
              else{
                  console.log("Not the expected room:", data.room, roomId);//The message is not for this room, do nothing
              }
              
           }
           else{
              //console.log("Stock already exists. Stock exits?", data.stock_exists);//IF the stock exists on the user portfolio list, do nothing
           }
      });

   //On confirmation that the stock is deleted from the portfolio list of the user,
   //check if the message is in the right room and reset the chart and portfolio list
   socket.on("delete_stock_confirmed", function(msg){
       var roomId = url_link.split("/")[4];
       if (roomId===msg.room){
           set_portfolio();//Get all the portfolio items againa nd update the chart
       }
       else{
          //console.log("Not the expected room:", msg.room, roomId);//Do nothing, not related to this room
       }
   });

})();
