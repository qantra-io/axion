const loader = require('./_common/fileLoader');

module.exports = class ResourceMeshLoader { 

    constructor(injectable){
        this.nodes = {};
        this.injectable = injectable;
    }

    load(){
        const nodes = loader('./mws/**/*.rnode.js');

        /** validate nodes */

        return this.nodes;
    }
   
}