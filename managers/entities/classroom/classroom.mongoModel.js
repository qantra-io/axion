const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = {
    modelName: "Classroom",
    schemaDefinition: {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        school: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
    },
    indecies: [
        [
            {label: 1, school: 1},
            {unique: true},
        ],
    ],
}