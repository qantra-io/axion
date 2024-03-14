const _ = require("lodash");

const errorHandlers = {
  conflictError: (message) => {
    return { ok: false, code: 409, data: {}, errors: [message], message };
  },
  validationError: (message) => {
    return { ok: false, code: 400, data: {}, errors: [message], message };
  },

  notFoundError: (message) => {
    return { ok: false, code: 404, data: {}, errors: [message], message };
  },

  nonAuthorizedError: (message) => {
    return { ok: false, code: 403, data: {}, errors: [message], message };
  },
};

// Export the object containing both functions
module.exports = errorHandlers;
