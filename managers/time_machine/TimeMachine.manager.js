module.exports = class TimeMachine { 
    constructor({ cortex, config, managers, oyster, aeon }) {
        this.cortex             = cortex;
        this.oyster             = oyster;
        this.aeon               = aeon;
        this.cortexExposed      = ['removeInitialScoreByTime','dailyDecreasePostScore', 'mixTopics'];
    }

    removeInitialScoreByTime({ createdPost, darbId, iterations, interval, decrease }) {
        this.oyster.call('update_relations', {
            _id: `topic:${darbId}|${createdPost.topic}`,
            incrBy: {
                _members: [`${createdPost._id}~-${decrease}:!`]
            }
        });
        console.log(iterations);
        iterations -= 1;
        if (iterations > 0){
            this.aeon.call( {
                cortex: { 
                    method: 'emitToOneOf', 
                    args: { 
                        type: 'darbwali-axion', 
                        call: 'timeMachine.removeInitialScoreByTime',
                        data: {
                            createdPost,
                            darbId,
                            iterations,
                            interval,
                            decrease
                        }
                    }
                },
                at: Date.now() + interval,
                onError: { method: 'emitToOneOf', args: { type: 'darbwali-axion', call: 'onError', data: '' } }
            })
        }
    }
    
    async dailyDecreasePostScore({darbId, createdPost, interval, iterations}) {
        const topicId = `topic:${darbId}|${createdPost.topic}`;
        const currentScore = await this.oyster.call('relation_score', {
            relation: '_members',
            _id: topicId,
            items:[createdPost._id]
        });
        const dailyDecrease = Math.floor(parseInt(currentScore[createdPost._id]) * 0.05);
        this.oyster.call('update_relations', {
            _id: `topic:${darbId}|${createdPost.topic}`,
            incrBy: {
                _members: [`${createdPost._id}~-${dailyDecrease}:!`]
            }
        });
        iterations -= 1;
        if (iterations > 0){
            this.aeon.call({
                cortex: {
                    method: 'emitToOneOf',
                    args: {
                        type: 'darbwali-axion',
                        call: 'timeMachine.dailyDecreasePostScore',
                        data: {
                            createdPost,
                            darbId,
                            iterations,
                            interval
                        }
                    }
                },
                at: Date.now() + interval,
                onError: { method: 'emitToOneOf', args: { type: 'darbwali-axion', call: 'onError', data: '' } }
            })
        }
    }

    async mixTopics({darbId}) {
        const mixTopic = `topic:${darbId.split(':')[1]}|mix`
        const topics = await this.oyster.call('nav_relation', {
            relation: '_members',
            label: 'topic',
            _id: 'darb:m1cSJ2Xei',
            sort: 'h2l',
            withScores: true,
        });

        for(const topic of Object.keys(topics)) {
            const posts = await this.oyster.call('nav_relation', {
                relation: '_members',
                label: 'post',
                _id: topic,
                sort: 'h2l',
                withScores: true,
            });
            const postKeys = Object.keys(posts);
            if(postKeys.length != 0 ) {
                const trimmedPosts = postKeys.splice(0, Math.ceil(postKeys.length * 0.15));
                this.oyster.call('update_relations', { _id: mixTopic, add: { _members: trimmedPosts }});
            }
        }
    }

    async interceptor({ data, cb, meta, fnName }) {
        if (this.cortexExposed.includes(fnName)) {
            let result = await this[`${fnName}`](data);
            cb(result);
        } else {
            cb({ error: `${fnName} is not executable` })
        }
    }
}