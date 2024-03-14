module.exports = {
    'username': (data)=>{
        if(data.trim().length < 3){
            return false;
        }
        return true;
    },
    'city':(data) =>{
        if(!data.match('india')){
            return false
        }
        return true;
    },
    'counter': (data)=>{
        let counterKeys = Object.keys(data);
        let valid = true;
        for(let i=0; i<counterKeys.length; i++){
            if(!_.isNumber(data[counterKeys[i]])){
                valid = false;
                break;
            }
        }
        return valid;
    }
}