const emojis = require('../../public/emojis.data.json');

module.exports = {
    id: {
        path: "id",
        type: "string",
        length: { min: 1, max: 50 },
    },
    username: {
        path: 'username',
        type: 'string',
        length: {min: 3, max: 20},
        custom: 'username',
    },
    password: {
        path: 'password',
        type: 'string',
        length: {min: 8, max: 100},
    },
    email: {
        path: 'email',
        type: 'string',
        length: {min:3, max: 100},
    },
    title: {
        path: 'title',
        type: 'string',
        length: {min: 3, max: 300}
    },
    label: {
        path: 'label',
        type: 'string',
        length: {min: 3, max: 100}
    },
    shortDesc: {
        path: 'desc',
        type: 'string',
        length: {min:3, max: 300}
    },
    longDesc: {
        path: 'desc',
        type: 'string',
        length: {min:3, max: 2000}
    },
    url: {
        path: 'url',
        type: 'string',
        length: {min: 9, max: 300},
    },
    emoji: {
        path: 'emoji',
        type: 'Array',
        items: {
            type: 'string',
            length: {min: 1, max: 10},
            oneOf: emojis.value,
        }
    },
    price: {
        path: 'price',
        type: 'number',
    },
    avatar: {
        path: 'avatar',
        type: 'string',
        length: {min: 8, max: 100},
    },
    text: {
        type: 'String',
        length: {min: 3, max:15},
    },
    longText: {
        type: 'String',
        length: {min: 3, max:250},
    },
    paragraph: {
        type: 'String',
        length: {min: 3, max:10000},
    },
    phone: {
        type: 'String',
        length: 13,
    },
    email: {
        type: 'String',
        regex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    number: {
        type: 'Number',
        length: {min: 1, max:6},
    },
    arrayOfStrings: {
        type: 'Array',
        items: {
            type: 'String',
            length: { min: 3, max: 100}
        }
    },
    obj: {
        type: 'Object',
    },
    bool: {
        type: 'Boolean',
    },
    schoolName: {
        path: "schoolName",
        type: "string",
        length: { min: 3, max: 100 },
    },
    address: {
        path: 'address',
        type: 'string',
        length: {min: 5, max: 200},
    },
    city: {
        path: 'city',
        type: 'string',
        length: {min: 5, max: 200},
    },
    phoneNumber: {
        path: 'phoneNumber',
        type: 'string',
        length: 12,
    },
    principal: {
        path: 'principal',
        type: 'string',
        length: {min: 5, max: 50},
    },
    studentCount: {
        path: 'studentCount',
        type: 'number',
    },
    teachers: {
        path: 'teachers',
        type: 'Array',
        items: {
            type: 'Object',
            properties: {
                name: {
                    type: 'string',
                    length: {min: 3, max: 50},
                },
                subject: {
                    type: 'string',
                    length: {min: 3, max: 50},
                },
            },
        },
    },
    classes: {
        path: 'classes',
        type: 'Array',
        items: {
            type: 'Object',
            properties: {
                className: {
                    type: 'string',
                    length: {min: 3, max: 50},
                },
                classCode: {
                    type: 'string',
                    length: {min: 3, max: 20},
                },
                students: {
                    type: 'Array',
                    items: {
                        type: 'Object',
                        properties: {
                            name: {
                                type: 'string',
                                length: {min: 3, max: 50},
                            },
                            age: {
                                type: 'number',
                            },
                            grade: {
                                type: 'string',
                                length: {min: 1, max: 2},
                            },
                        },
                    },
                },
            },
        },
    },
    facilities: {
        path: 'facilities',
        type: 'Array',
        items: {
            type: 'string',
            length: { min: 3, max: 50}
        }
    },
    isOpen: {
        path: 'isOpen',
        type: 'boolean',
    },
    students: {
        path: 'students',
        type: 'Array',
        items: {
            type: 'Object',
            properties: {
                name: {
                    type: 'string',
                    length: {min: 3, max: 50},
                },
                age: {
                    type: 'number',
                },
                grade: {
                    type: 'string',
                    length: {min: 1, max: 2},
                },
                address: {
                    type: 'string',
                    length: {min: 5, max: 200},
                },
                phoneNumber: {
                    type: 'string',
                    length: 12,
                },
                email: {
                    type: 'string',
                    regex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                },
            },
        },
    },
}