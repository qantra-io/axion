const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const useragent         = require('useragent');
const requestIp         = require('request-ip');
const app               = express();


module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
    }
    
    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        /** get ip and agent */
        app.use((req, res, next)=>{
            let ip = 'N/A';
            let agent = 'N/A';
            ip = requestIp.getClientIp(req) || ip;
            agent = useragent.lookup(req.headers['user-agent']) || agent;
            req.device = {ip, agent};
            next();
        });

        /** an error handler */
        app.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        });
        
        /** a single middleware to handle all */
        app.post('/api/:moduleName/:fnName', this.userApi.mw);
        
        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}