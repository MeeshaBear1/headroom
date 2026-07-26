const log = [];

function logFailure(channel, action, target) {
  log.push({ channel, action, target });
}

function getLog() {
  return log.slice();
}

function resetLog() {
  log.length = 0;
}

module.exports = { logFailure, getLog, resetLog };
