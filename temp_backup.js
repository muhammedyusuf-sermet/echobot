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
                    session.send("You said help");
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
        session.replaceDialog('/', { full: false });
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