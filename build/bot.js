'use strict';

var _utils = require('./utils');

var _constants = require('./constants');

var _botkit = require('botkit');

var _botkit2 = _interopRequireDefault(_botkit);

var _beepboopBotkit = require('beepboop-botkit');

var _beepboopBotkit2 = _interopRequireDefault(_beepboopBotkit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var controller = _botkit2.default.slackbot();
var beepboop = _beepboopBotkit2.default.start(controller);

var beanstalkAuthMap = {};

beepboop.on('add_resource', function (message) {
    // When a team connects, persist their data so we can look it up later
    // This also runs for each connected team every time the bot is started
    beanstalkAuthMap[message.resourceID] = {
        bsUsername: message.resource.BS_USERNAME,
        bsAuthToken: message.resource.BS_AUTH_TOKEN,
        slackTeamID: message.resource.SlackTeamID
    };
});

beepboop.on('update_resource', function (message) {
    // When a team updates their auth info, update their persisted data
    beanstalkAuthMap[message.resourceID].bsUsername = message.resource.BS_USERNAME;
    beanstalkAuthMap[message.resourceID].bsAuthToken = message.resource.BS_AUTH_TOKEN;
});

beepboop.on('remove_resource', function (message) {
    // When a team removes this bot, remove their data
    delete beanstalkAuthMap[message.resourceID];
});

controller.hears(['.beanstalkapp.com/'], ['ambient', 'direct_mention', 'direct_message', 'mention'], function (botInstance, message) {

    // TODO: validate whether authDetails exists for this team
    var authDetails = beanstalkAuthMap[botInstance.config.resourceID];

    (0, _utils.getFileContents)(message.text, {
        username: authDetails.bsUsername,
        token: authDetails.bsAuthToken
    }, function (err, res) {
        if (err) {
            botInstance.reply(message, 'We had an issue getting the snippet from Beanstalk. Please make sure that you entered the correct username and authorization token.');
            throw new Error('Error getting file contents: ' + err.message);
        }

        botInstance.reply(message, res);
    });
});

controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], function (botInstance, message) {
    botInstance.reply(message, _constants.HELP_MESSAGE);
});

// TODO: Better handling if we don't recognize message