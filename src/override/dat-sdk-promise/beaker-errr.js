//////////////////////////////////////////////////////////////////////////////
// https://raw.githubusercontent.com/beakerbrowser/node-dat-archive/master/lib/util.js
class ExtendableError extends Error {
  constructor(msg) {
    super(msg);
    this.name = this.constructor.name;
    this.message = msg;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(msg).stack;
    }
  }
}

exports.TimeoutError = class TimeoutError extends ExtendableError {
  constructor(msg) {
    super(msg || "Timed out");
    this.timedOut = true;
  }
};

exports.ArchiveNotWritableError = class ArchiveNotWritableError extends ExtendableError {
  constructor(msg) {
    super(msg || "Cannot write to this archive ; Not the owner");
    this.archiveNotWritable = true;
  }
};

exports.ProtectedFileNotWritableError = class ProtectedFileNotWritableError extends ExtendableError {
  constructor(msg) {
    super(msg || "Protected file is not wrtable");
    this.protectedFileNotWritable = true;
  }
};

exports.InvalidPathError = class InvalidPathError extends ExtendableError {
  constructor(msg) {
    super(msg || "The given path is not valid");
    this.invalidPath = true;
  }
};
// ===========================================================================
