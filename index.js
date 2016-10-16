/**
 * Created by Mj on 10/15/2016.
 */

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var http = require('http');
var https = require('https');
var queryString = require('querystring');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    /**
     * Uncomment this if statfement and populate with your skill's application ID to
     * prevent someone else from configuring a skill that sends requests to this function.
     */
    /*
     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
     context.fail("Invalid Application ID");
     }
     */

    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }

    if (event.request.type === "LaunchRequest") {
      onLaunch(event.request,
        event.session,
        function callback(sessionAttributes, speechletResponse) {
          context.succeed(buildResponse(sessionAttributes, speechletResponse));
        });
    } else if (event.request.type === "IntentRequest") {
      onIntent(event.request,
        event.session,
        function callback(sessionAttributes, speechletResponse) {
          context.succeed(buildResponse(sessionAttributes, speechletResponse));
        });
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
    ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId +
    ", sessionId=" + session.sessionId);

  // Dispatch to your skill's launch.
  getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
  console.log("onIntent requestId=" + intentRequest.requestId +
    ", sessionId=" + session.sessionId);

  var intent = intentRequest.intent,
    intentName = intentRequest.intent.name;

  // Dispatch to your skill's intent handlers
  if ("iGetPlacesToVisit" === intentName) {
    getVisitList(intent, session, callback);
  } else if ('iCelebrityMode' === intentName) {
    getCelebrityMatchingPlaces(intent, session, callback);
  } else if ("iCoolMode" === intentName) {
    getCoolMatcingPlaces(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getWelcomeResponse(callback);
  } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
    handleSessionEndRequest(callback);
  } else {
    throw "Invalid intent";
  }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
    ", sessionId=" + session.sessionId);
  // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  var sessionAttributes = {};
  var cardTitle = "Welcome";
  var speechOutput = "Wayfarer on and ready to go! What's up?";
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  var repromptText = "Go ahead ask me," +
    "What Taylor Swift likes in Vegas?";
  var shouldEndSession = false;

  callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
  var cardTitle = "Session Ended";
  var speechOutput = "Enjoy your trip!!! Wayfarer, signing out.";
  // Setting this to true ends the session and exits the skill.
  var shouldEndSession = true;

  callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function getCelebrityMatchingPlaces(intent, session, callback) {
  var cardTitle = "Get Places based on Celebrity";
  var repromptText = "";
  var sessionAttributes = {};
  var shouldEndSession = true;
  var speechOutput = "";

  var placeQuery = intent.slots.place;
  var celebName = intent.slots.celebrity;
  var placeslist = [];

  var twitterHandle = '';
  twitterHandle = celebName.value;

  if (placeQuery.value) {

    var tempUrl = 'https://wayfarer.incognitech.in/?twitter_search=' + twitterHandle + '&city=' + placeQuery.value;
    console.log(`Getting data from - ${tempUrl}`);
    https.get(tempUrl, function(res) {
      console.log('statusCode:', res.statusCode);
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(data) {
        body += data;
      });

      res.on('end', function() {
        var apiRes = JSON.parse(body);
        console.log(apiRes.wayfarer_twitter_scores.personality);
        for (var i = 0; i < apiRes.businesses.length; i++) {
          placeslist.push(apiRes.businesses[i].name);
        }
        console.log(placeslist);

        sessionAttributes.latestNewsPosts = placeslist;
        var pIElementKey = 'Stability';
        var pIElementValue = 0;
        var p = apiRes.wayfarer_twitter_scores.personality;
        for (var key in p) {
          if (p.hasOwnProperty(key)) {
            if (p[key] > pIElementValue) {
              pIElementValue = p[key];
              pIElementKey = key;
            }
          }
        }
        p = apiRes.wayfarer_twitter_scores.needs;
        for (var key in p) {
          if (p.hasOwnProperty(key)) {
            if (p[key] > pIElementValue) {
              pIElementValue = p[key];
              pIElementKey = key;
              console.log(key);
            }
          }
        }
        p = apiRes.wayfarer_twitter_scores.values;
        for (var key in p) {
          if (p.hasOwnProperty(key)) {
            if (p[key] > pIElementValue) {
              pIElementValue = p[key];
              pIElementKey = key;
            }
          }
        }
        console.log(`Largest Key - ${pIElementKey} - ${pIElementValue}`);
        var newtalk = '';
        for(var i=0; i<placeslist.length;i++){
          newtalk = newtalk + placeslist[i] + ". ";
        }
        if (Math.floor(Math.random()) % 2 == 0) {
          speechOutput = celebName.value + " and you have a high " + pIElementKey+ " correlation " +
            "so I bet both of you would like " + newtalk;
        } else {
          speechOutput = "I guess " + celebName.value + " would probably visit " + newtalk;
        }

        callback(sessionAttributes,
          buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });

    }).on('error', function (err) {
      console.log('Error, with: ' + err.message);

      // speechOutput = "Please say that again?";
      // repromptText = "Please try again.";
      // shouldEndSession = false;

    });
  } else {
    speechOutput = "can you Please say that again?";
    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
  }

}

function getVisitList(intent, session, callback) {
  var cardTitle = "Get Visiting spot list from Wayfarer";
  var repromptText = "";
  var sessionAttributes = {};
  var shouldEndSession = true;
  var speechOutput = "";

  var placeQuery = intent.slots.place;
  var placeslist = [];
  if (placeQuery.value) {


  var tempUrl = 'https://wayfarer.incognitech.in/?twitter_handle=desaiuditd&city=' + placeQuery.value;
  console.log(`Getting data from - ${tempUrl}`);
  https.get(tempUrl, function(res) {
    console.log('statusCode:', res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      var apiRes = JSON.parse(body);

      for (var i = 0; i < apiRes.businesses.length; i++) {
        placeslist.push(apiRes.businesses[i].name);
      }
      console.log(placeslist);

      sessionAttributes.latestNewsPosts = placeslist;

      var newtalk = '';
      for(var i=0; i<placeslist.length;i++){
        newtalk = newtalk + placeslist[i] + ". ";
      }
      speechOutput = "That's nice! When you're in " + placeQuery.value + ", you should check out " + newtalk;

      callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });

  }).on('error', function (err) {
    console.log('Error, with: ' + err.message);

    // speechOutput = "Please say that again?";
    // repromptText = "Please try again.";
    // shouldEndSession = false;

  });
  } else {
    speechOutput = "can you Please say that again?";
    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
  }
}

function getCoolMatcingPlaces(intent, session, callback) {
  var cardTitle = "Student Mode";

  var placeQuery = intent.slots.place;

  var repromptText = "Can you say that again";
  var sessionAttributes = {};
  var shouldEndSession = true;
  var speechOutput = '';

  var placesList = [];

  if (placeQuery.value) {
    var tempUrl = 'https://wayfarer.incognitech.in/?twitter_handle=desaiuditd&cool_mode=true&city=' + placeQuery.value;
  console.log(`Getting data from - ${tempUrl}`);

  https.get(tempUrl, function(res) {
    console.log('statusCode:', res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      var apiRes = JSON.parse(body);

      for (var i = 0; i < apiRes.businesses.length; i++) {
        placesList.push(apiRes.businesses[i].name);
      }
      console.log(placesList);

      sessionAttributes.latestNewsPosts = placesList;

      var newtalk = '';
      for(var i=0; i<placesList.length;i++){
        newtalk = newtalk + placesList[i] + ". ";
      }
      speechOutput = "Oh wow!! Hello hackers. You should check out " + newtalk + " when you visit " + placeQuery.value + ". I'm sure you would like";


      callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });

  }).on('error', function (err) {
    console.log('Error, with: ' + err.message);

    // speechOutput = "Please say that again?";
    // repromptText = "Please try again.";
    // shouldEndSession = false;

  });
  } else {
    speechOutput = "can you Please say that again?";
    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
  }
}
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: "SessionSpeechlet - " + title,
      content: "SessionSpeechlet - " + output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}