const getParamNames = require('./_common/getParamNames');
/** 
 * scans all managers for exposed methods 
 * and makes them available through a handler middleware
 */

module.exports = class ApiHandler {

    /**
     * @param {object} containing instance of all managers
     * @param {string} prop with key to scan for exposed methods
     */

    constructor({config, cortex, cache, managers, prop}){
        this.config        = config;
        this.cache         = cache; 
        this.cortex        = cortex;
        this.managers      = managers;
        this.prop          = prop
        this.exposed       = {};
        this.auth          = {};
        this.mw            = this.mw.bind(this);


        /** filter only the modules that have interceptors */
        // console.log(`# Http API`);
        Object.keys(this.managers).forEach(mk=>{
            if(this.managers[mk][this.prop]){
                this.exposed[mk]=this.managers[mk];
                this.auth[mk]={};
                // console.log(`## ${mk}`);
                this.exposed[mk][this.prop].forEach(i=>{
                    let params = getParamNames(this.exposed[mk][i]);
                    this.auth[mk][i]= params.includes('__token')?true:false;
                    // console.log(`* ${i} :`, params);
                })
            }
        });

        /** expose apis through cortex */
        this.cortex.sub('*', (d, meta, cb)=>{
            let [moduleName, fnName] = meta.event.split('.');
            let targetModule = this.exposed[moduleName];
            if(!targetModule) return cb({error: `module ${moduleName} not found`});
            try {
                this._exec({data: d, meta, cb, fnName, targetModule})
            } catch(err){
                console.log(`error`, err);
                cb({error: `failed to execute ${fnName}`});
            }
        });
        
    }


    async _exec({targetModule, fnName, cb, data}){
        let result = {};
        
        if(targetModule[this.prop].includes(fnName)){
            try {
                result = await targetModule[`${fnName}`](data);
            } catch (err){
                console.log(`error`, err);
                result.error = `${fnName} failed to execute`;
            }
        } else {
            result.error =  `${fnName} is not executable`;
            console.log(`unable to find function ${fnName} in the exposed list ${this.prop} ${targetModule[this.prop]}`)
        }
        if(cb)cb(result);
        return result;
    }

     /** a middle for executing admin apis trough HTTP */
    async mw(req, res, next){

        let moduleName    = req.params.moduleName;
        let fnName        = req.params.fnName;
        let targetModule  = this.exposed[moduleName];

        if(!targetModule) return this.managers.responseDispatcher.dispatch(res, {ok: false, message: `module ${moduleName} not found`});
        
        let isAuthRequired = this.auth[moduleName][fnName];
        let __token = {auth:false};

        if(isAuthRequired){
            if(!req.headers.token){
                console.log('token required but not found')
                return this.managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            }
            let decoded = null
            try {
                decoded = this.managers.token.verifyShortToken({token: req.headers.token});
                if(!decoded){
                    console.log('failed to decode-1')
                    return this.managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
                };
            } catch(err){
                console.log('failed to decode-2')
                return this.managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            }
            __token.auth = true;
            __token.data = decoded
        }

        console.log("__token=>", __token);

        let result = await this._exec({targetModule, fnName, data: {
            ...req.body, 
            ...{ __device: req.device, __headers: req.headers } ,
            ...{__token},
        }});

        if(!result)result={}

        if(result.errors){
            return this.managers.responseDispatcher.dispatch(res, {ok: false, errors: result.errors});
        } else if(result.error){
            return this.managers.responseDispatcher.dispatch(res, {ok: false, message: result.error});
        } else {
            return this.managers.responseDispatcher.dispatch(res, {ok:true, data: result});
        }
        
    }
}