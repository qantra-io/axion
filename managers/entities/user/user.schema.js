module.exports = {
    createUser: [
        {
            model: 'username',
            required: true,
        },
        {
            model: 'email',
            required: true,
        },
        {
            model: 'password',
            required: true,
        },
        {
            model: 'accessRights',
            // required: false,
        },
    ],
    updateUserAccessRights: [
        {
            model: 'accessRights',
            required: true,
        },
    ],
};
