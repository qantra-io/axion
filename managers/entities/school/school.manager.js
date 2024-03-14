const bcrypt = require("bcrypt");
const {
  validationError,
  conflictError,
  notFoundError,
  nonAuthorizedError,
} = require("../errorHandlers");
const SchoolModel = require("./school.mongoModel");
const UserModel = require("../user/user.mongoModel");
class School {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.usersCollection = "school";
    this.httpExposed = ["create"];
    this.scopes = ["super-admin"];
  }

  async create({ __longToken, schoolManager, name, address, website }) {
    try {
      const validationIssue = await this.validators.school.create({ name });
      if (validationIssue) {
        return validationError(validation[0].message);
      }
      const { role } = __longToken;
      if (!this.hasScope(role)) {
        return nonAuthorizedError("Insufficient permissions");
      }
      const school = await SchoolModel.findOne({ name });
      if (school) {
        return conflictError("A school with this name already exists ");
      }

      return SchoolModel.create({ name });
    } catch (err) {
      throw new Error("Internal server error");
    }
  }

  hasScope(role) {
    return this.scopes.includes(role);
  }
}

module.exports = School;
