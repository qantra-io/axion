module.exports = {
    createClassroom: [
        {
            model: 'name',
            required: true,
        },
        {
            model: 'capacity',
            required: true,
        },
        {
            model: 'schoolId',
            required: true,
        },
    ],
    // Add other validation schemas for Classroom entity
};
