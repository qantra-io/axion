module.exports = class Classroom { 

  constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
      this.config              = config;
      this.cortex              = cortex;
      this.validators          = validators; 
      this.tokenManager        = managers.token;
      this.httpExposed         = ['createClassroom', 'get=getAllClssrooms', 'delete=deleteClassroom'];
      this.crud                = mongoDB.CRUD(mongomodels.classroom);
      this.crud_school         = mongoDB.CRUD(mongomodels.school);
  }

  async createClassroom({label, __token, __school}){
      
      const schoolId   = __school.schoolId;
      const schoolName = __school.schoolName;
      try {
        const newClass = await this.crud.create({ label, school: schoolId });
        return {
            label: newClass.label,
            school: schoolName,
        };
    } catch (error) {
        console.error('Error creating classroom:', error);
        return {
            error: 'Failed to create classroom.',
        };
    }
  }

  async getAllClssrooms({__token, __school}){
      const schoolId   = __school.schoolId;
      const schoolName = __school.schoolName;

      const classrooms = await this.crud.read({school: schoolId});
      const classroomsRes = classrooms.map(_ => _.label);
      
      return {
          school: schoolName,
          classrooms: classroomsRes,
      };
  }

  async deleteClassroom({label, __token, __school}){
      const schoolName = __school.schoolName;
      const classrooms = await this.crud.read({label});

      if(classrooms.length == 0){
          return {error: `classroom not found in school ${schoolName}`, statusCode: 400};
      }
      try {
        await this.crud.delete(classrooms[0]._id);
        return {
            message: `Deleted classroom with the label ${label} in school ${schoolName}`,
        };
    } catch (error) {
        console.error('Error deleting classroom:', error);
        return {
            error: 'Failed to delete classroom.',
        };
    }
  }

}