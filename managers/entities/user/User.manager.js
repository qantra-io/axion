const bcrypt = require('bcrypt');
module.exports = class User {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.usersCollection = "users";
        this.userExposed = ['createUser', 'login', 'list', 'createRole', 'update', 'register', 'userRoleChange', 'verify'];
    }

    async login(data) {
        const { email, username, password, __device } = data;
        let user = await this.mongomodels.user.findOne({ $or: [{ email }, { username }] }).populate('role')
            .exec();;

        if (!user) {
            return { errors: "Invalid credentials" }
        }
        if (!user.verified) {
            return { errors: 'User is not verified' };
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { errors: "Invalid credentials" }
        }

        const authToken = this.tokenManager.genShortToken({ userId: user._id, userKey: user, sessionId: data.res.req.sessionID, deviceId: __device });

        return {
            user,
            authToken
        };
    }
    async register({ name, phone, username, email, password }) {
        try {
            let createdUser = await this.mongomodels.user.create({
                name,
                phone,
                username,
                email,
                password,
                verifyAt: false,
            });


            let longToken = this.tokenManager.genLongToken({ userId: createdUser._id, userKey: createdUser.key });


            return {
                user: createdUser,
                longToken
            };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                let errors = {};
                for (let field in error.keyPattern) {
                    let value = error.keyValue[field];
                    errors[field] = `The ${field} '${value}' already exists. Please choose a different ${field}.`;
                }

                return {
                    errors: errors
                };
            } else if (error.name === 'ValidationError') {
                let errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }

                return {
                    errors: errors
                };
            }
        }
    }
    async list(data) {
        const { res, page = 1, limit = 10 } = data;
        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        let verify = await this.verifytoken(res.req.headers['authorization'], ['superAdmin'])

        try {
            if (verify === true) {
                let skip = (page - 1) * limit;

                let users = await this.mongomodels.user.find()
                    .skip(skip)
                    .limit(limit);

                return users;
            } else {
                verify = await this.verifytoken(res.req.headers['authorization'], ['admin'])
                if (verify !== true) {
                    return verify;
                }
                let skip = (page - 1) * limit;

                // Assuming this.mongomodels.role is your Role model
                let superAdminRole = await this.mongomodels.role.findOne({ name: 'superAdmin' });
                let adminRole = await this.mongomodels.role.findOne({ name: 'admin' });

                // Checking if superAdminRole is found
                if (!superAdminRole) {
                    return { errors: 'SuperAdmin role not found' };
                }

                let superAdminRoleId = superAdminRole._id;
                let adminRoleId = adminRole._id;

                let users = await this.mongomodels.user
                    .find({
                        role: {
                            $nin: [superAdminRoleId, adminRoleId]
                        }
                    })
                    .skip(skip)
                    .limit(limit);

                return users;
            }
        } catch (error) {
            return { errors: `Error listing users: ${error.message}` };
        }
    }

    async verifytoken(token, role = []) {
        try {
            let verify = this.tokenManager.verifyShortToken({ token });
            if (verify.exp * 1000 < Date.now()) {
                return { errors: 'Token expired, please log in again' };
            }
            if (role.length !== 0) {
                if (role.includes(verify.userKey.role.name)) {
                    return true;
                } else {
                    return { errors: 'Access denied' };
                }
            }

            return true;
        } catch (error) {
            return { errors: `Error verifying token: ${error.message}` };
        }
    }

    async verify(data) {
        const { res, userId } = data
        if (res.req.headers["authorization"]) {
            let verify = await this.verifytoken(res.req.headers['authorization'], ['superAdmin', 'admin'])

            if (verify !== true) {
                return verify;
            }
            let user = await this.mongomodels.user.findOne({ _id: userId });
            if (!user) {
                return { errors: 'user not found' }
            }

            try {
                await this.mongomodels.user.findOneAndUpdate({ _id: userId }, { $set: { verified: true } });
                user = await this.mongomodels.user.findOne({ _id: userId });
                return user;
            } catch (error) {
                return { errors: `Error creating role: ${error.message}` };
            }
        } else {
            return { errors: 'Access Denied' }
        }


    }


    async update(data) {
        let { res, userId, name, username, phone, email } = data;


        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        if (userId) {
            let verify = await this.verifytoken(res.req.headers['authorization'], ['superAdmin'])
            if (verify !== true) {
                return verify;
            }
        } else {
            let verify = this.tokenManager.verifyShortToken({ token: res.req.headers["authorization"] });
            userId = verify.userKey._id;
        }


        try {
            // Find the user by userId
            let user = await this.mongomodels.user.findById(userId);

            if (!user) {
                return { errors: 'User not found' };
            }

            if (username) {
                // Check if the new username is unique
                let existingUser = await this.mongomodels.user.findOne({ username: username });
                if (existingUser && existingUser._id.toString() !== userId) {
                    return { errors: `The username '${username}' already exists. Please choose a different username.` };
                }
                user.username = username;
            }

            if (email) {
                // Check if the new email is unique
                let existingUser = await this.mongomodels.user.findOne({ email: email });
                if (existingUser && existingUser._id.toString() !== userId) {
                    return { errors: `The email '${email}' already exists. Please choose a different email.` };
                }
                user.email = email;
            }
            user.phone = phone;
            user.name = name;

            let updatedUser = await user.save();

            return updatedUser;
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                let errors = {};
                for (let field in error.keyPattern) {
                    let value = error.keyValue[field];
                    errors[field] = `The ${field} '${value}' already exists. Please choose a different ${field}.`;
                }

                return {
                    errors: errors
                };
            } else if (error.name === 'ValidationError') {
                let errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }

                return {
                    errors: errors
                };
            } else {
                throw new Error(`Error updating user: ${error.message}`);
            }
        }
    }


    async createRole(data) {
        const { res, name, parentRole, childRole } = data;

        if (await this.verifytoken(res.req.headers["authorization"], ['superAdmin'])) {
            try {
                let Role = await new this.mongomodels.role({ name, parentRole, childRole }).save();
                return Role;
            } catch (error) {
                return { errors: `Error creating role: ${error.message}` };
            }
        } else {
            return { errors: 'Access denied' };
        }
    }
    async userRoleChange(data) {
        const { res, role, userId } = data;
        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        let verify = await this.verifytoken(res.req.headers['authorization'], ['superAdmin'])
        if (verify !== true) {
            return verify;
        }
        if (verify === true) {
            try {
                let roledata = await this.mongomodels.role.findOne({ _id: role })
                
                if (!roledata) {  
                    return { errors: "Role not found" }
                }
                let user = await this.mongomodels.user.findOneAndUpdate(
                    { _id: userId },
                    { $set: { role: role } },
                    { new: true }
                );
                if (!user) {
                    return { errors: 'users not found' }
                }
                return user;
            } catch (error) {
                return { errors: `Error updating user role: ${error.message}` };
            }
        } else {
            return { errors: 'Access denied' };
        }
    }

    async createUser(data) {
        try {
            const { res, name, username, email, phone, password, role } = data

            if (!res.req.headers['authorization']) {
                return { errors: "plase Login" }
            }
            let verify = await this.verifytoken(res.req.headers['authorization'], ['superAdmin'])
            if (verify !== true) {
                return verify;
            }
            const createdUser = await new this.mongomodels.user({ name, username, email, phone, password, role, verified: true }).save();

            return {
                user: createdUser,
            };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                let errors = {};
                for (let field in error.keyPattern) {
                    let value = error.keyValue[field];
                    errors[field] = `The ${field} '${value}' already exists. Please choose a different ${field}.`;
                }

                return {
                    errors: errors
                };
            } else if (error.name === 'ValidationError') {
                let errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }

                return {
                    errors: errors
                };
            }
        }
    }
}
