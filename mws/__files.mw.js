module.exports = ({ meta, config, managers }) =>{
    return async ({req, res, next})=>{

        try {
            await managers.fm.upload(req, res);
        } catch(err){
            console.log('Erorr', err);
        }
    
        next(req.files);
    }
}