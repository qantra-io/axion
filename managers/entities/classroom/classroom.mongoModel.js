const mongoose = require('mongoose');

const classroomSchema = mongoose.Schema({
    name: {
        type: String,
        unique:true,
        required: true,
    },
    capacity: {
        type: Number,
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'school',
    }
},
    {
        timestamps: true,
    })

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;