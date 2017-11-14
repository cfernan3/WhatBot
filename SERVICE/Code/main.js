var Botkit = require('botkit');
var chrono = require('chrono-node');
var fs = require('fs');
var config = require('./modules/config.js')
var standup = require('./modules/standup');
var schedule = require('node-schedule')
var util = require('util')
var report = require('./modules/report.js')
var delay = require('delay');
var db = require('./modules/sheets.js'); 


function StandupConfig(){
  this.startTimeHours = 0;
  this.startTimeMins = 0;
  this.endTimeHours = 0;
  this.endTimeMins = 0;
  this.questions = ["What did you accomplish yesterday?", "What will you work on today?",
                    "Is there anything blocking your progress?"];  // TODO: should have aleast 1 question
  this.participants = [];  // TODO: makse sure atleast one participant
  this.reportMedium = "email";  // default medium is email
  this.reportChannel = "";
  this.creator = "";
}

var botId; // Contains the bot's user id.
var standupConfig = new StandupConfig();

var defaultQuestions = "\t" + standupConfig.questions[0];
for(var i = 1; i < standupConfig.questions.length; i++)
  defaultQuestions += "\n\t" + standupConfig.questions[i];

var snoozeDelayMins = 0.5; // Snooze delay in minutes

var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [0,1,2,3,4,5,6];

// TODO: start the reporting job after standup is configured
// TODO: modify the endRule and reschedule the reporting job whenever end time is modified
var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [0,1,2,3,4,5,6];

var sessionJob;  // Schedule this job using startRule to conduct the daily standup session
var reportJob;   // Schedule this job using endRule to trigger reporting
//var answers = [];
//var standupuser = [];
var controller = Botkit.slackbot({
  debug: false,
  interactive_replies: true, // tells botkit to send button clicks into conversations
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    // Set scopes as needed. https://api.slack.com/docs/oauth-scopes
    scopes: ['bot'],
  }
);

// Setup for the Webserver - REQUIRED FOR INTERACTIVE BUTTONS
controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

function makebot() {
  this.startPrivateConversation = function (user, callback) {}
}

var _bot = new makebot();

function trackBot(bot) {
  _bot = bot;
}


/*
************************ Launching the slack app**********************************
*/

controller.on('create_bot',function(bot, bot_config) {
  bot.startRTM(function(err) {

    botId = bot_config.user_id;

    if (!err) {
      trackBot(bot);
    }

    // Read the config from the config file if present
    var configObj = config.validateConfigFile();

    // If the config file is present and the format is valid, use the config.
    // Useful for restarting the main process.
    if(configObj != null) {
      standupConfig = configObj;
      console.log(standupConfig);

      // schedule the standup job at the configured start time
      startRule.hour = standupConfig.startTimeHours;
      startRule.minute = standupConfig.startTimeMins;
      sessionJob = schedule.scheduleJob(startRule, startStandupWithParticipants);

      //TODO: // schedule the report job at the configured end time
      endRule.hour = standupConfig.endTimeHours;
      endRule.minute = standupConfig.endTimeMins+1;
      console.log("#####################################NIRAV: Configured the Report for time = "+standupConfig.endTimeHours+":"+standupConfig.endTimeMins ) 
      reportJob = schedule.scheduleJob(endRule, shareReportWithParticipants);
     
      bot.startPrivateConversation({user: standupConfig.creator},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say("Hello! I found a config file and have configured the standup parameters using it.\nYou can modify individual parameters or do a fresh setup if you want.");
        }
      });

    } else {
      // tell the user to configure a standup
      standupConfig.creator = bot_config.createdBy;
      bot.startPrivateConversation({user: standupConfig.creator},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say("Hello! I'm here to organise your standup. Let me know when you want to schedule one.");
        }
      });
    }
  });
});

/*
************************ Configuring a new standup**********************************
*/

controller.hears(['schedule', 'setup', 'configure'],['direct_mention', 'direct_message'], function(bot,message) {
  bot.startConversation(message, function(err, convo) {

    convo.addMessage({text:"Let's begin configuring a new standup.", action:'askStartTime'}, 'default');

    convo.addQuestion('What time would you like to start the standup?', function (response, convo) {
      console.log('Start time entered =', response.text);

      var startTime = chrono.parseDate(response.text)
      if (startTime != null) {
        standupConfig.startTimeHours = startTime.getHours();
        standupConfig.startTimeMins = startTime.getMinutes();
        console.log("Start time = " + standupConfig.startTimeHours + ":" + standupConfig.startTimeMins);
        convo.gotoThread('askEndTime');
      }
      else {
        console.log("Start time not entered correctly");
        convo.transitionTo('askStartTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'askStartTime');


    convo.addQuestion('When would you like the standup to end?', function (response, convo) {
      console.log('End time entered =', response.text);

      // TODO: check that end time - start time > 15 mins
      var endTime = chrono.parseDate(response.text)
      if (endTime != null) {
        standupConfig.endTimeHours = endTime.getHours();
        standupConfig.endTimeMins = endTime.getMinutes();
        console.log("End time = " + standupConfig.endTimeHours + ":" + standupConfig.endTimeMins);
        convo.gotoThread('askParticipants');
      }
      else {
        console.log("End time not entered correctly");
        convo.transitionTo('askEndTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'askEndTime');


    convo.addQuestion('Who would you like to invite for the standup session?\n You may enter it in the following ways:\n\
          1. list of users: @<user1>, ..., @<userN>\n \
          2. specific user group: @<user-group-name> \n \
          3. specific channel: #<channel-name>', function (response, convo) {

      console.log('participants=', response.text);
      standupConfig.participants = [];
      config.addParticipants(bot, response.text, standupConfig);
      convo.gotoThread('askQuestionSet');
    }, {}, 'askParticipants');


    convo.addQuestion('Following are the default questions.\n' + defaultQuestions +
    '\nWould you like to give your own question set?', [
      {
          pattern: bot.utterances.yes,
          callback: function(response, convo) {
            standupConfig.questions = [];
            console.log('Default questions not accepted.');
            convo.gotoThread('askNewSet');
          }
      },
      {
          pattern: bot.utterances.no,
          default: true,
          callback: function(response, convo) {
            console.log('Default question set accepted.');
            convo.transitionTo('askReportMedium', 'Ok! We will proceed with the default question set.');
          }
      }
    ], {}, 'askQuestionSet');


    convo.addQuestion('Ok! Give me all the questions, each on a new line, and say DONE to finish.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          console.log("Finished receiving questions");
          convo.gotoThread('askReportMedium');
        }
      },
      {
        default: true,
        callback: function(response, convo) {
          console.log('questions entered =', response.text);
          config.parseQuestions(response.text, standupConfig);
          convo.silentRepeat();
        }
      }
    ], {}, 'askNewSet');


    convo.addQuestion(config.reportMediumButtons,
    function (response, convo) {
        if(response.text == "email") {
          standupConfig.reportMedium = "email";
          standupConfig.reportChannel = "";
          convo.gotoThread('lastStatement');
        } else {
          standupConfig.reportMedium = "channel";
          convo.addQuestion('Which slack channel do you want to use? E.g. #general', function (response, convo) {

            config.parseReportChannel(bot, botId, response.text, standupConfig, function(rsp) {
              switch (rsp) {
                case 0: // Success
                  standupConfig.reportMedium = "channel";
                  convo.gotoThread('lastStatement');
                  break;
                case 1: // Channel id is invalid
                  convo.transitionTo('askReportMedium', 'This channel does not exist.');
                  break;
                case 2: // Bot is NOT a member of valid channel
                convo.transitionTo('askReportMedium', 'I am not a member of this channel.');
                  break;
              }
            });
          }, {}, 'askReportMedium');

          convo.next();
        }
    }, {}, 'askReportMedium');


    convo.beforeThread('lastStatement', function(convo, next) {
      console.log('New standup config complete');
      writeToConfigFile();

      // Create a google sheet for storing standup questions and answers
      db.createSheet(addNewSheetToConfigfile);

      startRule.hour = standupConfig.startTimeHours;
      startRule.minute = standupConfig.startTimeMins;

      // schedule the standup job, if not already scheduled

      endRule.hour = standupConfig.endTimeHours;
      endRule.minute = standupConfig.endTimeMins;

      if(typeof sessionJob == 'undefined'){
        console.log("NIRAV: Pre ShareReport")
        sessionJob = schedule.scheduleJob(startRule, startStandupWithParticipants);
        reportJob = schedule.scheduleJob(endRule, shareReportWithParticipants);
      }
      else
        {
        console.log("NIRAV: Modifying ShareReport")
        sessionJob.reschedule(startRule);
        reportJob.reschedule(endRule);
      }
      //TODO: schedule the report job
      next();
    });


    convo.addMessage('Awesome! Your Standup is configured successfully!', 'lastStatement');

  }); // startConversation Ends
}); // hears 'schedule' ends


function addNewSheetToConfigfile(sheet_id){
  // Create a new google sheet first
  console.log("New Google Sheet has been created and set as the default storage for the standup answers. The gsheet Id is=");
  standupConfig.gSheetId = sheet_id;
  console.log(standupConfig.gSheetId);
  // Store the standup questions in the sheet's first(header) row
  db.storeQuestions(standupConfig.gSheetId,'Whatbot',standupConfig.questions,function(response){
    //console.log('The standup Questions have been updated in the google sheet');
  });
  writeToConfigFile();
}
/*
************************ Show an existing standup configuration***********************
*/
controller.hears(['show', 'display', 'view', 'see', 'check'],['direct_mention', 'direct_message'], function(bot,message) {
  bot.startConversation(message, function(err, convo) {

    convo.say('Let me show you the current configuration...');
    // Start time
    convo.say("Start time: " + config.getHourIn12HourFormat(standupConfig.startTimeHours, standupConfig.startTimeMins));

    // End time
    convo.say("End time: " + config.getHourIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins));

    // participants
    var participantsStr = "";
    standupConfig.participants.forEach(function(val) {
     participantsStr += " <@" + val + ">";
    });
    convo.say(`Participants:${participantsStr}`);

    // Question set
    convo.say("Question Set: ");
    var i = 1;
    standupConfig.questions.forEach(function(val) {
      convo.say(i++ + ".  " + val);
    });

    // Reporting medium
    if (standupConfig.reportMedium == "channel") {
      convo.say("Reporting Medium: " + standupConfig.reportMedium + " (<#" + standupConfig.reportChannel + ">)");
    } else {
      convo.say("Reporting Medium: " + standupConfig.reportMedium);
    }

  });
});

/*
************************ Editing an existing standup**********************************
*/

controller.hears(['modify', 'change', 'update', 'edit', 'reschedule'],['direct_mention', 'direct_message'], function(bot,message) {
  // TODO: check that standup exists

  bot.startConversation(message, function(err, convo) {

  // TODO: check that the user is allowed to modify config
    convo.ask(config.modifyStandupButtons,

    function (response, convo) {
      switch (response.text) {
        case "startTime":
          convo.gotoThread('editStartTime');
          break;
        case "endTime":
          convo.gotoThread('editEndTime');
          break;
        case "participants":
          convo.gotoThread('editParticipants');
          break;
        case "questionSet":
          standupConfig.questions = [];
          convo.gotoThread('editQuestionSet');
          break;
        case "reportMedium":
          convo.gotoThread('editReportMedium');
          break;
        default:
          convo.next();
      }
    });

    convo.addQuestion('What time would you like to start the standup?', function (response, convo) {
      console.log('Start time entered =', response.text);

      //TODO: check that end time - new start time > 15 mins
      var startTime = chrono.parseDate(response.text)
      if (startTime != null) {
        standupConfig.startTimeHours = startTime.getHours();
        standupConfig.startTimeMins = startTime.getMinutes();
        console.log("Start time = " + standupConfig.startTimeHours + ":" + standupConfig.startTimeMins);

        convo.addMessage("All set! I have updated the start time to " +
                        config.getHourIn12HourFormat(standupConfig.startTimeHours, standupConfig.startTimeMins) + ".", 'editStartTime');

        // reschedule the standup session job after the start time is modified
        startRule.hour = standupConfig.startTimeHours;
        startRule.minute = standupConfig.startTimeMins;
        sessionJob.reschedule(startRule);

        writeToConfigFile();
        convo.next();
      }
      else {
        console.log("Start time not entered correctly");
        convo.transitionTo('editStartTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'editStartTime');


    convo.addQuestion('When would you like the standup to end?', function (response, convo) {
      console.log('End time entered =', response.text);

      var endTime = chrono.parseDate(response.text)  // TODO: check that new end time - start time > 15 mins
      if (endTime != null) {
        standupConfig.endTimeHours = endTime.getHours();
        standupConfig.endTimeMins = endTime.getMinutes();
        console.log("End time = " + standupConfig.endTimeHours + ":" + standupConfig.endTimeMins);
        convo.addMessage("All set! I have updated the end time to " +
                        config.getHourIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins) + ".", 'editEndTime');

        // TODO: reschedule the report job after the end time is modified
        endRule.hour = standupConfig.endTimeHours;
        endRule.minute = standupConfig.endTimeMins;
        reportJob.reschedule(endRule);

        writeToConfigFile();
        convo.next();
      }
      else {
        console.log("End time not entered correctly");
        convo.transitionTo('editEndTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'editEndTime');


    convo.addQuestion(config.modifyUserButtons, function (response, convo) {
      switch (response.text) {
        case "addUsers":  // TODO: let the user know which users were successfully added.
          convo.addQuestion('Who would you like to invite for the standup session?\n You may enter it in the following ways:\n\
                1. list of users: @<user1>, ..., @<userN>\n \
                2. specific user group: @<user-group-name> \n \
                3. specific channel: #<channel-name>', function (response, convo) {
            console.log('participants to add =', response.text);
            config.addParticipants(bot, response.text, standupConfig);

            convo.addMessage("All set! I have updated the participants", 'editParticipants');
            writeToConfigFile();
            convo.next();
          }, {}, 'editParticipants');
          convo.next();
          break;
        case "removeUsers":
          convo.addQuestion('Who would you like to remove from the standup session?\n You may enter it as a list of users: @<user1>, ..., @<userN>',
          function (response, convo) {
            console.log('participants to remove =', response.text);
            config.removeParticipants(response.text, standupConfig);

            convo.addMessage("All set! I have updated the participants.", 'editParticipants');
            writeToConfigFile();
            convo.next();
          }, {}, 'editParticipants');
          convo.next();
          break;
        default:
          convo.next();
      }
    }, {}, 'editParticipants');


    convo.addQuestion('Ok! Give me all the questions, each on a new line, and say DONE to finish.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          console.log("Finished receiving questions");
          convo.addMessage("All set! I have updated the standup questions.", 'editQuestionSet');

          writeToConfigFile();
          convo.next();
        }
      },
      {
        default: true,
        callback: function(response, convo) {
          console.log('questions entered =', response.text);
          config.parseQuestions(response.text, standupConfig); // TODO: report the existing stored answers and call storequestions method in sheets.js again
          convo.silentRepeat();
        }
      }
    ], {}, 'editQuestionSet');


    convo.addQuestion(config.reportMediumButtons,
    function (response, convo) {
        if(response.text == "email") {
          standupConfig.reportMedium = "email";
          standupConfig.reportChannel = "";
          convo.addMessage("All set! Standup reports will now be emailed to all participants.", 'editReportMedium');

          writeToConfigFile();
          convo.next();
        } else {
          convo.addQuestion('Which slack channel do you want to use? E.g. #general', function (response, convo) {

            config.parseReportChannel(bot, botId, response.text, standupConfig, function(rsp) {
              switch (rsp) {
                case 0: // Success
                  standupConfig.reportMedium = "channel";
                  writeToConfigFile();
                  convo.addMessage("All set! Standup reports will now be posted to your channel.", 'editReportMedium');  //TODO: print channel name
                  convo.next();
                  break;
                case 1: // Channel id is invalid
                  convo.transitionTo('editReportMedium', 'This channel does not exist.');
                  break;
                case 2: // Bot is NOT a member of valid channel
                convo.transitionTo('editReportMedium', 'I am not a member of this channel.');
                  break;
              }
            });
          }, {}, 'editReportMedium');

          convo.next();
        }
    }, {}, 'editReportMedium');

  }); // startConversation Ends
}); // hears 'schedule' ends


/*
************************ standup session **********************************
*/
function startStandupWithParticipants(){
  for (var i=0; i < standupConfig.participants.length; i++){
    _bot.startPrivateConversation({user: standupConfig.participants[i]},function(err,convo) {
      if (err) {
        console.log(err);
      } else {
        //TODO: standup session should not be continued if the the window closes in between.
        // If a user clicks snooze multiple times, session should terminate once standup end time is reached.

        convo.ask( startStandupButtons, function (response, convo) {
          switch (response.text) {
            case "start":
            var answers = [];
                var attachment = {text: `:white_check_mark: Awesome! Let's start the standup.`, title: "Select one option."};
                _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});
                

                for(var i = 0; i < standupConfig.questions.length; i++) {
                  convo.addQuestion(standupConfig.questions[i], function (response, convo) {
                    console.log('Question answered =', response.text);
                    answers.push(response.text);
                    convo.next();
                  }, {}, 'askQuestion');
                }

                convo.addQuestion("We are done with the standup. Do you want to redo?", [
                        {
                            pattern: _bot.utterances.yes,
                            callback: function(response, convo) {
                              standupConfig.questions = [];
                              console.log('Redoing');
                              convo.gotoThread('askQuestion');
                            }
                        },
                        {
                            pattern: _bot.utterances.no,
                            default: true,
                            callback: function(response, convo) {
                              convo.addMessage(" Thanks for your responses! We are done with today's standup.", 'askQuestion');
                              convo.next();
                              //standupuser.push("<@"+response.user+">")
                              db.storeAnswers(standupConfig.gSheetId,response.user,answers,function(res){console.log("Stored standup answers for user"+response.user);}); 
                              console.log(response);
                              // TODO: Remove Reporting from here and trigger it at standup close time.
                              // Change the function arguments - send the compiled report instead of a single user's answers
                            }
                        }
                      ], {}, 'askQuestion');

                convo.addMessage({text:"Here are your questions.", action:'askQuestion'}, 'default');
                convo.next();
              break;
            case "snooze":
              var attachment = {text: `:white_check_mark: I will remind you in ${snoozeDelayMins} minutes`, title: "Select one option."};
              _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});

              delay(snoozeDelayMins * 60000)
              .then(() => {
                convo.gotoThread('default');
              });
              break;
            case "ignore":
              var attachment = {text: `:white_check_mark: See you tomorrow`, title: "Select one option."};
              _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});
              convo.next();
              break;
          }
        });
      }
    });
  }
}

function shareReportWithParticipants(){
  console.log("In ShareReport")
  console.log("###############################")
  console.log(standupuser)
  console.log("###############################")
  console.log(standupConfig.questions)
  console.log("###############################")
  console.log(answers)
  report.postReportToChannel(_bot, {"channel_id":standupConfig.reportChannel,
  "user_name":standupuser,
  "questions":standupConfig.questions,
  "answers":answers});
}

//TODO: move this to config.js
var writeToConfigFile = function() {
  fs.writeFile('./config.json', JSON.stringify(standupConfig), (err) => {
     if (err) throw err;
   });
}

/*
************************ Help on how to configure a standup**********************************
*/

controller.hears(['help'],['direct_mention', 'direct_message'], function(bot,message) {
  bot.reply(message, config.helpMsg);
}); // hears 'help' ends
