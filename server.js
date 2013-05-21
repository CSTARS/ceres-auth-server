/**
 * CERES AUTH SERVER
 * 
 * Methods
 *  - /rest/addCeresUser
 *  - /rest/addOauthUser
 *  - /rest/verifyCeresUser
 *  - /rest/approveUser
 *  - /rest/addUserRole
 *  - /rest/getUser
 */
// config stuff
// how long a password must be
var PASSWORD_LENGTH = 5;

// current app url
var rootUrl = "http://localhost:4000"


// init stuff
var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var app = express();
var MongoClient = require('mongodb').MongoClient, db;
var bcrypt = require('bcrypt');
var md5 = require('MD5');
var ObjectId = require('mongodb').ObjectID;
var email = require('./email');

// collections
var users, pending, apps;

// logged in admins.  Those are people are who are using the admin interface
var users = {};

var DEBUG = true;

// setup passport middleware
app.configure(function() {
	app.use(express.cookieParser()); 
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'whatdidyouthinkthiswasgoingtobeeasy' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

// setup passport
passport.serializeUser(function(user, done) {
	done(null, user.username);
});

passport.deserializeUser(function(id, done) {
  if( users[id] ) return done(null, users[id]);
  done("not logged in");
});

app.get('/admin/rest/isLoggedIn', function(req, res){
	if( req.user ) {
		res.send({
			status : true,
			user   : req.user
		})
		return;
	}
	
	res.send({status:false});
});

passport.use(new GoogleStrategy({
    returnURL: rootUrl+'/auth/google/return',
    realm: rootUrl+"/"
  },
  function(identifier, profile, done) {
	
	var user = {
		identifier : identifier,
		username   : profile.emails[0].value,
		name       : profile.displayName,
		provider   : 'Google'
	};
	
	// query mongo and make sure user is in admin app with role superuser
	users.find({username: user.username, app: 'admin'}).toArray(function(err, items) {
		if( err ) return done(err.message, null);
		if( items.length == 0 ) return done('user doesnt exist', null);
		var user = items[0];
		
		if( user.roles.indexOf('superadmin') > -1 ) {
			users[user.username] = user;
			done(null, user);
		} else {
			done("not a superadmin", null);
		}
	});
  }
));

// google auth rest end points
app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/return', 
		passport.authenticate('google', { successRedirect: '/',
		                       			  failureRedirect: '/login.html' }));


// setup mongo db connections
MongoClient.connect("mongodb://localhost:27017/auth", function(err, database) {
	if( err ) return console.log(err);
	db = database;
	if( DEBUG ) console.log("Connected to db: localhost:27017");
	  
	db.collection("users", function(err, collection) { 
		if( err ) return console.log(err);
		if( DEBUG ) console.log("Connected to collection: users");
		users = collection;
	});
	
	db.collection("pending", function(err, collection) { 
		if( err ) return console.log(err);
		if( DEBUG ) console.log("Connected to collection: pending");
		pending = collection;
	});
	
	db.collection("apps", function(err, collection) { 
		if( err ) return console.log(err);
		if( DEBUG ) console.log("Connected to collection: apps");
		apps = collection;
	});
});


// static content
app.use("/", express.static(__dirname+"/public"));

app.all("/*", isValidRequest, function(req, res, next) {
	  next(); // if the middleware allowed us to get here,
	          // just move on to the next route handler
});

/**
 * ADD CERES USER
 * 
 * add a user to the pending list
 * they will still need to verify email and then be approved by admin
 */
app.post('/rest/addCeresUser', function(req, res){
		
	var app = req.body.app;
	var username = req.body.username;
	var password = req.body.password;
	
	if( !username || !password || !app ) {
		return res.send({error: true, message:"password, username, app required"});
	}
	
	if( password.length < PASSWORD_LENGTH ) {
		return res.send({error: true, message:"password too short, must be "+PASSWORD_LENGTH+" characters"});
	}
	
	if( username.length < 7 ) {
		return res.send({error: true, message:"username too short, must be at least 7 characters and a valid email address"});
	}
	
	// make sure user doesn't already exist
	users.find({username: username, app: app}).toArray(function(err, items) {
		if( err ) return res.send(err);
		if( items.length > 0 ) return res.send({error: true, message:"username already taken"});
		
		pending.find({username: username, app: app}).toArray(function(err, items){
			if( err ) return res.send(err);
			if( items.length > 0 ) return res.send({error: true, message:"username already waiting to be verified"});
			
			// hash the password
			var salt = bcrypt.genSaltSync(10);
			var hash = bcrypt.hashSync(password, salt);
			var key = md5(bcrypt.hashSync(new Date().getTime()+"", salt));
			
			var data = {
				username  : username,
				password  : hash,
				app       : app,
				verified  : false,
				timestamp : new Date().getTime(),
				key       : key,
				authority : "ceres"
			};
			
			pending.insert(data, {w :1}, function(err, result) {
				if( err ) return res.send(err);
				
				sendVerificationEmail(username, key, function(error){
					var err = error ? true : false;
					pending.update({_id:result._id},{$set: { emailError : err} }, function(err,resp){});

				});
				// email user
				
				
				res.send({success:true,message:"user set to pending"});
			});
		});
	});
});

function sendVerificationEmail(username, key, callback) {
	// setup e-mail data with unicode symbols
	var mailOptions = {	
	    from: "Ceres Authentication <auth@ceres.ca.gov>", // sender address
	    to: username, // list of receivers
	    subject: "Verify Email Address", // Subject line
	    html: "Hello <b>"+username+"</b>,<br /><br />" +
	    	  "Please <a href='"+rootUrl+"/verify.html?t="+key+"'>"+
	    	  "Click Here</a> to verify your email and complete your registration process" +
	    	  "<br /><br />-Thanks<br />Ceres Dev Team"
	}
	email.send(mailOptions, callback);
}


/**
 * ADD OAUTH USER
 * 
 * add a user to the pending list
 * they will still need to verify email and then be approved by admin
 */
app.post('/rest/addOauthUser', function(req, res){
		
	var app = req.body.app;
	var username = req.body.username;
	var authority = req.body.authority;
	
	if( !username || !app || !authority ) {
		return res.send({error: true, message:"username, app, authority required"});
	}
	
	// make sure user doesn't already exist
	users.find({username: username, app: app}).toArray(function(err, items) {
		if( err ) return res.send(err);
		if( items.length > 0 ) return res.send({error: true, message:"username already taken"});
		
		pending.find({username: username, app: app}).toArray(function(err, items){
			if( err ) return res.send(err);
			if( items.length > 0 ) return res.send({error: true, message:"username already waiting to be verified"});
			
			var data = {
				username  : username,
				app       : app,
				verified  : true,
				timestamp : new Date().getTime(),
				authority : authority
			};
			
			pending.insert(data, {w :1}, function(err, result) {
				if( err ) return res.send(err);
				res.send({success:true,message:"user set to pending"});
			});
		});
	});
});


/**
 * VERIFY EMAIL
 * 
 * sets a pending user to verified status in the pending table
 */
app.get('/rest/verifyCeresUser', function(req, res){
	
	// You don't need to be logged in to do this
	//if( !isValidRequest(req) ) return res.send({error:true,message:"nope."});
	
	var key = req.query.t;
	
	if( !key ) {
		res.send({error:true,message:"missing key"});
	}
	
	pending.find({key: key}).toArray(function(err, result){
		if( err ) return res.send(err);
		if( result.length == 0 ) return res.send({error:true,message:"invalid key"});
		if( result[0].verified ) return res.send({error:true,message:"Email already verified"});
		
		pending.update({_id: ObjectId(result[0]._id+"")}, { $set : {verified: true} }, function(err){
			if( err ) return res.send(err);
			
			// send app info
			apps.find({_id:ObjectId(result[0].app)}).toArray(function(err, resp){
				var app = {};
				if( resp && resp.length > 0 ) app = resp[0];
				res.send({success:true,message:"user verified",app:app});
			});
			
		});
	});
});

/**
 * APPROVE USERS
 * 
 * Approve any user CERES or Oauth
 */
app.post('/rest/approveUser', function(req, res){
		
	var username = req.body.username;
	var app = req.body.app;
	
	if( !username || !app ) {
		res.send({error:true,message:"missing username or app"});
	}
	
	pending.find({username: username, app: app}).toArray(function(err, result){
		if( err ) return res.send(err);
		if( result.length == 0 ) return res.send({error:true,message:"invalid username"});
		
		var user = {
			username  : result[0].username,
			password  : result[0].password,
			app       : result[0].app,
			authority : result[0].authority,
			timestamp : result[0].timestamp,
			roles     : result[0].roles ? result[0].roles : []
		};
		
		users.insert(user, {w: 1}, function(err, result) {
			if( err ) return res.send(err);
			
			pending.remove({username: user.username, app : user.app}, { $set : {verified: true} }, function(err){
				if( err ) return res.send(err);
				res.send({success:true,message:"user approved"});
			});
		});
	});
});

/**
 * REJECT USERS
 * 
 * Reject any user CERES or Oauth
 */
app.post('/rest/rejectUser', function(req, res){
		
	var username = req.body.username;
	var app = req.body.app;
	
	if( !username || !app ) {
		res.send({error:true,message:"missing username or app"});
	}
	
	pending.remove({username: username, app : app}, function(err){
		if( err ) return res.send(err);
		res.send({success:true,message:"user rejected"});
	});
	
});

/**
 * ADD USER ROLE(s)
 * 
 * add user to a role for an application
 */
app.post('/rest/setUserRoles', function(req, res) {
		
	var username = req.body.username;
	var app = req.body.app;
	var roles = req.body.roles;
	
	if( !username || !app || !roles ) {
		res.send({error:true,message:"missing username, role or app"});
	}
	
	users.find({username:username, app:app}).toArray(function(err, result){
		if( err ) return res.send(err);
		if( result.length == 0 ) return res.send({error:true,message:"user not found"});
		
		var user = result[0];
		
		users.update({_id: ObjectId(user._id+"")}, { $set : { roles : roles }}, function(err){
			if( err ) return res.send(err);
			res.send({success:true, message:"role(s) updated"});
		});
	});
});

app.get('/rest/getUser', function(req, res) {

	var username = req.query.username;
	var app = req.query.app;
	var password = req.query.password;
	
	if( !username || !app ) {
		res.send({error:true,message:"missing username or app"});
	}

	apps.find({name:app}).toArray(function(err, resp){
		if( err ) return res.send(err);
		if( resp.length == 0 ) return res.send({error:true, message:"invalid app id"});
		
		users.find({username:username, app:resp[0]._id+""}).toArray(function(err, result){
			if( err ) return res.send(err);
			if( result.length == 0 ) return res.send({error:true,message:"user not found"});
			
			if( result[0].authority == "ceres" ) {
				if( !bcrypt.compareSync(password, result[0].password) )  return res.send({error:true,message:"invalid password"});
			}
			
			delete result[0].password;
			
			res.send(result[0]);
		});
	});
	
	
});


// check the request has a valid server cookie 
// or is a valid user (local login)
function isValidRequest(req, res, next) {
	if( req.url == "/login.html" ) return next();
	
	if( req.user ) {
		if( req.user.roles.indexOf("superadmin") > -1 ) {
			return next();
		}
	}

	var token = null;
	if( req.body ) token = req.body.token;
	if( !token ) token = req.query.token;
	if( !token ) return res.send({error:true, message:"nope"});
	
	var app = null;
	if( req.body ) app = req.body.app;
	if( !app ) app = req.query.app;
	if( !app ) return res.send({error:true, message:"nope"});
	
	apps.find({name : app, token: token}).toArray(function(err, items){
		if( err ) {
			console.log(err);
			return res.send({error:true,message:"nope"});
		}
		if( items.length == 0 ) return res.send({error:true,message:"nope"});
		return next();
	});
}






/******************************
 *  ADMIN FUNCTIONALITY 
 ******************************/

// get all users who are currently in the unverified list
app.get('/rest/getUnverifyCeresUsers', function(req, res){
		
	pending.find({verified:false}).toArray(function(err, result){
		if( err ) return res.send(err);
		
		var respArr = [];
		
		for( var i = 0; i < result.length; i++ ) {
			respArr.push({
				username  : result[i].username,
				app       : result[i].app,
				timestamp : result[i].timestamp,
				_id       : result[i]._id
			});
		}
		 res.send(result);
	});
});

// reject (remove) a user from the unverified list
app.post('/rest/rejectUnverifyCeresUser', function(req, res){
		
	var ids = req.body.ids;
	if( !ids ) res.send({error:true,message:"no ids array provided"});
	
	var count = ids.length;
	var error = false;
	
	for( var i = ids.length-1; i >= 0; i-- ) {
		pending.remove({_id: ObjectId(ids[i])},function(err, result){
			if( err ) {
				if( !error ) res.send({error:true,message:err});
				error = true;
				return;
			}
			
			count--;
			if( count == 0 && !error ) {
				res.send({success:true});
			}
		});
	}
});

//reject (remove) a user from the unverified list
app.post('/rest/resendUnverifyCeresUserEmail', function(req, res){
		
	var ids = req.body.ids;
	if( !ids ) res.send({error:true,message:"no ids array provided"});
	
	var count = ids.length;
	var error = false;
	
	for( var i = ids.length-1; i >= 0; i-- ) {
		pending.find({_id: ObjectId(ids[i])}).toArray(function(err, result){
			if( err ) {
				if( !error ) res.send({error:true,message:err});
				error = true;
				return;
			}
			
			if( result.length > 0 ) {
				sendVerificationEmail(result[0].username, result[0].key, function(error){
					var err = error ? true : false;
					pending.update({_id:result[0]._id},{$set: { emailError : err} }, function(err,resp){});
				});
			}
			
			count--;
			if( count == 0 && !error ) {
				res.send({success:true});
			}
		});
	}
});


// add application
app.post('/rest/addApplication', function(req, res){
		
	var name = req.body.name;
	var token = req.body.token;
	var website = req.body.website;
	
	if( !name || !website || !token ) {
		return res.send({error: true, message:"name, token, website required"});
	}
	
	// make sure app doesn't already exist
	apps.find({name: name}).toArray(function(err, items) {
		if( err ) return res.send(err);
		if( items.length > 0 ) return res.send({error: true, message:"name already taken"});
		
		apps.insert({name:name,token:token,website:website},{w:1}, function(err, resp){
			if( err ) return res.send({error:true,message:err});
			res.send({success:true});
		});
	});
});

//update application
app.post('/rest/updateApplication', function(req, res){
		
	var app = req.body;
	if( !app ) return res.send({error:true,message:"no data"});
	
	if( !app.name || !app.website || !app.token || !app._id ) {
		return res.send({error: true, message:"name, token, website required"});
	}
	
	var id = app._id;
	delete app._id;

	apps.update({_id: ObjectId(id)}, app, function(err, items) {
		if( err ) return res.send(err);
		
		res.send({success:true});
	});
});


// get all applications
app.get('/rest/getApplications', function(req, res){
		
	apps.find().toArray(function(err, items) {
		if( err ) return res.send(err);
		res.send({apps:items});
	});
});

// get the list of users waiting to be approved
app.get('/rest/getWaitingUsers', function(req, res){
		
	pending.find({verified:true}).toArray(function(err, items) {
		if( err ) return res.send(err);
		res.send({users:items});
	});
});

// get all users
app.get('/rest/getUsers', function(req, res){
		
	users.find().toArray(function(err, items) {
		if( err ) return res.send(err);
		res.send({users:items});
	});
});

// a away for admins to get user by id
app.get('/rest/getUserInfo', function(req, res){
		
	var id = req.query.id;
	
	users.find({_id:ObjectId(id)}).toArray(function(err, items) {
		if( err ) return res.send(err);
		if( items.length == 0 ) return res.send({error:true,message:"no users with id"});
		res.send(items[0]);
	});
});

app.get('/rest/deleteUser', function(req, res){
		
	var id = req.query.id;
	
	users.remove({_id:ObjectId(id)}, function(err, resp){
		if( err ) return res.send({error:true,message:err});
		res.send({success:true,message:resp});
	});
});


app.listen(4000);
