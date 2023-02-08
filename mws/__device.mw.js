const useragent         = require('useragent');
const requestIp         = require('request-ip');

module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        let ip = 'N/A';
        let agent = 'N/A';
        ip = requestIp.getClientIp(req) || ip;
        agent = useragent.lookup(req.headers['user-agent']) || agent;
        const device = {
            ip, agent
        }
        next(device);
    }
}