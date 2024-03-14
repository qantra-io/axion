const bcrypt = require("bcrypt");
const {
  validationError,
  conflictError,
  notFoundError,
  nonAuthorizedError,
} = require("../errorHandlers");
const UserModel = require("./user.mongoModel");
class User {
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
    this.usersCollection = "users";
    this.httpExposed = ["createUser", "login"];
  }

  async createUser({ email, password, role = "super-admin" }) {
    const userData = { email, password };
    // Data validation
    const validationResult = await this.validators.user.createUser(userData);
    if (validationResult) {
      return validationError(validationResult[0].message);
    }
    try {
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return conflictError("This user already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new UserModel({
        ...userData,
        role,
        password: passwordHash,
      });

      const savedUser = newUser.save();
      const longToken = this.tokenManager.genLongToken({
        userId: savedUser._id,
        role,
      });

      return { status: 201, user: savedUser, longToken };
    } catch (err) {
      console.error("Error creating superadmin:", err);
    }
  }

  async login({ email, password }) {
    try {
      if (!email || !password) {
        return validationError("Both Email and password are required");
      }

      const user = await UserModel.findOne({ email });

      if (!user) {
        return notFoundError("User not found ");
      }
      const isMatchHash = await bcrypt.compare(password, user.password);
      if (!isMatchHash) {
        return nonAuthorizedError("Invalid creds");
      }

      const token = this.tokenManager.genLongToken({
        userId: user.id,
        role: user.role,
      });

      return { user, token };
    } catch (error) {
        console.error('Login Error', error)
        throw error
    }
  }
}

module.exports = User;
