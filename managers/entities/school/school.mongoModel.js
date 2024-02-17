module.exports = {
    modelName: "School",
    schemaDefinition: {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        eduLevel: {
            type: String,
            required: true,
            trim: true,
        },
    }
}