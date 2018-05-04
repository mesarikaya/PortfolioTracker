'use strict';

var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var LinkedinStrategy = require('passport-linkedin-oauth2').Strategy;
var GitHubStrategy = require('passport-github2').Strategy;
//var InstagramStrategy = require('passport-instagram').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var User = require('../Model/user');
var configAuth = require('./oauth');
var randomstring = require('randomstring');
var nodemailer = require('nodemailer');
//var smtpTransport = require("nodemailer-smtp-transport");
var bcrypt = require('bcrypt');


module.exports = function (passport) {
    // PassportJS serialize and deserialize functions
    passport.serializeUser(function(user, done) {
      //console.log('serializeUser: ' + user.id);
      done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user){
          //console.log("Deserializing the user:", user);
          if(!err) done(null, user);
          else done(err, null);
        });
    });
    
    // Function to send the verification email
    function sendEmail(req, email, verification_token, permalink, expiry_timestamp){
        // Use nodemailer.js
        console.log("Email", email+"", "Password:", process.env.password+"");
        var transporter = nodemailer.createTransport("SMTP", {
             service: "hotmail",
             auth: {
               user: 'no_reply_portfolio_tracker@hotmail.com',
               pass: process.env.password +""
             }
        });
        
        // Set the mail options                   
        var mailOptions = {
             from: 'no_reply_portfolio_tracker@hotmail.com',
             to: email + "",
             subject: 'Account Verification Token', 
             text: 'Dear user of ' + email + ',\n\n' + 'We are delighted to see you joining our growing customer base.\n\n' + 
                   'To be able to finalize the sign up process, please verify your account by clicking the link: \n\n' + 
                   'https:\/\/' + req.headers.host + '\/' + 'verify' + '\/' + email + '\/' + verification_token + '.\n\n' +
                   'Thanks for choosing us.\n\n' + 'Kind Regards, \n\n' + 'On behalf of ITrack Team',
        };
        
        // Send the email                   
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
             console.error("Email could not be sent due to error:", error);
          } else {
             console.log('Email sent: ' + info.response);
          }
        });
    }
    
    //Local User registration with passport-local
    passport.use('auth/sign-up', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email and password
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
    
        function (req, email, password, done) {
            // Asynchronous call for local user registration
            // User.findOne wont fire unless data is sent back
            
            process.nextTick(function () {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                
                User.findOne({'local_login.email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err) {
                        return done(err, false, req.flash('signupMessage', 'There is a problem with the database! Error is:' + err));
                    }

                    // Check to see if there is already a user with that email
                    if (user) {
                        //console.log('User email exists!');
                        return done(null, false, req.flash('signupMessage', email + ' is already in use. Please sign-in!'));
                    }
                    else {
                        // Create the user
                        var newUser = new User();
                        
                        //Create a alink and generate a verification token 
                        var permalink = req.body.email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
                        
                        //console.log("permalink is:", permalink);
                        var verification_token = randomstring.generate({length: 64});
                        
                        // SET THE DATABASE(USER) DETAILS
                        // Hash the password and record everything at the same time to the database due to ASYNC behavior
                        const saltRounds = 10;
                        bcrypt.hash(password, saltRounds, function(err, hash) {
                            if (err) { console.log("Hashing error: ", err)}
                            
                            // set the timestamp for verification token expiry: 10 minutges
                            var expiry_duration = 1/6 * 60 * 60 * 1000; // in miliseconds
                            var d = new Date();
                            var expiry_timestamp = d.getTime() + expiry_duration;
                            // Record unique user details
                            newUser.local_login.email = email.toLowerCase();
                            newUser.local_login.password = hash;
                            // Store the permalink.
                            newUser.local_login.permalink = permalink;
                            // Set verified status to False and set the verification token. Isverified will turn to true upon confirmation
                            newUser.local_login.isVerified = false;
                            newUser.local_login.verify_token = verification_token;
                            newUser.local_login.verify_token_expires =  expiry_timestamp;
                            // Try to save the user. If successful, send the verification email
                            try {
                                newUser.save(function (err) {
                                  if (err) {
                                     //console.log("Following error occured:", err);
                                     return done(null, false, req.flash('signupMessage', '*Request could not be done due to Err:' + err));
                                  } 
                                  else 
                                  {
                                     sendEmail(req, email, verification_token, permalink, expiry_timestamp);
                                     return done(null, newUser, req.flash('signupMessage', '*Confirmation email has been successfully sent!'));
                                  }
                                 });
                            }
                            catch (err) {
                                 console.error("Error during user registration phase with error code:", err);
                            }
                       });
                    }
            });
          });
    }));
    
    //Local User lost password request
    passport.use('auth/lost-password', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email and password
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
    
        function (req, email, password, done) {
            // Asynchronous call for local user registration
            // User.findOne wont fire unless data is sent back
            console.log("In the local sign-up 1");
            
            process.nextTick(function () {
                // Find the user with email
                // we are checking to see if the user trying to login already exists
                User.findOne({'local_login.email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err) {
                        return done(err, false, req.flash('signupMessage', 'There is a problem with the database! Error is:' + err));
                    }

                    // Check to see if there is already a user with that email
                    if (!user) {
                        return done(null, false, req.flash('signupMessage', email + ' does not exist!'));
                    }
                    else {
                        //Create a link and generate a verification token 
                        var permalink = req.body.email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
                        
                        //console.log("permalink is:", permalink);
                        var verification_token = randomstring.generate({length: 64});
                        
                        // SET THE DATABASE(USER) DETAILS
                        // Hash the password and record everything at the same time to the database due to ASYNC behavior
                        const saltRounds = 10;
                        bcrypt.hash(password, saltRounds, function(err, hash) {
                            if (err) { console.log("Hashing error: ", err)}
                            
                            // set the timestamp for verification token expiry: 10 min
                            var expiry_duration = 1/6 * 60 * 60 * 1000; // in miliseconds
                            var d = new Date();
                            var expiry_timestamp = d.getTime() + expiry_duration;
                            
                            // Update user verification status
                            user.local_login.isVerified = false;
                            user.local_login.verify_token = verification_token;
                            user.local_login.verify_token_expires = expiry_timestamp;
                            
                            // Try to save the user. If successful, send the verification email
                            try {
                                user.save(function (err) {
                                  if (err) {
                                     return done(null, false, req.flash('signupMessage', '*Request could not be done due to Err:' + err));
                                  } 
                                  else 
                                  {
                                     sendEmail(req, email, verification_token, permalink, expiry_timestamp);
                                     return done(null, user, req.flash('signupMessage', '*Confirmation email has been successfully sent!'));
                                  }
                                });
                            }
                            catch (err) {
                                 console.error("Error during user registration phase with error code:", err);
                            }
                       });
                    }
            });
          });
    }));
    
    
    
    
    // User sign-in protocol
    passport.use('auth/sign-in', new LocalStrategy({
            // By default, local strategy uses username and password, we will override with email and password
            usernameField: 'sign_in_email',
            passwordField: 'sign_in_password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, sign_in_email, sign_in_password, done) {
            // Asynchronous call for local user sign in
            process.nextTick(function () {
                // Find a user whose email is the same as the forms email
                
                User.findOne({'local_login.email': sign_in_email}, function (err, user) {
                    // if there are any errors, return the error
                    if (user!= null){
                        if (err) {
                                return done(err, false, req.flash('signinMessage', '*Sign-in could not be done due to Err:' + err));
                        }
                        else { // Check if password is correct
                            var password_hash = user.local_login.password;
                            bcrypt.compare(sign_in_password, password_hash, function(err, res) {
                                if (err) { 
                                   return done(err, false, req.flash('signupMessage', '*Error:' + err));
                                }
                             
                                if (res){
                                   if(user.local_login.isVerified === true){
                                      return done(null, user);
                                   }
                                   else{
                                      return done(null, false, req.flash('signupMessage', '*Account is not verified. Reactivate account!'));
                                   }
                                }
                                else {
                                   return done(null, false, req.flash('signupMessage', '*Wrong password!'));
                                }
                            });
                          }
                        }
                    else{
                        return done(null, false, req.flash('signupMessage', 'No such account. Please sign up!'));
                    }
                        
                        
                });
                    

            });
        }
    ));
    
    //Google oAuth
    passport.use(new GoogleStrategy({
      clientID: configAuth.googleAuth.clientID,
      clientSecret: configAuth.googleAuth.clientSecret,
      callbackURL: configAuth.googleAuth.callbackURL
      },
      function(accessToken, refreshToken, profile, done) {
        
        	process.nextTick(function () {
              User.findOne({ 'social_login.oauthID': profile.id }, function(err, user) {
      				if (err) {
      					return done(err);
      				}
      
      				if (user) {
      					return done(null, user);
      				} 
      				else {
      					var newUser = new User();
      					
                        //Initiate the user details
      					newUser.social_login.oauthID = profile.id;
      					newUser.social_login.name = profile.displayName;
      					newUser.social_login.created = Date.now();
      					newUser.stock_list = [];
      					newUser.crypto_list = [];
      					
                        //Save the user into the database
      					newUser.save(function (err) {
      						if (err) {
      							throw err;
      						}
      						return done(null, newUser);
      					});
      				}
           });
        });
      }
    ));
    
    
    // Facebook oAuth
    passport.use(new  FacebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
          		process.nextTick(function () {
                  User.findOne({ 'social_login.oauthID': profile.id }, function(err, user) {
            			if (err) {
            				return done(err);
            			}

          				if (user) {
          					return done(null, user);
          				} 
          				else {
          					var newUser = new User();
          					
                            //Initiate the user details
          					newUser.social_login.oauthID = profile.id;
          					newUser.social_login.name = profile.displayName;
          					newUser.social_login.created = Date.now();
          					newUser.stock_list = [];
          					newUser.crypto_list = [];
          					
                            //Save the user into the database
          					newUser.save(function (err) {
          						if (err) {
          							throw err;
          						}
          						return done(null, newUser);
          					});
          				}
                });
      		});
        }
      ));
      
    // Twitter oAuth
    passport.use(new  TwitterStrategy({
        consumerKey: configAuth.twitterAuth.clientID,
        consumerSecret: configAuth.twitterAuth.clientSecret,
        callbackURL: configAuth.twitterAuth.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
          		process.nextTick(function () {
                  User.findOne({ 'social_login.oauthID': profile.id }, function(err, user) {
        				if (err) {
        				  //console.log("profile id is: ", profile.id);
        					return done(err);
        				}
            
          				if (user) {
              					return done(null, user);
              				} 
              				else {
              					var newUser = new User();
              					
                                //Initiate the user details
              					newUser.social_login.oauthID = profile.id;
              					newUser.social_login.name = profile.displayName;
              					newUser.social_login.created = Date.now();
              					newUser.stock_list = [];
              					newUser.crypto_list = [];
              					
                                //Save the user into the database
              					newUser.save(function (err) {
              						if (err) {
              							throw err;
              						}
              						return done(null, newUser);
              					});
              			}
                });
      		});
        }
      ));
    
    
    // Linkedin oAuth
    passport.use(new  LinkedinStrategy({
        clientID: configAuth.linkedinAuth.clientID,
        clientSecret: configAuth.linkedinAuth.clientSecret,
        callbackURL: configAuth.linkedinAuth.callbackURL,
        scope: ['r_basicprofile','r_emailaddress'],
        state: true
        },
        function(accessToken, refreshToken, profile, done) {
          	process.nextTick(function () {
              User.findOne({ 'social_login.oauthID': profile.id }, function(err, user) {
                  
    				if (err) {
    				  //console.log("profile id is: ", profile.id);
    					return done(err);
    				}
        
      				if (user) {
          					return done(null, user);
          			} 
                    else {
      					var newUser = new User();
      					
                        //Initiate the user details
      					newUser.social_login.oauthID = profile.id;
      					newUser.social_login.name = profile.displayName;
      					newUser.social_login.created = Date.now();
      					newUser.stock_list = [];
      					newUser.crypto_list = [];
      					
                        //Save the user into the database
      					newUser.save(function (err) {
      						if (err) {
      							throw err;
      						}
      						return done(null, newUser);
      					});
      				}
                });
      		});
        }
      ));
        
    // Github oAuth
    passport.use(new  GitHubStrategy({
        clientID: configAuth.githubAuth.clientID,
        clientSecret: configAuth.githubAuth.clientSecret,
        callbackURL: configAuth.githubAuth.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
          		process.nextTick(function () {
                  User.findOne({ 'social_login.oauthID': profile.id }, function(err, user) {
        				if (err) {
        				    //console.log("profile id is: ", profile.id);
        					return done(err);
        				}

           				if (user) {
              				return done(null, user);
              			} 
              			else {
          					var newUser = new User();
          					
                            //Initiate the user details
          					newUser.social_login.oauthID = profile.id;
          					newUser.social_login.name = profile.displayName;
          					newUser.social_login.created = Date.now();
          					newUser.stock_list = [];
          					newUser.crypto_list = [];
          					
                            //Save the user into the database
          					newUser.save(function (err) {
          						if (err) {
          							throw err;
          						}
          						return done(null, newUser);
          					});
              			}
                });
      		});
        }
      ));
    
};
    
    

