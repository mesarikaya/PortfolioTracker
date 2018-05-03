'use strict'

var appUrl = window.location.origin;

var ajaxFunctions = {
   ready: function ready (fn) {
      if (typeof fn !== 'function') {
         return;
      }

      if (document.readyState === 'complete') {
         return fn();
      }

      document.addEventListener('DOMContentLoaded', fn, false);
   },
   ajaxRequest: function ajaxRequest (method, url, callback) {
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = function () {
         if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            //console.log("sent: ", xmlhttp.response);
            callback(xmlhttp.response);
         }
      };

      xmlhttp.open(method, url, true);
      xmlhttp.send();
    },
    ajaxPostRequest: function ajaxRequest (method, url, data, callback) {
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = function () {
         if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            console.log("Sending data to web page.", data, xmlhttp.responseText);
            //window.location.href = "/user";
            if (xmlhttp.responseText === "delete"){
               console.log("******Calling the set portfolio function***********");
               callback();
               window.location.href = "/user";
            }
            else{
               console.log("Sth went wrong and did not call the callback function set portfolio");
            }
         }
      };

      xmlhttp.open(method, url, true);
      xmlhttp.setRequestHeader("Content-type", "application/json");
      xmlhttp.send(data);
   }
};