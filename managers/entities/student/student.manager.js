module.exports = class Student {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.user = managers.user
        this.usersCollection = "students";
        this.userExposed = ['createStudent', 'listStudents', 'getStudent', 'updateStudent', 'deleteStudent'];
    }

    async createStudent(data) {
        const { res, userId, age, classroom,school } = data;
        
        if (!res.req.headers['authorization']) {
            return { errors: "Please Login" };
        }
    
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin', 'admin']);
        if (verify !== true) {
            return verify;
        }
    
        try {
            if (classroom) {
                const classRoom = await this.mongomodels.classroom.findById(classroom);
                if (!classRoom) {
                    return { errors: 'Classroom not found' };
                }
            }else{
                return { errors : 'please enter classroom'}
            }
    
            if (userId) {
                const user = await this.mongomodels.user.findById(userId);
                if (!user) {
                    return { errors: 'User not found' };
                }
            }else{
                return { errors : 'please enter user'}
            }
    
            const student = new this.mongomodels.student({ user_id: userId, age, classroom ,school});
            const savedStudent = await student.save();
    
            return {
                student: savedStudent,
                message: 'Student created successfully'
            };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                let errors = {};
                for (let field in error.keyPattern) {
                    let value = error.keyValue[field];
                    errors[field] = `The ${field} '${value}' already exists. Please choose a different ${field}.`;
                }
    
                return { errors };
            } else if (error.name === 'ValidationError') {
                let errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }
    
                return { errors };
            } else {
                return { errors: `Error creating student: ${error.message}` };
            }
        }
    }
    

    async getStudent(data) {
        const { res, studentId } = data;
        if(!res.req.headers['authorization']){
            return {errors :"plase Login"}
        }
         let verify= await this.user.verifytoken(res.req.headers['authorization'])
        if(verify !== true){
            return verify;
        }  
        try {
            const student = await this.mongomodels.student.findById(studentId);

            if (!student) {
                return { error: 'Student not found' };
            }

            return {
                student: student,
                message: 'Student found'
            };
        } catch (error) {
            return {errors:`Error retrieving student: ${error.message}`};
        }
    }

    async updateStudent(data) {
        const { res, studentId, age, classroom } = data;
        
        if (!res.req.headers['authorization']) {
            return { errors: "Please Login" };
        }
    
        let verify = await this.user.verifytoken(res.req.headers['authorization']);
        if (verify !== true) {
            return verify;
        }
    
        try {
            const student = await this.mongomodels.student.findById(studentId);
    
            if (!student) {
                return { errors: 'Student not found' };
            }
    
            if (age) {
                student.age = age;
            }
    
            if (classroom) {
                const classRoom = await this.mongomodels.classroom.findById(classroom);
                if (!classRoom) {
                    return { errors: 'Classroom not found' };
                }
                student.classroom = classroom;
            }
    
            const updatedStudent = await student.save();
    
            return {
                student: updatedStudent,
                message: 'Student updated successfully'
            };
        } catch (error) {
            return { errors: `Error updating student: ${error.message}` };
        }
    }
    
    async deleteStudent(data) {
        const {res, studentId } = data;
        if (!res.req.headers['authorization']) {
            return { errors: "Please Login" };
        }
    
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin']);
        if (verify !== true) {
            return verify;
        }
        try {
            const deletedStudent = await this.mongomodels.student.findByIdAndDelete(studentId);

            if (!deletedStudent) {
                return { error: 'Student not found' };
            }

            return {
                student: deletedStudent,
                message: 'Student deleted successfully'
            };
        } catch (error) {
            throw new Error(`Error deleting student: ${error.message}`);
        }
    }

    async listStudents(data) {
        const {res, studentId } = data;
        if (!res.req.headers['authorization']) {
            return { errors: "Please Login" };
        }
    
        let verify = await this.user.verifytoken(res.req.headers['authorization'], ['superAdmin','admin']);
        if (verify !== true) {
            return verify;
        }
        try {
            const students = await this.mongomodels.student.find();

            return {
                students: students,
                message: 'Students retrieved successfully'
            };
        } catch (error) {
            throw new Error(`Error listing students: ${error.message}`);
        }
    }

 
};
