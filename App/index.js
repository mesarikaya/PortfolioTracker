'use strict';

var FormHandler = require(process.cwd() + '/Controllers/formHandler.js');
var Autocomplete = require(process.cwd() + '/Controllers/autocomplete.js');

module.exports = function(app, passport, asyncr, ios) {
    
    // Introduce the backend form handler javascripts
    var formHandler = new FormHandler();
    var autocomplete = new Autocomplete();
    
    // Create authentication check via using passport.js    
    function ensureAuthenticated(req, res, next) {
      console.log("Authentications result is:", req.isAuthenticated());
      if (req.isAuthenticated()){
          // If authentrication is successfull, do the next action
          return next();
      }
      else{
          //Warn the user about logged out status, and redirect to cover page
          res.redirect('/flash');
      }
    }
    

    
    ios.on('connection', function(soc){
        //console.log(socket.request.session);
        //var userId = socket.request.session.passport.user;
        
        //require(process.cwd() + '/Controllers/formHandler.js')(ios, socket);
        //socket.handshake.session.save();
        //when a user logs in it creates its own room
        soc.on('join', function(data) {
          soc.join(data.ch);
          var userId = soc.request.session.passport.user;
        });
        
        //disconnect link
        soc.on('disconnect', function(){
          //console.log('a user connected', userId);
          console.log('user disconnected');
        });
        
        //Delete the stock from the user's portfolio list
        soc.on("remove_stock",function(data){
            var ticker = data.ticker;
            var roomId = data.room;

            //Check if the ticker is undefined or null
            if (ticker !== undefined && ticker !== null && soc.request.session.passport!== undefined){
                var userId = soc.request.session.passport.user;
                formHandler.deleteTicker(userId, ticker, ios, soc, roomId); 
            }
            else{
                console.log("Error: Undefined or null ticker");
            }
        });
        
        //Add the stock ticker to the relevant user room
        soc.on("add_stock",function(data){
            var ticker = data.ticker;
            var roomId = data.room;
            
            //Check if the ticker is undefined or null
            if (ticker !== undefined && ticker !== null && soc.request.session.passport!== undefined){
                var userId = soc.request.session.passport.user;
                formHandler.addTicker(userId, ticker, ios, soc, roomId);
            }
            else{
                console.error("Undefined or null ticker");
            }
        });
    });
    
    // Create safety for attempts to reach the /user interface without authentication
    app.get('/flash', function(req, res){
        // Set a flash message by passing the key, followed by the value, to req.flash().
        req.flash('info','Logged out or Unauthorized Log In Attempt. Please log in!');
        res.redirect('/');
    });
    
    
    // CREATE AUTHENTICATIONS FOR Google, Facebook, LinkedIn, Twitter and Github
    // Sel created authenticate
    // After sign up request, direct to home page for login
    app.route('/auth/sign-up')
        .post(passport.authenticate('auth/sign-up', {successRedirect: '/',
                                                     failureRedirect: '/',
                                                     failureFlash: true })
        );
        
     // After lost-password request, direct to home page for login
    app.route('/auth/lost-password')
        .post(passport.authenticate('auth/lost-password', {successRedirect: '/',
                                                     failureRedirect: '/',
                                                     failureFlash: true })
        );
        
    // Verify the user and redirect to startpage in case of success. In case of error send error.
    app.get('/verify/:email/:token', function (req, res) {
            formHandler.verifyEmail(req,res);
    });
    
    // User sign-in
    app.post('/auth/sign-in',
        passport.authenticate('auth/sign-in', {failureRedirect: '/', failureFlash: true }),
        function(req,res){
            console.log("Redirecting to the user account:", '/user/'+req.user.local_login.email);
            res.redirect('/user/'+req.user.local_login.email);
        });
    
    // GOOGLE AUTHENTICATE
    app.route('/auth/google')
        .get(passport.authenticate('google',
            {scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
            ]}
         ));
    
    // Google callback call
    app.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      function(req, res) {
            res.redirect('/user/'+req.user.social_login.oauthID);
      });
          
    // FACEBOOK AUTHENTICATE   
    app.route('/auth/facebook')
            .get(passport.authenticate('facebook',
                {}
            ));
    
    // Facebook callback call
    app.get('/auth/facebook/callback',
      passport.authenticate('facebook', { failureRedirect: '/' }),
      function(req, res) {
            res.redirect('/user/'+req.user.social_login.oauthID);
    });
    
    //TWITTER AUTHENTICATE   
    app.route('/auth/twitter')
            .get(passport.authenticate('twitter',
                {}
            ));
    
    //Twitter callback call
    app.get('/auth/twitter/callback',
      passport.authenticate('twitter', { failureRedirect: '/' }),
      function(req, res) {
            res.redirect('/user/'+req.user.social_login.oauthID);
    });
    
    //LINKEDIN AUTHENTICATE  
    app.route('/auth/linkedin')
            .get(passport.authenticate('linkedin',
                {}
            ));
    
    //Linkedin callback call
    app.get('/auth/linkedin/callback',
      passport.authenticate('linkedin', { failureRedirect: '/' }),
      function(req, res) {
        res.redirect('/user/'+ req.user.social_login.oauthID);
    });
    
    //GITHUB AUTHENTICATE   
    app.route('/auth/github')
            .get(passport.authenticate('github',
                {}
            ));
    
    //Github callback call
    app.get('/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/' }),
      function(req, res) {
        res.redirect('/user/'+ req.user.social_login.oauthID);
    });
    
    //LOGOUT - After logout go back to opening page
    app.route('/logout')
		.get(function (req, res) {
			req.logout();
            res.redirect('/');
		});
    
    //Direct to home page
    app.route('/')
        .get(function(req,res){
           res.render(process.cwd()+'/Public/views/cover.ejs', {messages: req.flash('info'), signupMessage: req.flash('signupMessage') });
        });
        
    //Direct to user page
    app.route('/user/:username')
         .get(ensureAuthenticated,function(req,res){
            res.sendFile(process.cwd() + '/Public/views/user.html'); 
         });
         
    // Create the autosuggestion list
    app.route('/user/:username/autocomplete')
        .post(ensureAuthenticated, function(req,res){
            // send autocomplete suggestion
	    console.log("Requesting autocomplete");
            autocomplete.search(req, res);
        });
        
    // Add the ticker if it does not exist in the user' stock ticker list
    app.route('/user/:username/portfolio_list')
        .get(ensureAuthenticated, function(req,res){
            //Add the ticker to the database
            formHandler.get_portfolio(req, res);
        });

};
