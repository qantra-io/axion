module.exports = {
    createUser: [
        {
            label: "email",
            model: "email",
            required: true,

          },
          {
            label: "password",
            model: "password",
            type: "String",
            required: true,
          },
    ],
    loginUser: [{}],
  };