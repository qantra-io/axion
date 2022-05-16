const utils                 = require('../libs/utils');
const ApiHandler            = require("../managers/api/Api.manager");
const LiveDB                = require('../managers/live_db/LiveDb.manager');
const UserServer            = require('../managers/http/UserServer.manager');
const ResponseDispatcher    = require('../managers/response_dispatcher/ResponseDispatcher.manager');
const ValidatorsLoader      = require('./ValidatorsLoader');
const MongoLoader           = require('./MongoLoader');
const MiddlewaresLoader     = require('./MiddlewaresLoader');
const ResourceMeshLoader    = require('./ResourceMeshLoader');

const TokenManager          = require('../managers/entities/token/Token.manager');
const User                  = require('../managers/entities/user/User.manager');
const VirtualStack          = require('../managers/virtual_stack/VirtualStack.manager');

/** 
 * load sharable modules 
 * @return modules tree with instance of each module
*/
module.exports = class ManagersLoader {
    constructor({ config, cortex, cache }) {
        this.managers       = {};
        this.config         = config;
        this.cache          = cache;
        this.cortex         = cortex;
        this._preload();
        this.injectable     = {
            utils,
            cache, 
            config,
            cortex, 
            managers: this.managers, 
            validators: this.validators,
            mongomodels: this.mongomodels,
            resourceNodes: this.resourceNodes,
        };
        
    }

    _preload(){
        const validatorsLoader  = new ValidatorsLoader({
            models: require('../managers/_common/schema.models'),
            customValidators: require('../managers/_common/schema.validators'),
        });
        
        const mongoLoader       = new MongoLoader({ 
            schemaExtension: "mongoModel.js"
        });

        const resourceMeshLoader  = new ResourceMeshLoader({})

        this.validators           = validatorsLoader.load();
        this.mongomodels          = mongoLoader.load();
        this.resourceNodes        = resourceMeshLoader.load();

    }

    load() {
        /** Cusom Managers */
        this.managers.token                 = new TokenManager(this.injectable);
        this.managers.user                  = new User(this.injectable);
        
        /** Standered Managers */
        this.managers.responseDispatcher    = new ResponseDispatcher();
        this.managers.liveDb                = new LiveDB(this.injectable);


        const middlewaresLoader             = new MiddlewaresLoader(this.injectable);
        
        const mwsRepo                       = middlewaresLoader.load();
        this.injectable.mwsRepo             = mwsRepo;


        this.managers.mwsExec               = new VirtualStack({...{preStack: [
            // '__token',
            '__device',
        ]}, ...this.injectable});

        
        this.managers.userApi               = new ApiHandler({...this.injectable,...{prop:'userExposed'}});
        this.managers.userServer            = new UserServer({ config: this.config, managers: this.managers });

        return this.managers;
    }

}

