const layers = {

    board: {

        /** all board are public by default */
        _default: { anyoneCan: 'read', ownerCan: 'audit' },
        _public:  { anyoneCan: 'create', ownerCan: 'audit' },
        _private: { anyoneCan: 'none' },
        _store:   { anyoneCan: 'read', noOneCan: 'create' },

        post: {

            _default: { inherit: true }, 
            _public:  { inherit: true },
            _private: { inherit: true },
            
            comment: {
                _default: { inherit: true }, 
                reply: {
                    _default: {inherit: true},
                    vote: {
                        _default: {anyoneCan: 'create'},
                    },
                },
                vote: {
                    _default: {anyoneCan: 'create'},
                },
            },
            vote: {
                _default: {anyoneCan: 'create'},
            },
            sticker: {
                _default: {inherit: true},
            }
        }
    }
}

const actions = {
    blocked: -1,
    none: 1,
    read: 2,
    create: 3,
    audit: 4,
    config: 5
}


module.exports = {
    layers,
    actions
}