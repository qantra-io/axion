module.exports = {
    create: [
        {
            model: 'label',
            required: true,
        },
        {
            model: 'mongoId',
            label: 'school Id',
            required: true,
        },
    ],
    schoolId: [
        {
            model: 'mongoId',
            label: 'school Id',
            required: true,
        },
    ],
}