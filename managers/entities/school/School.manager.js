module.exports = class School { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.tokenManager        = managers.token;
        this.httpExposed         = ['createSchool','get=getAllSchools','put=updateSchool','delete=deleteAllSchools'];
        this.crud                = mongoDB.CRUD(mongomodels.school);
    }

    async createSchool({ name, address, level, __token }) {

        const decoded = __token;
        if (decoded.userKey !== "superAdmin") {
            return { error: 'You should be a super admin to do that' };
        }

        const school = { name: name, address: address, eduLevel: level };

        // Data validation
        let result = await this.validators.school.createSchool(school);
        if (result) return result;

        try {
            // Creation Logic
            const createdSchool = await this.crud.create(school);
    
            // Response
            return {
                createdSchool,
            };
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error, handle it
                return {
                    error: 'Duplicate school name. Please choose another name.',
                    statusCode: 400,
                };
            } else {
                // Other unexpected error, log it and return a generic error message
                console.error('Error creating school:', error);
                return { error: 'Failed to create school.', statusCode: 500 };
            }
        }
    }
    

    async getAllSchools({__token}){
        const decoded = __token;
        if(decoded.userKey != "superAdmin"){
            return {error: 'You should be a super admin to do that'};
        }
        const schools = await this.crud.read({});
        return { schools };
    }

    async updateSchool({id, name, address, level, __token}){
        const decoded = __token;
        if(decoded.userKey != "superAdmin"){
            return {error: 'You should be a super admin to do that'};
        }
    
        const schoolUpdates = { name, address, eduLevel: level };
    
    
        // Update Logic
        const updatedSchool = await this.crud.update(id, schoolUpdates);
    
        // Response
        return { 
            updatedSchool, 
        };
    }

    async deleteAllSchools({__token}) {
        const decoded = __token;
        if(decoded.userKey != "superAdmin"){
            return {error: 'You should be a super admin to do that'};
        }
      
        try {
            const allUsers = await this.crud.read();
            if (allUsers.length === 0) {
              return { message: "No Schools found.", statusCode: 200 };
            }
        
            await Promise.all(allUsers.map(user => this.crud.delete(user._id)));
            return { message: "All Schools deleted successfully.", statusCode: 200 };
          } catch (error) {
            console.error("Error deleting all schools:", error);
            return { error: "Failed to delete all schools.", statusCode: 500 };
          }
      
      }


}