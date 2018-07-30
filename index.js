var pubnub;

var optionChosen;

var buttonOptionA;
var buttonOptionB;
var buttonOptionC;
var buttonOptionD;

var optionAText;
var optionBText;
var optionCText;
var optionDText;

const grant_access_url = "https://pubsub.pubnub.com/v1/blocks/sub-key/sub-c-6a727412-91c6-11e8-b36b-922642fc525d/grantAccess";

const subscribe_key = "sub-c-6a727412-91c6-11e8-b36b-922642fc525d";

const publish_key = "pub-c-e8c60862-b990-42c1-add2-49acc66f1b4c";

/**
 * Randomly generate UUID for user, then grant access for it!
 */
window.onload = function() {
    if (localStorage.getItem('accessToken') == null) {
        var uuid = generate_UUID();
        var req_options = {
          "body": {
              "uuid": uuid
          }
        };
        return request(grant_access_url, 'POST', req_options).then((response) => {
          console.log(response);
            if (response.status === 200) {
                console.log('ACCESS GRANTED');
                localStorage.setItem('accessToken', uuid);
            } else {
                console.log('ACCESS DENIED');
            }
        });
    }
    initPubNub();
};

function generate_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function initPubNub() {
    pubnub = new PubNub({
        subscribeKey: subscribe_key,
        publishKey: publish_key,
        uuid: localStorage.getItem('accessToken'),
        authKey: localStorage.getItem('accessToken'),
        ssl: true
    });
    updateUI();
}

function updateUI()
{
  pubnub.addListener({
      message: function(m) {
          var msg = m.message; // The Payload
          var channelName = m.channel; // The channel for which the message belongs
          if(channelName === 'question_post')
          {
              var loadingBar = document.getElementById("loading");
              loadingBar.classList.remove("show");
              loadingBar.classList.add("loading");
              showQuestion(msg);
          }
          else if(channelName === 'answer_post')
          {
              showCorrectAnswer(msg);
              showAnswerResults(msg);
          }
      },
      presence: function(p) {

      },
      status: function(s) {

      }
  });
  pubnub.subscribe({
      channels: ['question_post', 'answer_post'],
  });
  pubnub.hereNow(
    {
        channels: ['question_post'],
        includeUUIDs: true
    },
    function (status, response) {
        document.getElementById('num_players').innerHTML = response.totalOccupancy;
    }
);

buttonOptionA = document.getElementById("optionA");
buttonOptionB = document.getElementById("optionB");
buttonOptionC = document.getElementById("optionC");
buttonOptionD = document.getElementById("optionD");

buttonOptionA.addEventListener("click", optionASelected);
buttonOptionB.addEventListener("click", optionBSelected);
buttonOptionC.addEventListener("click", optionCSelected);
buttonOptionD.addEventListener("click", optionDSelected);
}

function showQuestion(msg)
{
    document.getElementById('question').innerHTML = msg.question;

    optionAText = msg.optionA;
    optionBText = msg.optionB;
    optionCText = msg.optionC;
    optionDText = msg.optionD;

    buttonOptionA.innerHTML = optionAText;
    buttonOptionB.innerHTML = optionBText;
    buttonOptionC.innerHTML = optionCText;
    buttonOptionD.innerHTML = optionDText;

    document.getElementById("seconds-left").style.visibility = "visible";

    var timeleft = 10;
    var gameTimer = setInterval(function() {
    document.getElementById("seconds").innerHTML = --timeleft;
    // Timer done!!
    if (timeleft <= 0) {
        clearInterval(gameTimer);
        // SUBMIT ANSWER!!
        submitAnswer(optionChosen);
        document.getElementById('answerOptions').style.visibility = "collapse";
      }
    }, 1000);
}

function submitAnswer(optionChosen)
{
      pubnub.fire({
          channel: "submitAnswer",
          message: {
            "answer": optionChosen
          },
          sendByPost: false,
      }).then((publishResponse) => {
          console.log(publishResponse);
      });
}

function showCorrectAnswer(msg)
{
  var correct = msg.correct;
  var correctAnswerMessage = "";
  if (optionChosen == null) {
    correctAnswerMessage += "You ran out of time. ";
  } else if (optionChosen === correct) {
    correctAnswerMessage += "Good Job! ";
  } else {
    correctAnswerMessage += "Sorry, you are wrong. ";
  }

  if (correct === "optionA") {
      correctAnswerMessage += optionAText;
  } else if (correct === "optionB") {
      correctAnswerMessage += optionBText;
  } else if (correct === "optionC") {
      correctAnswerMessage += optionCText;
  } else if (correct === "optionD") {
      correctAnswerMessage += optionDText;
  }
  correctAnswerMessage += " was the correct answer.";
  var correctAnswerText = document.getElementById('correctAnswer');
  correctAnswerText.classList.remove("correctAnswer");
  correctAnswerText.classList.add("showCorrectAnswer");
  correctAnswerText.innerHTML = correctAnswerMessage;
}

function showAnswerResults(msg)
{
  var countA = msg.optionA;
  var countB = msg.optionB;
  var countC = msg.optionC;
  var countD = msg.optionD;

  var xValue = [countD, countC, countB, countA];

  var yValue = [optionDText, optionCText, optionBText, optionAText];

  var data = [{
    type: 'bar',
    x: xValue,
    y: yValue,
    marker:{
    color: ['rgb(70, 32, 102)', 'rgb(255, 184, 95)', 'rgb(255, 122, 90)', 'rgb(0, 170, 160)']
    },
    text: xValue,
    textposition: 'auto',
    orientation: 'h'
  }];

  var layout = {
    xaxis: {
    showgrid: false,
    zeroline: false,
    showticklabels: false
  },
  yaxis: {
    showgrid: false,
    automargin: true,
    zeroline: false,
  },
    showlegend: false
  };

  Plotly.newPlot('answerResults', data, layout, {displayModeBar: false});

  var answerResultsChart = document.getElementById("answerResults");

  answerResultsChart.classList.remove("answerResults");
  answerResultsChart.classList.add("showAnswerResults");
}

function optionASelected()
{
  optionChosen = "optionA";
  buttonOptionA.classList.add("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.remove("selected");
}

function optionBSelected()
{
  optionChosen = "optionB";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.add("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.remove("selected");
}

function optionCSelected()
{
  optionChosen = "optionC";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.add("selected");
  buttonOptionD.classList.remove("selected");
}

function optionDSelected()
{
  optionChosen = "optionD";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.add("selected");
}


/**
 * Helper function to make an HTTP request wrapped in an ES6 Promise.
 *
 * @param {String} url URL of the resource that is being requested.
 * @param {String} method POST, GET, PUT, etc.
 * @param {Object} options JSON Object with HTTP request options, "header"
 *     Object of possible headers to set, and a body Object of a request body.
 *
 * @return {Promise} Resolves a parsed JSON Object or String response text if
 *     the response code is in the 200 range. Rejects with response status text
 *     when the response code is outside of the 200 range.
 */
function request(url, method, options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let contentTypeIsSet = false;
        options = options || {};
        xhr.open(method, url);
        for (let header in options.headers) {
            if ({}.hasOwnProperty.call(options.headers, header)) {
                header = header.toLowerCase();
                contentTypeIsSet = header === 'content-type' ? true : contentTypeIsSet;
                xhr.setRequestHeader(header, options.headers[header]);
            }
        }
        if (!contentTypeIsSet) {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                let response;
                try {
                    response = JSON.parse(xhr.response);
                } catch (e) {
                    response = xhr.response;
                }
                resolve(response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            }
        };
        xhr.send(JSON.stringify(options.body));
    });
}
