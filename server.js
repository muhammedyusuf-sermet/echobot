var restify = require('restify');
var builder = require('botbuilder');
var calling = require('botbuilder-calling');

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
var bot = new builder.UniversalBot(connector/*, [
    function (session) {
       // session.send("Hello... I'm a decision bot.");
        //session.send(`Hello %s!, welcome to Flood AI Alpha, IFIS! You can ask me anything about flooding like \n - What is the weather forecast for Iowa City?\n - Show me stage data for nearest sensor?\n - What does catchment area mean?\n - How many stream sensors are there in Iowa City watershed?`,session.userData.name);
        //session.beginDialog('rootMenu');
    },
    function (session, results) {
        session.endConversation("Goodbye until next time...");
    }
]*/);


// Create calling bot
var connectorCall = new calling.CallConnector({
    callbackUrl: 'https://floodai.azurewebsites.net/api/calls',
    appId: process.env.BOTFRAMEWORK_APPID,
    appPassword: process.env.BOTFRAMEWORK_APPSECRET
});
var botCall = new calling.UniversalCallBot(connectorCall);



bot.dialog('/', function (session) {
    
    //respond with user's message
    //session.send("I know you said; " + session.message.text);
    
    
    if(session.message.text.toUpperCase() == 'help'.toUpperCase())
    {
        session.send(`[Flood AI Alpha] \n HELP \n You can ask me anything about flooding like \n - What is the weather forecast for Iowa City?\n - Show me stage data for nearest sensor?\n - What does catchment area mean?\n - How many stream sensors are there in Iowa City watershed?`, true);
        //builder.Prompts.choice(session, "[Flood AI Alpha] \n You can ask me anything about flooding like", ["What is the weather forecast for Iowa City?", "Show me stage data for nearest sensor?", "What is the meaning of hydrograph?", " How many stream sensors are there in Iowa City watershed?", "What is the flood condition for my community?"],{listStyle: builder.ListStyle["list"]});
        //builder.Prompts.choice(session, "Choose an option:", 'Flip A Coin|Roll Dice|Magic 8-Ball|Quit',{listStyle: builder.ListStyle["list"]});
        //builder.Prompts.choice(session, "Which color?", "red|green|blue");
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

// Calling bot Root
botCall.dialog('/', function (session) {
    session.send('Welcome to Iowa Flood Information System. You can ask any flood-related questions or say "help" to see examples.');
    
   /* var list = [];
    list.push(calling.Prompt.text(session,'Welcome to Iowa Flood Information System. You can ask any flood-related questions or say "help" to see examples.'));

    calling.PlayPromptAction(session).prompts(list);*/
    
});

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());
server.post('/api/calls', connectorCall.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});
