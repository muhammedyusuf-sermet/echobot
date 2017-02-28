var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    appId: process.env.BOTFRAMEWORK_APPID, 
    appPassword: process.env.BOTFRAMEWORK_APPSECRET
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    var phpScriptPath = "http://s-iihr50.iihr.uiowa.edu/demir/knowledge/voice/KnowledgeEngine.php";
    //respond with user's message
    session.send("Did you said " + session.message.text);
    var exec = require("child_process").exec;
    server.get('/', function(req, res){exec("wget -q -O - "+phpScriptPath, function (error, stdout, stderr) {session.send(stdout);});});
    //app.get('/', function(req, res){exec("php "+phpScriptPath, function (error, stdout, stderr) {res.send(stdout);});});
	
	/*runner.exec("php " + phpScriptPath + " " +"definition", function(err, phpResponse, stderr) {
	     if(err) {session.send(err);}
	     else{
		 var phpResponseJSON = JSON.parse(phpResponse)
		 session.send(phpResponseJSON['resultText']);

		/* var options = {string: true};

		base64.base64encoder(phpResponseJSON['imageLink'], options, function (err, image) {
		    if (err) {
			console.log(err);
		    }
		    {
		      var originaldata = new Buffer(image, 'base64');
		      bot.replyWithAttachment("Result" , "Image" , originaldata);
		    }
		});*/

	  /*   }
	    });*/
});

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});
