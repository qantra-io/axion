const utils = require('../libs/utils');
const { performance } = require('perf_hooks');

const keyCheck = (key) => {
    if (!key) throw Error('Cache Key is missing');
}




module.exports = ({ prefix, url}) => {

    if (!prefix || !url) throw Error('missing in memory arguments');
    
    /** creating inmemory client */
    const redisClient = require('./redis-client').createClient({
        prefix, url
    });


    return {
        search: {
            /**
             * 
             * @param {string} index reperesent the index name ex: 'object:index' 
             */
            createIndex: async ({index, prefix, schema })=>{
                if(!schema || !prefix || !index){
                    throw Error('missing args')
                }
                /** check if index already exists */
                let indices = await redisClient.call('FT._LIST');
                console.log('indices', indices);

                /** drop index if exists */
                if (indices.includes(index)) {
                    await redisClient.call('FT.DROPINDEX', index);
                    /** index already exists */
                }

                let schemaArgs = [];
                let schemaKeys = Object.keys(schema);
                for(let i=0; i<schemaKeys.length; i++){
                    let skey = schemaKeys[i];
                    schemaArgs.push(skey);
                    let fieldType = schema[skey].store;
                    schemaArgs.push(fieldType);
                    if(schema[skey].sortable){
                        schemaArgs.push('SORTABLE');
                    }
                }

                const args = ['FT.CREATE', index, 'ON', 'hash', 'PREFIX', '1', prefix, 'SCHEMA', ...schemaArgs];
                await redisClient.call(...args)
            },

            find: async({query, searchIndex, populate, offset, limit})=>{
                const startTime = performance.now()
                let res = [];
                offset = offset || 0;
                limit = limit || 50;
                try {
                    let args = ['FT.SEARCH', searchIndex, query, 'LIMIT', offset, limit];
                    if(populate){
                        args = args.concat(['RETURN', populate.length], populate);
                    }
                    console.log(`search -->`, args.join(' '));
                    res = await redisClient.call(...args);
                } catch(error){
                    console.log(error);
                    return {error: error.message || 'unable to execute'};
                }
                let [count, ...foundKeysAndSightings] = res;
                let foundSightings = foundKeysAndSightings.filter((entry, index) => index % 2 !== 0)
                let sightings = foundSightings.map(sightingArray => {
                  let keys = sightingArray.filter((_, index) => index % 2 === 0)
                  let values = sightingArray.filter((_, index) => index % 2 !== 0)
                  return keys.reduce((sighting, key, index) => {
                    sighting[key] = values[index]
                    return sighting
                  }, {})
                })
                const endTime = performance.now();
                return { count, docs: sightings, time:  `${Math.trunc(endTime - startTime)}ms`};
            }

            
        },
        hyperlog: {
            add: async({key, items})=>{
                let args = [key].concat(items);
                try {
                    await redisClient.call('PFADD', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            count: async({key})=>{
                let count = 0;
                try {
                    count = await redisClient.call('PFCOUNT', key);
                } catch(err){
                    console.log(err);
                }
                return count;
            },
            merge: async({keys})=>{
                let count = 0; 
                try {
                    count = await redisClient.call('PFMERGE', ...keys);
                } catch(err){
                    console.log(err);
                }
                return count;
            }
        },
        hash: {
            set: async({key, data})=>{
                let keys = Object.keys(data);
                let args = [key];
                for(let i=0; i<keys.length; i++){
                    args.push(keys[i]);
                    args.push(data[keys[i]]);
                }
                let result = await redisClient.hset(...args);
                return result;
            },
            remove: async({key, fields})=>{
                let args = [key];
                args = args.concat(fields);
                let result = await redisClient.hdel(...args);
                return result;
            },
            incrby: async ({ key, field, incr }) => {
                let result = await redisClient.hincrby(key, field, incr || 1);
                return result;
            },
            get: async ({ key }) => {
                let result = await redisClient.hgetall(key);
                return result;
            },
            setField: async ({ key, fieldKey, data }) => {
                let result = await redisClient.hset(key, fieldKey, data);
                return result;
            },
    
            getField: async ({ key, fieldKey }) => {
                let result = await redisClient.hget(key, fieldKey);
                return result;
            },
            
            
            getFields: async ({ key, fields }) => {
                let result = await redisClient.hmget(key, ...fields);
                /** resuts are retruned as an array of values with the same order of the fields */
                if(result){
                    let obj = {};
                    for(let i=0; i<fields.length; i++){
                        obj[fields[i]]=result[i];
                    }
                    return obj;
                } 
                return result;
            },
        },
        key: {
            expire: async ({ key, expire }) => {
                let result = await redisClient.expire(key, expire);
                return result;
            },
    
            exists: async ({ key }) => {
                let result = await redisClient.exists(key);
                return (result === 1);
            },
    
            delete: async ({ key }) => {
                keyCheck(key);
                let result = false;
                try {
                    await redisClient.del(key);
                    result = true;
                    return result;
                } catch (err) {
                    console.log(`failed to get result for key ${key}`);
                }
                return result;
            },

            set: async ({ key, data, ttl }) => {
                keyCheck(key);
                let result = false;
                let args = [key, data];
                if (ttl) args = args.concat(["EX", ttl]);
                try {
                    await redisClient.set(...args);
                    result = true;
                } catch (err) {
                    console.log('failed to save to reddit')
                }
                return result;
            },
    
            get: async ({ key }) => {
                keyCheck(key);
                let result = '';
                try {
                    result = await redisClient.get(key);
                } catch (err) {
                    console.log(`failed to get result for key ${key}`);
                }
                /** redis returned string 'null' when the key is not found */
                return result;
            },
    
        },
        set: {
            add: async ({ key, arr }) => {
                keyCheck(key);
                let result = await redisClient.sadd(key, ...arr);
                return result;
            },
            remove: async ({ key, arr }) => {
                keyCheck(key);
                let result = await redisClient.srem(key, ...arr);
                return result;
            },
            /** get whole set */
            get: async ({ key }) => {
                let result = await redisClient.smembers(key);
                return result;
            },
        },
        sorted: {
            get: async ({ sort, key, withScores=false, start, end, limit}) => {
                keyCheck(key);
                let res = null;
                if(!start)start=0;
                if(!end)end=50;
                let min = start;
                let max = end;
                let args = ["ZRANGE"];
                args = args.concat([key, min, max]);
                if(!sort)sort='H2L';
                if(sort.toUpperCase()=="H2L"){
                    args.push("REV");
                } 
                if(withScores)args.push("WITHSCORES");
                try {
                    res = await redisClient.call(...args);
                } catch(err){
                    return {error: err.message?err.message:err};
                }
                if(withScores)res = utils.arrayToObj(res);
                return  res|| [];
            },
            update: async({key, scores})=>{
                let args = [key].concat(scores);
                try {
                    await redisClient.call('ZADD', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            addIfNotExists: async({key, scores})=>{
                let args = [key, 'NX'].concat(scores);
                try {
                    await redisClient.call('ZADD', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            set: async ({key, scores})=>{
                let args = [key].concat(scores);
                try {
                    await redisClient.call('ZADD', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            incrBy: async({key, field, score})=>{
                let args = [key, score, field];
                try {
                    await redisClient.call('ZINCRBY', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            remove: async({key, field})=>{
                let args = [key, field];
                try {
                    await redisClient.call('ZREM', ...args);
                } catch(err){
                    console.log(err);
                }
            },
            getRandom: async({key, count})=>{
                let args = [key, count];
                try {
                    await redisClient.call('ZRANDMEMBER', ...args);
                } catch(err){
                    console.log(err);
                }
            },


        }
    }

    // return {
    //     getTimeSeries: async({
    //         key
    //     })=>{
 
    //         keyCheck(key);
    //         let result = [];
    //         key = prefix+":"+key;
    //         try{
    //             result = await redisClient.call('TS.GET', key);
    //         } catch(err){
    //             console.log(`!${key} not found. restart the cluster.`);
    //         }
    //         return result;
    //     },
    //     // addToTimeSeries: async({

    //     // }),
    //     appendTimeSeries: async({
    //         ktv // array of arrays key value timestamp array
    //     })=>{
    //         //an array of key value and timestamp
    //         let args = [];
    //         ktv.forEach(i=>{
    //             i[0]=prefix+":"+i[0];
    //             args = args.concat(i);
    //         });
    //         await redisClient.call('TS.MADD', ...args);
    //     },
    //     createTimeSeries: async({
    //         key,
    //         retention,
    //         labels, //key value 
    //     })=>{
    //         try {
    //             let labelsArr = [];
    //             Object.keys(labels).forEach(i=>labelsArr.push(i, labels[i]));
    //             await redisClient.call('TS.CREATE', prefix+":"+key,  'RETENTION', retention, ...labelsArr);
    //         } catch(err){
    //             console.log('timeseries key already exists');
    //         }
    //     },

       
    //     getMulti: async ({ keys }) => {
    //         if (!keys || keys.length == 0) return;
    //         let results = await redisClient.mget(keys);
    //         return results || [];
    //     },

    //     incrby: async ({ key, n }) => {
    //         let result = await redisClient.incrby(key, n || 1);
    //         return result;
    //     },

    //     setCounter: async ({ key, counter, expire }) => {
    //         let args = [key, counter];
    //         if (expire) args = args.concat(['EX', expire]);
    //         let result = await redisClient.set(...args);
    //         return result;
    //     },
        



    //     pushOne: async ({ key, data }) => {
    //         keyCheck(key);
    //         let r = await redisClient.lpush(key, data);
    //         return r;
    //     },

    //     limitList: async ({ key, limit }) => {
    //         keyCheck(key);
    //         let r = await redisClient.ltrim(key, 0, limit);
    //         return r;
    //     },

    //     getList: async ({ key, from, to }) => {
    //         keyCheck(key);
    //         let r = await redisClient.lrange(key, from, to);
    //         return r;
    //     },

    //     getFullSorted: async ({ key }) => {
    //         keyCheck(key);
    //         let r = null;
    //         try {
    //             r = await redisClient.zrange(key, '0', '-1');
    //         } catch(err){
    //             console.log(err);
    //         }
            
    //         return r;
    //     },

    //     addToSet: async ({ key, data }) => {
    //         keyCheck(key);
    //         let result = await redisClient.sadd(key, data);
    //         return result;
    //     },

    //     getSetLength: async ({ key }) => {
    //         let result = await redisClient.scard(key);
    //         return result;
    //     },

    //     getSet: async ({ key }) => {
    //         let result = await redisClient.smembers(key);
    //         return result;
    //     },
    //     setHas: async({key, data})=>{
    //         let result = await redisClient.sismember(key, data);
    //         return result
    //     },

    //     removeSortedMember: async({key, member})=>{
    //         console.log(`_removeSortedMember-redis------- key: ${key} member: ${member}`)
    //         keyCheck(key);
    //         let args = [key, member];
    //         try {
    //             await redisClient.zrem(...args);
    //         } catch (err) {
    //             console.log(err);
    //             console.log(`failed to removeSortedMember for key ${key}`);
    //         }
    //     },

    //     incrSortedMember: async({key, member, score})=>{
    //         keyCheck(key);
    //         let args = [key, score, member];
    //         try {
    //             await redisClient.zincrby(...args);
    //         } catch (err) {
    //             console.log(err);
    //             console.log(`failed to incrSortedMember for key ${key}`);
    //         }
    //     },

    //     getSortedMemberScore: async({key, member})=>{
    //         keyCheck(key);
    //         let args = [key, member];
    //         let score = false;
    //         try {
    //             score = await redisClient.zscore(...args);
    //         } catch (err) {
    //             console.log(err);
    //             console.log(`failed to incrSortedMember for key ${key}`);
    //         }
    //         return score;
    //     },

    //     getLowestScore: async({key})=>{
    //         keyCheck(key);
    //         let args = [key, '-inf', '+inf', 'withScoresS', 'LIMIT', '0', '1'];
    //         let result = null
    //         try {
    //             let out = await redisClient.zrangebyscore(...args);
    //             if(out){
    //                 result = {member: out[0], score: parseInt(out[1])};
    //             }
    //         } catch (err) {
    //             console.log(err);
    //             console.log(`failed to getLowestScore for key ${key}`);
    //         }
            
    //         return result;
    //         // ZRANGEBYSCORE myset -inf +inf withScoresS LIMIT 0 1
    //     },

    //     addToSortedList: async ({ key, list }) => {
    //         keyCheck(key);
    //         let args = [key];
    //         list.forEach(i => {
    //             args.push(i.score);
    //             args.push(i.member);
    //         });
    //         try {
    //             await redisClient.zadd(...args);
    //         } catch (err) {
    //             console.log(err);
    //             console.log(`failed to list for key ${key}`);
    //         }
    //     },

    //     addStream: async({key, json})=>{
    //         keyCheck(key);
    //         key = prefix+":"+key;
    //         let flatten = utils.flattenObject(json);
    //         if(flatten.length==0)return;
    //         let args = [key, '*'].concat(flatten);
    //         try {
    //             await redisClient.call('XADD', ...args);
    //         } catch(err){
    //             console.log(err);
    //         }
    //     },

    //     readStreamLast: async({key, count})=>{
    //         keyCheck(key);
    //         key=prefix+":"+key;
    //         let args = [key, '+', '-', 'COUNT', count||1]
    //         let result = null;
    //         try {
    //             result = await redisClient.call('XREVRANGE', ...args);
    //         } catch(err){
    //             console.log(err);
    //         }
    //         return result;
    //     },


    // }
}
