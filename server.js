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
    form: {'searchValue': 'definition of hydrograph', 'platform': 'Skype Chat Bot', 'communityID': -1 , 'communityName': 'Iowa City (Iowa River)', 'communityLat': '41.646144', 'communityLng': '-91.535903'}
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


/*
botCall.dialog('/', [
    function (session) {
        // Send a greeting and start the menu.
        if (!session.userData.welcomed) {
            session.userData.welcomed = true;
            session.send(prompts.welcome);
            session.beginDialog('/demoMenu', { full: true });
        } else {
            session.send(prompts.welcomeBack);
            session.beginDialog('/demoMenu', { full: false });
        }
    },
    function (session, results) {
        // Always say goodbye
        session.send(prompts.goodbye);
    }
]);*/


botCall.dialog('/', [
    function (session, args) {
        // Build up a stack of prompts to play
        var list = [];
        list.push(calling.Prompt.text(session, 'Welcome to Iowa Flood Information System'));
        //session.send('Welcome to Iowa Flood Information System. You can ask any flood-related questions or say "help" to see examples.');
        calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(list), [
                { name: 'record', speechVariation: ['ask','record', 'recordings'] },
                { name: 'help', speechVariation: ['help', 'repeat'] },
                { name: 'quit', speechVariation: ['quit', 'end call', 'hangup', 'goodbye'] }
            ]);
        
    },
    function (session, results) {
        if (results.response) {
            switch (results.response.entity) {
                case 'help':
                    //session.replaceDialog('/', { full: false });
                    //session.replaceDialog('/help', { full: true });
                    break;
                case 'quit':
                    session.endDialog("Thank you for calling Flood AI");
                    break;
                /*case 'record':
                case 'ask':
                    session.beginDialog('/record', { full: false });
                    break;*/
                default:
                    // Start demo
                    session.beginDialog('/' + results.response.entity);
                    //session.send("Flood condition is normal for Iowa City");
                    break;
            }
        } else {
            // Exit the menu
            session.endDialog("Thank you for calling Flood AI");
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        //session.replaceDialog('/', { full: false });
    }
]);

botCall.dialog('/record', [
    function (session) {
        //session.send("Please ask a question");
        calling.Prompts.record(session, "Please ask a question after the beep", { playBeep: true });
    },
    function (session, results) {
        if (results.response) {
            //session.endDialog(prompts.record.result, results.response.lengthOfRecordingInSecs);
            session.send("%s", results.response);
        } else {
            session.endDialog("You canceled");
        }
    }
]);


// Calling bot Root
/*
botCall.dialog('/', function (session) {
    var list = [];
    list.push(calling.Prompt.text(session, 'Welcome to Iowa Flood Information System'));
    //session.send('Welcome to Iowa Flood Information System. You can ask any flood-related questions or say "help" to see examples.');
    calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(list), [
            { name: 'record', speechVariation: ['record', 'recordings'] },
            { name: 'help', speechVariation: ['help', 'repeat'] },
            { name: 'quit', speechVariation: ['quit', 'end call', 'hangup', 'goodbye'] }
        ]);
        
},
    function (session, results) {
        if (results.response) {
            switch (results.response.entity) {
                case 'choices':
                    session.send(prompts.demoMenu.choices);
                    session.replaceDialog('/demoMenu', { full: false });
                    break;
                case 'help':
                    session.replaceDialog('/demoMenu', { full: true });
                    break;
                case 'quit':
                    session.endDialog();
                    break;
                default:
                    // Start demo
                    session.beginDialog('/' + results.response.entity);
                    break;
            }
        } else {
            // Exit the menu
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/demoMenu', { full: false });
    }
   /* var list = [];
    list.push(calling.Prompt.text(session,'Welcome to Iowa Flood Information System. You can ask any flood-related questions or say "help" to see examples.'));

    calling.PlayPromptAction(session).prompts(list);*/
    
/*});*/

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
