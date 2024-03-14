module.exports = class Classroom {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.tokenmanager;
        this.user = managers.user;
        this.usersCollection = "classroom";
        this.userExposed = ['createClassroom', 'listClassrooms', 'deleteClassroom', 'updateClassroom', 'getClassroom'];
    }

    async createClassroom(data) {
        const { res, school, name, capacity } = data;


        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin', 'admin'])
        if (verify !== true) {
            return verify;
        }
        try {
            // Check if teacher with given ID exists
            const teacher = await this.mongomodels.school.findById(school);
            if (!teacher) {
                return { error: 'school not found' };
            }

            // Create new classroom
            const classroom = new this.mongomodels.classroom({ name, capacity, school });
            const savedClassroom = await classroom.save();

            return {
                classroom: savedClassroom,
                message: 'Classroom created successfully'
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

    async getClassroom(data) {
        const { classroomId } = data;

        try {
            const classroom = await this.mongomodels.classroom.findById(classroomId);

            if (!classroom) {
                return { error: 'Classroom not found' };
            }

            return {
                classroom: classroom,
            };
        } catch (error) {
            throw new Error(`Error retrieving classroom: ${error.message}`);
        }
    }

    async updateClassroom(data) {
        const { res, classroomId, name, capacity, school } = data;

        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin', 'admin'])
        if (verify !== true) {
            return verify;
        }
        try {
            const classroom = await this.mongomodels.classroom.findById(classroomId);

            if (!classroom) {
                return { errors: 'Classroom not found' };
            }

            if (name) {
                classroom.name = name;
            }
            if (capacity) {
                classroom.capacity = capacity;
            }
            if (school) {
                const schooldata = await this.mongomodels.school.findById(school);
                if (!schooldata) {
                    return { errors: 'school not found' };
                }
                classroom.school = school;
            }

            const updatedClassroom = await classroom.save();

            return {
                classroom: updatedClassroom,
                message: 'Classroom updated successfully'
            };
        } catch (error) {
            return {
                errors: `Error updating classroom: ${error.message}`
            };
        }
    }

    async deleteClassroom(data) {
        const { res, classroomId } = data;
        if (!res.req.headers['authorization']) {
            return { errors: "plase Login" }
        }
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin'])
        if (verify !== true) {
            return verify;
        }
        try {
            const deletedClassroom = await this.mongomodels.classroom.findByIdAndDelete(classroomId);

            if (!deletedClassroom) {
                return { error: 'Classroom not found' };
            }

            return {
                classroom: deletedClassroom,
                message: 'Classroom deleted successfully'
            };
        } catch (error) {
            return { errors: `Error deleting classroom: ${error.message}` }
        }
    }

    async listClassrooms(data) {
        try {
            const classrooms = await this.mongomodels.classroom.find();

            return {
                classrooms: classrooms,
                message: 'Classrooms retrieved successfully'
            };
        } catch (error) {
            throw new Error(`Error listing classrooms: ${error.message}`);
        }
    }


};
