const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(value) {
                // Regular expression for email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    phone: {
        code: {
            type: String,
            required: true,
        },
        number: {
            type: Number,
            required: true,
        }
    },
    password: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
    },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    try {
        const user = this;
        if (!user.isModified('password')) return next();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

const Role = require('./role.mongoModel');

async function checkAndAddDefaultUser() {
    const roles = await Role.find();
    if (roles.length !== 0 ) {
        const users = await User.find();
        if (users.length === 0) {
            const defaultUser = new User({
                name:'superAdmin',
                username: 'superAdmin',
                email: 'super@gmail.com',
                phone: { code: '+91', number: 12987643 },
                password: 'Super@dmin123',
                verified: true,
                role: roles[0]._id,
            });
            await defaultUser.save();
            console.log('Default user "superAdmin" added.');
        }
    }

}

checkAndAddDefaultUser();
