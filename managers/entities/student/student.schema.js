module.exports = {
    createStudent: [
        {
            model: 'name',
            required: true,
        },
        {
            model: 'age',
            required: true,
        },
        {
            model: 'classroomId',
            required: true,
        },
    ],
    // Add other validation schemas for Student entity
};
