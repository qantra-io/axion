module.exports = class SchoolManager {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.schoolsCollection = "schools";
        // Add any other necessary configurations or dependencies
    }

    async createSchool({ name, location }) {
        const school = { name, location };

        // Data validation
        let result = await this.validators.school.createSchool(school);
        if (result) return result;

        // Creation Logic
        let createdSchool = await this.mongomodels.School.create(school);

        // Response
        return { school: createdSchool };
    }

    // Add other CRUD methods for School entity
};
