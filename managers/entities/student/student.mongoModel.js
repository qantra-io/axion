const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  school:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'School',
    required:true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true,
  },
});

const Student = mongoose.model('Students', studentSchema);

module.exports = Student;