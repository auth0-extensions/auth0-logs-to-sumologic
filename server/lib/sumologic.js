const _ = require('lodash');
const uuid = require('node-uuid');
const request = require('superagent');

let config = {};

function sendLogs(logs, callback) {
  if (logs.length === 0) {
    callback();
  }

  try {
    request
      .post(config.endpoint)
      .send(logs.map(log => JSON.stringify(log)).join('\n'))
      .set('Content-Type', 'application/json')
      .end(function(err, res) {
        if (err || res.statusCode < 200 || res.statusCode >= 400) {
          const error = (res && res.error) || err.response;
          const errText = error && error.text && error.text.replace(/<\/?[^>]+>/gi, '');

          return callback(errText || err || res.statusCode);
        }

        return callback();
      });
  } catch (e) {
    return callback(e);
  }
}

function Sumologic (endpoint) {
  if (!endpoint) {
    throw new Error('Endpoint is required for Sumologic');
  }

  config = {
    endpoint: endpoint,
    session: `auth0-logs-to-sumologic-${uuid.v4()}`
  };
}

Sumologic.prototype.send = function(logs, callback) {
  if (!logs || !logs.length) {
    return callback();
  }

  const timestamp = new Date().toUTCString();
  const client = { url: config.clientUrl };
  const message = [];

  logs.forEach((log) => {
    const data = {
      sessionId: config.session,
      timestamp: timestamp
    };

    message.push(_.extend(data, client, log));
  });

  return sendLogs(message, callback);
};

module.exports = Sumologic;
