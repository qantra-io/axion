module.exports = ({ meta, config, managers, validators, mongomodels, mongoDB }) =>{
    return async ({req, res, next, results})=>{
        const schoolId = results.__token.userKey;
        console.log(schoolId)
        let result = await validators.classroom.schoolId({mongoId: schoolId});
        if(result) return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized, you should be a school admin'});

        const crud_school = mongoDB.CRUD(mongomodels.school);
        const schools = await crud_school.read({_id:schoolId});
        if(schools.length == 0){
            return managers.responseDispatcher.dispatch(res, {ok: false, code:400, errors: 'school not found'});
        }
        const school = schools[0];

        next({schoolId,schoolName: school.name});
    }
}