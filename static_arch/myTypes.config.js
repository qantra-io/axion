/** any of my types can be pinned
 * some of my types have a predefined set of topics
 * topics can restrict one type of replys. for example all topics 
 * by default inherits all the replys types
 * but it can restrict on of them.  
 */

module.exports = {
    'typeOne': {
        arrField: ['text', 'image', 'gallery'],
        NoField: 35,
        boolField: false,
    },
    'typeTwo': {
        arrField: ['text', 'url', 'video'],
        NoField: 1000,
        boolField: true,
    },
}
