var restify = require('restify');
var builder = require('botbuilder');
var calling = require('botbuilder-calling');
var prompts = require('./prompts');

var request = require('request');

/* Set the targeted platform below!!! */

//var deployTarget = 0; // Heroku
var deployTarget = 1; // Azure


// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}

// Configure the request
var options = {
    //url: 'http://s-iihr50.iihr.uiowa.edu/demir/knowledge/voice/KnowledgeEngine.php',
    //url: 'http://s-iihr50.iihr.uiowa.edu/demir/knowledge/engine/voice/KnowledgeEngine.php',
    url: 'http://iowawis.org/lab/floodai/KnowledgeEngine.php',
    //url: 'http://iihr-vl01.iihr.uiowa.edu/dev/msermet/knowledge/voice/KnowledgeEngine.php',
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
        session.send(`[Flood AI Alpha] \n HELP \n You can ask me anything about flooding like \n - What is the weather forecast for Iowa City?\n - Show me stage data for nearest sensor?\n - What does watershed mean?\n - How many stream sensors are there in Iowa City watershed?`, true);
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


//=========================================================
// Calling Dialogs
//=========================================================

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
]);

botCall.dialog('/demoMenu', [
    function (session, args) {
        // Build up a stack of prompts to play
        var list = [];
        list.push(calling.Prompt.text(session, prompts.demoMenu.prompt));
        if (!args || args.full) {
            list.push(calling.Prompt.text(session, prompts.demoMenu.choices));
            list.push(calling.Prompt.text(session, prompts.demoMenu.help));
        }

        // Prompt user to select a menu option
        calling.Prompts.choice(session, new calling.PlayPromptAction(session).prompts(list), [
            { name: 'dtmf', speechVariation: ['dtmf'] },
            { name: 'digits', speechVariation: ['digits'] },
            { name: 'record', speechVariation: ['record', 'recordings'] },
            { name: 'chat', speechVariation: ['chat', 'chat message'] },
            { name: 'choices', speechVariation: ['choices', 'options', 'list'] },
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
]);

botCall.dialog('/dtmf', [
    function (session) {
        session.send(prompts.dtmf.intro);
        calling.Prompts.choice(session, prompts.dtmf.prompt, [
            { name: 'option A', dtmfVariation: '1' },
            { name: 'option B', dtmfVariation: '2' },
            { name: 'option C', dtmfVariation: '3' }
        ]);
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.dtmf.result, results.response.entity);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

botCall.dialog('/digits', [
    function (session, args) {
        if (!args || args.full) {
            session.send(prompts.digits.intro);
        }
        calling.Prompts.digits(session, prompts.digits.prompt, 10, { stopTones: '#' });
    },
    function (session, results) {
        if (results.response) {
            // Confirm the users account is valid length otherwise reprompt.
            if (results.response.length >= 5) {
                var prompt = calling.PlayPromptAction.text(session, prompts.digits.confirm, results.response);
                calling.Prompts.confirm(session, prompt, results.response);
            } else {
                session.send(prompts.digits.inavlid);
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    },
    function (session, results) {
        if (results.resumed == calling.ResumeReason.completed) {
            if (results.response) {
                session.endDialog();
            } else {
                session.replaceDialog('/digits', { full: false });
            }
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

botCall.dialog('/record', [
    function (session) {
        session.send(prompts.record.intro);
        calling.Prompts.record(session, prompts.record.prompt, { playBeep: true });
    },
    function (session, results) {
        if (results.response) {
            session.endDialog(prompts.record.result, results.response.lengthOfRecordingInSecs);
        } else {
            session.endDialog(prompts.canceled);
        }
    }
]);

// Import botbuilder core library and setup chat bot

botCall.dialog('/chat', [
    function (session) {
        session.send(prompts.chat.intro);
        calling.Prompts.confirm(session, prompts.chat.confirm);        
    },
    function (session, results) {
        if (results.response) {
            // Delete conversation field from address to trigger starting a new conversation.
            var address = session.message.address;
            delete address.conversation;

            // Create a new chat message and pass it callers address
            var msg = new builder.Message()
                .address(address)
                .attachments([
                    new builder.HeroCard(session)
                        .title("Hero Card")
                        .subtitle("Space Needle")
                        .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                        .images([
                            builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                        ])
                        .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                ]);

            // Send message through chat bot
            chatBot.send(msg, function (err) {
                session.endDialog(err ? prompts.chat.failed : prompts.chat.sent);
            });
        } else {
            session.endDialog(prompts.canceled);
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


/*if(deployTarget==0){
    server.listen(process.env.PORT || 3000, function () {
        console.log('%s listening to %s', server.name, server.url); 
    });
}
else{
    server.listen(process.env.PORT || 3978, function () {
        console.log('%s listening to %s', server.name, server.url); 
    });
}*/

server.listen(process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

