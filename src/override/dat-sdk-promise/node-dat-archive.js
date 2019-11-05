//////////////////////////////////////////////////////////////////////////////
// https://github.com/beakerbrowser/node-dat-archive/blob/master/lib/const.js

// url file paths
exports.DAT_VALID_PATH_REGEX = /^[a-z0-9-._~!$&'()*+,;=:@/\s]+$/i;

// dat settings
exports.DAT_MANIFEST_FILENAME = "dat.json";
exports.DEFAULT_DAT_API_TIMEOUT = 5e3;
// ===========================================================================

//////////////////////////////////////////////////////////////////////////////
// https://raw.githubusercontent.com/beakerbrowser/node-dat-archive/master/lib/util.js

const { TimeoutError } = require("beaker-error-constants");
const EventTarget = require("dom-event-target");

// exports.datDns = require("dat-dns")();

exports.timer = function(ms, fn) {
  var currentAction;
  var isTimedOut = false;

  // no timeout?
  if (!ms) return fn(() => false);

  return new Promise((resolve, reject) => {
    // start the timer
    const timer = setTimeout(() => {
      isTimedOut = true;
      reject(
        new TimeoutError(
          currentAction ? `Timed out while ${currentAction}` : undefined
        )
      );
    }, ms);

    // call the fn to get the promise
    var promise = fn(action => {
      if (action) currentAction = action;
      return isTimedOut;
    });

    // wrap the promise
    promise.then(
      val => {
        clearTimeout(timer);
        resolve(val);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

exports.toEventTarget = function(es) {
  var target = new EventTarget();
  es.on("data", ([event, args]) => target.send(event, args));
  target.close = es.destroy.bind(es);
  return target;
};
// ===========================================================================
