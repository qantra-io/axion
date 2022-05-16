const debug = require('debug')('cp:StackBolt');
/** exports an instance when needed */
module.exports = class StackBolt {

    /**
     * 
     * @param {object} inject managers 
     */
    constructor({mwsRepo, stack, _id, managers, req, res, onDone, onError}={}){
      this.mwsRepo   = mwsRepo; 
      this.stack     = stack;
      this.managers  = managers;
      this.index     = 0;
      this.run       = this.run.bind(this);
      this.next      = this.next.bind(this);
      this.end       = this.end.bind(this);
      this.req       = req; 
      this.res       = res; 
      this.results   = {};
      this.onDone    = onDone? onDone: ()=>{};
      this.onError   = onError? onError: ()=>{};
    }
  
    /** execute the end of the stack */
    end({error}={}){
      error = error || "Unexpected Failure";
      this.req.stackError = error;
      /** if the last node is the one that is call the end */
      if(this.index==(this.stack.length-1)){
        /** failing over as the last fn is broken. */
        debug(`stack broke: `, error);
        if(this.res.end)this.res.end();
      } else {
        debug(`stack error: `, error);
        this.index = this.stack.length-1;
        this.run({index: this.index });
      }
    }
  
    next(data, index){

      this.results[this.stack[this.index]]=data||{};
      let indexToBe = index || this.index+1;
    
      if(!this.stack[indexToBe]){
        debug('reached end of the stack');
        this.onDone({req: this.req, res: this.res, results: this.results});
        return;
      } else {
        this.index = indexToBe;
      }
      this.run({index: this.index});
    }
       
    run({index}={}){
  
      let tIndex = index||this.index;
      // if(tIndex==0)console.log("#", this.req.method, this.req.url);
      
      /** fn bludPrint */
      if(!this.stack[tIndex]){
        // console.log(`Index ${tIndex} not found on schema`,this.stack);
        return;
      }

      let fnKey = this.stack[tIndex];

      let fn    = this.mwsRepo[fnKey];

      if(!fn) {
        console.log("___Function not found __ Jumping ____ ")
        this.end({error: `function not found on function ${fnBlueprint.key} `});
      } else {
        /** contains information about which app, which route, and which module
         * is using the function
         */
       
        /** exec the mw */
        

        try { 
          fn({
          req: this.req,
          res: this.res, 
          results: this.results,
          next: this.next,
          end: this.end, 
          stack: this.stack, 
          self: fn});
        } catch(err){
          console.log(`failed to execute ${fnKey}:`, err);
          this.end({error: `execution failed on function ${fnKey}, ${err}`})
        }
        
      }
      
    }
  
  }