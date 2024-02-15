const bcrypt = require('bcrypt');
const bcrypt_saltRounds = 10;

module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.httpExposed         = ['createUser', 'loginUser'];
        this.crud                = mongoDB.CRUD(mongomodels.user);
    }

    async createUser({username, email, password}){
        const user = {username, email, password};

        // Data validation
        let result = await this.validators.user.createUser(user);
        if(result) return result;
        
        // Creation Logic
        const passwordHash = await bcrypt.hashSync(password, bcrypt_saltRounds);
        const createdUser = await this.crud.create({username, email, passwordHash});

        let longToken       = this.tokenManager.genLongToken({userId: createdUser._id, userKey: createdUser.accessRights });
        
        // Response
        return { 
            longToken 
        };
    }

    async loginUser({email, password}){
        const users = await this.crud.read({email});
        if(users.length == 0){
            return {message: "email not found"};
        }
        const user = users[0];
        const passwordMatch = await bcrypt.compareSync(password, user.passwordHash);
        if(!passwordMatch){
            return {message: "wrong password"};
        }

        let longToken       = this.tokenManager.genLongToken({userId: createdUser._id, userKey: createdUser.accessRights });

        return {longToken}
    }

}