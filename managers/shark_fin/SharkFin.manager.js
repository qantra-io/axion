const jwt        = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const md5        = require('md5');

module.exports = class SharkFin {

  constructor({ config, layers, actions, cache, managers,utils, oyster}) {
    this.config  = config;
    this.utils   = utils;
    this.oyster  = oyster;
    this.contentToken = managers.contentToken;
    this.layers  = layers;
    this.actions = actions;
    this.wildAccess = {};
    this.userAccess = {};
    /** make sure the ranks doesn't have a zero rank. */
    if (Object.values(this.actions).includes(0)) { throw Error("dont use 0 as a rank") }

    this._addWilds();
  }

  async isUserBlocked({ userId, nodeId }) {
    let blockedNodeIds = await this.oyster.call('nav_relation', {
      relation: '_members',
      label: 'blocked',
      _id: `user:${userId}`,
      withScores: true,
    });
    for(const blockedNodeId of Object.keys(blockedNodeIds)){
      if(nodeId.includes(blockedNodeId.split(':')[1])) return true;
    }
    return false ;
  }
  
  _addWilds() {
    const wildAccessList = require('../../static_arch/wild.system')
    for (const { userId, layer, action } of wildAccessList) {
      this.addWildAccess({ userId, layer, action });
    }
  }


  /** although adding wild access here add that to the user
   * tree but it shouldn't be checked with every direct access. */
   
  addWildAccess({ userId, layer, action }) {
    if (!this.wildAccess[userId]) this.wildAccess[userId] = {};
    this.wildAccess[userId][layer] = this.actions[action];
  }

  getWildAccess({ userId, layer }) {
    if (!this.wildAccess[userId]) this.wildAccess[userId] = {};
    while (!this.wildAccess[userId][layer] && layer) {
      layer = layer.split('.').slice(0, -1).join('.');
    }
    const rank = this.wildAccess[userId][layer];
    return rank ? rank : 0;
  }

  addDirectAccess({ userId, nodeId, action }) {
    this.oyster.call('update_relations', {
      _id: `user:${userId}`,
      set: {
        _members: [`node:${nodeId}~${this.actions[action]}:!`],
      },
    })
  }

  removeDirectAccess({ userId, nodeId }) {
    this.oyster.call('update_relations', {
      _id: `user:${userId}`,
      remove: {
        _members: [`node:${nodeId}`],
      },
    })
  }

  async getDirectAccessRank({ userId, nodeId }) {
    const nodes = await this.oyster.call('relation_score', {
      relation: '_members',
      items: [`node:${nodeId}`],
      _id: `user:${userId}`,
    })
    return Object.values(nodes)[0];
  }

  _getActionRank({ action, ceil }) {
    /** if the action is missin and opt ceil 
    found it will be replaced with high value 
    important for defensive programming to 
    prevent miss written actions from granting access
    **/
    let acRank = this.actions[action];
    if (!acRank) acRank = ceil ? 1000 : 0;
    return acRank;
  }

  _getLayerConfig({ layer, variant }) {
    let defaultVariant = "_default";
    variant = variant ? `_${variant}` : defaultVariant;

    let exactLayer = this.utils.getDeepValue(layer, this.layers);
    if (!exactLayer) {
      return {};
    }

    let layerConfig = exactLayer[variant] ? exactLayer[variant] : exactLayer[defaultVariant];
    return layerConfig || {};
  }

  _getParentLayerPath({ layer }) {
    let frgs = layer.split('.');
    if (frgs.length < 2) {
      /** if no parent **/
      return false;
    } else {
      /** return parent layer **/
      frgs.pop();
      return frgs.join('.')
    }
  }

  getLayerIdFromToken({ tokenContent, layer }) {
      let count = 0;
      let id = null;
      for (const l of tokenContent.layer.split('.')) {
          if (l == layer) id = tokenContent.id.split('.')[count];
          count++;
      }
      return id;
  }

  _getParentId({ nodeId }) {
    let frgs = nodeId.split('.');
    if (frgs.length < 2) {
      /** if no parent **/
      return false;
    } else {
      /** return parent layer **/
      frgs.pop();
      return frgs.join('.')
    }
  }

  getLayers() {
    return this.layers;
  }

  async isGranted({ layer, variant, userId, nodeId, action, isOwner, childLayer }) {
    let inqueryActionRank = this._getActionRank({ action, ceil: true });

    let curentNodeId = null;
    if(nodeId) curentNodeId = nodeId.split('.').at(-1);

    /** check layer config it may have a default **/
    let layerConfig = {};
    if(layer) layerConfig = this._getLayerConfig({ layer, variant });
    // console.log(`layerConfig`, layer, layerConfig);
    /*****************************IS USER BLOCKED*****************************/
    const isblocked = await this.isUserBlocked({ userId, nodeId });
    if(isblocked) return false;
    /********************************OWNER CAN********************************/
    if(isOwner) {
      if(layerConfig.ownerCan) {
        // console.log('is Owner');
        const layerOwnerActionRank = this._getActionRank({ action: layerConfig.ownerCan });
        if (layerOwnerActionRank >= inqueryActionRank) return true;
      }
      // else if (layerConfig.inherit){
      //   const isGranted = await this._checkInheritance({
      //     layerConfig, layer, nodeId, variant, userId, action, isOwner });
      //   if (isGranted) return true;
      // }
    }
    /*******************************WILD ACCESS*******************************/
    const wild = this.getWildAccess({ userId, layer });
    if(wild != 0 && wild >= inqueryActionRank) return true;
    /*******************************NO ONE CAN********************************/
    /** check if action is blocked on layer level **/
    if (layerConfig.noOneCan) {
      let layerBlockedActionRank = this._getActionRank({ action: layerConfig.noOneCan });
      if (layerBlockedActionRank <= inqueryActionRank) return false;
    }
    /*******************************ANYONE CAN********************************/
    /** check if the default action would allow **/
    if (layerConfig.anyoneCan) {
      let layerActionRank = this._getActionRank({ action: layerConfig.anyoneCan });
      /** granted by default access **/
      /** enable block on resource is another story, because at this point
          we will need to create a block list for the resource itself**/  
      if (layerActionRank >= inqueryActionRank) return true;
    }
    /******************************DIRECT ACCESS******************************/
    if (nodeId && userId) {
      /** user is always assigned to a single layer **/
      /** check if has direct access **/
      let directRank = await this.getDirectAccessRank({ userId, nodeId: curentNodeId });
      /** granted by direct access */
      if (directRank >= inqueryActionRank) return true;
      /* if blocked dont authorize */
      if (directRank == -1) return false;
    }
    /*******************************INHERITANCE*******************************/
    /** check if is granted by inheritance by parent layers **/
    const isGranted = await this._checkInheritance({ 
      layerConfig, layer, nodeId, variant, userId, action, isOwner });
    if(isGranted) return true;
    return false;
  }

  async _checkInheritance({ layerConfig, layer, nodeId, variant, userId, action, isOwner }) {
    if (layerConfig.inherit) {
      console.log(`~ lets inherit`)
      /** if the layer allows inhertance **/
      let parentLayer = this._getParentLayerPath({ layer });
      let parentId = null;
      if(nodeId) parentId = this._getParentId({ nodeId });
      if (!parentLayer) console.log(`parent not found`);
      else {
        let isGranted = await this.isGranted({
          layer: parentLayer,
          nodeId: parentId ? parentId : undefined,
          variant,
          userId,
          action,
          isOwner,
          childLayer: layer
        });
        if (isGranted) return true;
      }
    }
  }
}