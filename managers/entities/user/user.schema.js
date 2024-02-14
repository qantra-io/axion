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
            model: 'role', // Add validation for the 'role' field
            required: true,
            allowedValues: ['superadmin', 'schooladmin', 'student'], // Adjust as needed
        },
    ],
};
