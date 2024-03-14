const mongoose = require('mongoose');
module.exports = class School {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.user     = managers.user;
        this.usersCollection = "school";
        this.userExposed = ['createSchool','getSchool','listSchool','updateSchool','deleteSchool'];
    }

    async createSchool(data) {
        const { res, name, location } = data;

        if(!res.req.headers['authorization']){
            return {errors :"plase Login"}
        }
       let verify= await this.user.verifytoken(res.req.headers['authorization'],['superAdmin','admin'])
        if(verify !== true){
            return verify;
        }  
        try {
            const SchoolModel = this.mongomodels.school;
            const newSchool = new SchoolModel({name,location});

            const savedSchool = await newSchool.save();

            return {
                school: savedSchool,
                message: 'School created successfully'
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
    async getSchool(data) {
        const { schoolId } = data;
        if (!schoolId) {
            return { errors: "School Id is required" };
        }
    
        try {
            const school = await this.mongomodels.school.findById(schoolId);
    
            if (!school) {
                return { errors: 'School not found' };
            }
    
            return {
                school: school,
                message: 'School found'
            };
        } catch (error) {
            console.error(`Error retrieving school: ${error.message}`);
            return { errors: `Error retrieving school: ${error.message}` };
        }
    }
    
    
    async listSchool(data) {
        try {
            const schools = await this.mongomodels.school.find();
    
            return {
                schools: schools,
                message: 'Schools retrieved successfully'
            };
        } catch (error) {
            throw new Error(`Error listing schools: ${error.message}`);
        }
    }
    
    async updateSchool(data) {
        const { res ,schoolId, name, location } = data;
        let verify= await this.user.verifytoken(res.req.headers['authorization'],['superAdmin','admin'])
        if(verify !== true){
            return verify;
        }
        if (!schoolId) {
            return { errors: "School Id is required" };
        }
    
        try {
            const school = await this.mongomodels.school.findById(schoolId);
    
            if (!school) {
                return { error: 'School not found' };
            }
    
            school.name = name || school.name;
            school.location = location || school.location;
    
            const updatedSchool = await school.save();
    
            return {
                school: updatedSchool,
                message: 'School updated successfully'
            };
        } catch (error) {
            throw new Error(`Error updating school: ${error.message}`);
        }
    }
    async deleteSchool(data) {
        const { res,schoolId } = data;
        let verify= await this.user.verifytoken(res.req.headers['authorization'],['superAdmin'])
        if(verify !== true){
            return verify;
        }
        if (!schoolId) {
            return { errors: "School Id is required" };
        }
        try {
            const deletedSchool = await this.mongomodels.school.findByIdAndDelete(schoolId);
    
            if (!deletedSchool) {
                return { error: 'School not found' };
            }
    
            return {
                school: deletedSchool,
                message: 'School deleted successfully'
            };
        } catch (error) {
            throw new Error(`Error deleting school: ${error.message}`);
        }
    }
    
};
