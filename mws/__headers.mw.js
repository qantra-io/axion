module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        next(req.headers);
    }
}