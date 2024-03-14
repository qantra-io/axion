const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    parentRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null,
    },
    childRoles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: [],
    }],
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;

async function checkAndAddDefaultRole() {
    const roles = await Role.find();
    if (roles.length === 0) {
        const defaultRoles = [
            { name: 'superAdmin' },
            { name: 'students' },
            { name: 'admin' }
        ];
        await Role.insertMany(defaultRoles);
    }
}

checkAndAddDefaultRole();
