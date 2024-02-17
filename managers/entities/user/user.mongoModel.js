module.exports = {
    modelName: "User",
    schemaDefinition: {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        accessRights: {
            type: String,
            required: true,
            default: "user", // user -> no admin rights, school._id -> school admin, super -> super admin
        },
    }
}