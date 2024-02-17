const bcrypt = require("bcrypt");
const bcrypt_saltRounds = 10;

module.exports = class User {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
    mongoDB,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.tokenManager = managers.token;
    this.usersCollection = "users";
    this.httpExposed = [
      "post=addingUser",
      "post=loginUser",
      "put=updateUserAccessRights",
      "delete=deleteUser",
      "get=getAllUsers",
      "post=createInitialSuperAdmin",
      "delete=deleteAllUsers",
      "put=updateUser"
    ];
    this.crud = mongoDB.CRUD(mongomodels.user);
    this.crud_school = mongoDB.CRUD(mongomodels.school);
  }

  async checkSchoolAccessRights(accessRights) {
    if (accessRights.includes("school")) {
      const school_name = accessRights.split(":")[1];
      const schools = await this.crud_school.read({ name: school_name });
      if (schools.length == 0) {
        return false;
      }
      return true;

    } else return false;
  }

  async createInitialSuperAdmin({ username, email, password }) {
    const user = { username, email, password };
    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result.error) return { error: result[0].message, statusCode: 400 };

    // Creation Logic
    const passwordHash = bcrypt.hashSync(password, bcrypt_saltRounds);
    try {
      const createdUser = await this.crud.create({
        username,
        email,
        passwordHash,
        accessRights: "superAdmin",
      });
      console.log(createdUser._id, createdUser.accessRights);
      let longToken = this.tokenManager.genLongToken({
        userId: createdUser._id,
        userKey: createdUser.accessRights,
      });
      return { longToken };
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, handle it
        return {
          error: "Duplicate email address. Please choose another email.",
        };
      } else {
        // Other unexpected error, log it and return a generic error message
        console.error("Error creating user:", error);
        return { error: "Failed to create user." };
      }
    }
  }

  async addingUser({ username, email, password, accessRights, __token }) {
    // Check authentication (ensure a valid token is provided)
    if (!__token) {
      return { error: "Authentication token is required.", statusCode: 401 };
    }
    const decoded = __token;
    if (decoded.userKey !== "superAdmin") {
      return {
        error: "You should be a super admin to add new user",
        statusCode: 401,
      };
    }
    if (accessRights === "superAdmin") {
      return {
        error: "You can not create super admin using this API",
        statusCode: 401,
      };
    }
    if (accessRights != "user" && this.checkSchoolAccessRights(accessRights)) {
      return {
        error:
          'Undefined Role for this user, please choose school:${school_name} => school admin for adding school admin or user for adding student',
        statusCode: 401,
      };
    }

    const user = { username, email, password };

    // Data validation
    let result = await this.validators.user.createUser(user);
    if (result.error) return { error: result[0].message, statusCode: 400 };

    // Creation Logic
    const passwordHash = bcrypt.hashSync(password, bcrypt_saltRounds);
    try {
      const createdUser = await this.crud.create({
        username,
        email,
        passwordHash,
        accessRights: accessRights,
      });
      let longToken = this.tokenManager.genLongToken({
        userId: createdUser._id,
        userKey: createdUser.accessRights,
      });
      return { longToken };
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, handle it
        return {
          error: "Duplicate email address. Please choose another email.",
        };
      } else {
        // Other unexpected error, log it and return a generic error message
        console.error("Error creating user:", error);
        return { error: "Failed to create user." };
      }
    }
  }

  async loginUser({ email, password }) {
    const users = await this.crud.read({ email });
    if (users.length === 0) {
      return { error: "Email not found", statusCode: 400 };
    }

    const user = users[0];
    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);

    if (!passwordMatch) {
      return { error: "Wrong password", statusCode: 400 };
    }

    try {
      let longToken = this.tokenManager.genLongToken({
        userId: user._id,
        userKey: user.accessRights,
      });
      return { longToken };
    } catch (error) {
      console.error("Error generating long token:", error.message);
      return { error: "Failed to generate long token", statusCode: 500 };
    }
  }

  async updateUserAccessRights({ email, accessRights, __token }) {
    if (!__token || !__token.userKey) {
      return { error: "Invalid token", statusCode: 401 };
    }

    const decoded = __token;

    if (decoded.userKey !== "superAdmin") {
      return {
        error: "You should be a super admin to update access rights",
        statusCode: 401,
      };
    }
    let result = await this.validators.user.updateUserAccessRights({
      accessRights,
    });
    if (result) return { error: result[0].message, statusCode: 400 };

    const oldUsers = await this.crud.read({ email });

    if (oldUsers.length === 0) {
      return { error: "User to update does not exist", statusCode: 400 };
    }

    const oldUser = oldUsers[0];
    let res_accessRights = accessRights.split(":")[0];

    if (accessRights.includes("school")) {
      const school_name = accessRights.split(":")[1];
      const schools = await this.crud_school.read({ name: school_name });
      if (schools.length == 0) {
        return { error: `School ${school_name} not found`, statusCode: 400 };
      }

      const school_id = schools[0]._id;
      accessRights = school_id;
    }

    const newUser = await this.crud.update(oldUser._id, { accessRights });

    return { email: newUser.email, accessRights: res_accessRights };
  }

  async deleteUser({ email, __token }) {
    const decoded = __token;
    console.log(decoded.userKey);
    if (decoded.userKey !== "superAdmin") {
      return {
        error: "You should be a super admin to delete a user",
        statusCode: 401,
      };
    }

    const users = await this.crud.read({ email });
    if (users.length === 0) {
      return { error: "User to delete does not exist", statusCode: 400 };
    }

    const deletedUser = await this.crud.delete(users[0]._id);

    return { email: deletedUser.email, message: "User deleted successfully" };
  }

  async updateUser({ email, newInfo, __token }) {
    const decoded = __token;

    // If you want to allow any authenticated user to update their info, remove the following check
    if (decoded.userKey !== "superAdmin") {
      return {
        error: "You should be a super admin to update user info",
        statusCode: 401,
      };
    }

    const users = await this.crud.read({ email });
    if (users.length === 0) {
      return { error: "User to update does not exist", statusCode: 400 };
    }

    const updatedUser = await this.crud.update(users[0]._id, newInfo);

    return {
      email: updatedUser.email,
      message: "User information updated successfully",
    };
  }

  async getAllUsers({ __token }) {
    try {
      const decoded = __token;

      // Check if the user has super admin privileges
      if (decoded.userKey !== "superAdmin") {
        return {
          error: "You should be a super admin to get all users",
          statusCode: 401,
        };
      }

      const allUsers = await this.crud.read();

      if (allUsers.length === 0) {
        return { message: "No users found", statusCode: 404 };
      }

      return { users: allUsers };
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return { error: "Internal Server Error", statusCode: 500 };
    }
  }

  async deleteAllUsers({ __token }) {
    const decoded = __token;

    // Check if the user has super admin privileges
    if (decoded.userKey !== "superAdmin") {
      return {
        error: "You should be a super admin to delete all users",
        statusCode: 401,
      };
    }

    try {
      const allUsers = await this.crud.read();
      if (allUsers.length === 0) {
        return { message: "No users found.", statusCode: 200 };
      }

      await Promise.all(allUsers.map((user) => this.crud.delete(user._id)));
      return { message: "All users deleted successfully.", statusCode: 200 };
    } catch (error) {
      console.error("Error deleting all users:", error);
      return { error: "Failed to delete all users.", statusCode: 500 };
    }
  }
};
