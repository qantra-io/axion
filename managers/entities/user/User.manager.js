module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.userExposed         = ['createUser'];
    }

    async createUser({ username, email, password, role = 'schooladmin' }) {
        const user = { username, email, password, role };

        // Data validation
        let result = await this.validators.user.createUser(user);
        if (result) return result;

        // Creation Logic
        let createdUser = await this.mongomodels.User.create(user);
        let longToken = this.tokenManager.genLongToken({ userId: createdUser._id, userKey: createdUser.key });

        // Response
        return {
            user: createdUser, 
            longToken
        };
    }

}
