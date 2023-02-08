const path   = require('path');
const glob   = require("glob");

/** 
 * load any file that match the pattern of function file and require them 
 * @return an array of the required functions
*/
module.exports = (pattern)=>{
    let files = glob.sync(pattern);
    let modules = [];
    files.forEach(p=>{
        modules.push(require(path.resolve(p)));
    })
    return modules;
}