var nodemailer = require("nodemailer");
var config = require("/Users/jrmerz/dev/config/emailConfig.js").config;

// TODO: replace w/o ceres MX server
// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: config.username,
        pass: config.password
    }
});

exports.send = function(mailOptions, callback) {
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if( error ) {
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }
	    if( callback ) callback(error);

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

