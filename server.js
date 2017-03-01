var restify = require('restify');
var builder = require('botbuilder');


var request = require('request');

// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}

// Configure the request
var options = {
    url: 'http://s-iihr50.iihr.uiowa.edu/demir/knowledge/voice/KnowledgeEngine.php',
    method: 'POST',
    headers: headers,
    form: {'searchValue': 'definition of hydrograph', 'communityID': -1 , 'communityName': 'Iowa City (Iowa River)', 'communityLat': '41.646144', 'communityLng': '-91.535903'}
}

// Get secrets from server environment
var botConnectorOptions = { 
    appId: process.env.BOTFRAMEWORK_APPID, 
    appPassword: process.env.BOTFRAMEWORK_APPSECRET
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    
    //respond with user's message
    //session.send("I know you said; " + session.message.text);
    
    
    if(session.message.text.toUpperCase() == 'help'.toUpperCase())
    {
        session.send(`[Flood AI Alpha]\nHELP\nYou can ask me anything about flooding like \n - What is the weather forecast for Iowa City?\n - Show me stage data for nearest sensor?\n - What does catchment area mean?\n - How many stream sensors are there in Iowa City watershed?`, true);
    }
    else{
        options['form']['searchValue'] = session.message.text;
        
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                var resultJSON = JSON.parse(body);
                //session.send(body);
                session.send(resultJSON['resultText']);
                //session.send();
            }
        });
    }
    
   // request.post({url:'http://s-iihr50.iihr.uiowa.edu/demir/knowledge/voice/KnowledgeEngine.php', form: {'searchValue': 'definition', 'communityID': -1 , 'communityName': 'Iowa City (Iowa River)', 'communityLat': '41.646144', 'communityLng': '-91.535903'}}, function(err,httpResponse,body){ session.send(err); session.send(body); });
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
