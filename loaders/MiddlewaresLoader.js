const loader = require('./_common/fileLoader');

module.exports = class MiddlewareLoader { 

    constructor(injectable){
        this.mws = {};
        this.injectable = injectable;
    }

    load(){
        const mws = loader('./mws/**/*.mw.js');
        Object.keys(mws).map(ik=>{
            /** call the mw builder */
            mws[ik]=mws[ik](this.injectable);
        })
        return mws;
    }
   
}