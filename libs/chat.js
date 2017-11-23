const socketio = require('socket.io'),
    faker = require('faker'),
    config = require('config'),
    moment = require('moment'),
    Redis = require('ioredis');

const sockets = http => {
    let io = socketio.listen(http);

    let redisAddress = config.get('redis').address,
        redis = new Redis(redisAddress),
        redisSubscribers = {},
        channelHistoryMax = 10;

    function addRedisSubscriber(subscriber_key) {
        let client = new Redis(redisAddress);

        client.subscribe(subscriber_key);
        client.on('message', (channel, message) => {
            io.emit(subscriber_key, JSON.parse(message));
        });

        redisSubscribers[subscriber_key] = client;
    }

    addRedisSubscriber('messages');
    addRedisSubscriber('member_add');
    addRedisSubscriber('member_delete');

    io.on('connection', socket => {
        let get_members = redis.hgetall('members').then(redis_members => {
            let members = {};
            for (let key in redis_members) {
                members[key] = JSON.parse(redis_members[key]);
            }
            return members;
        });

        let initialize_member = get_members.then(members => {
            if (members[socket.id]) {
                return members[socket.id];
            }

            let username = faker.fake("{{name.firstName}} {{name.lastName}}"),
                member = {
                    socket: socket.id,
                    username: username
                };

            return redis.hset('members', socket.id, JSON.stringify(member)).then(() => {
                return member;
            });
        });

        let get_messages = redis.zrange('messages', -1 * channelHistoryMax, -1).then(result => {
            return result.map(x => {
                return JSON.parse(x);
            });
        });

        Promise.all([get_members, initialize_member, get_messages]).then(values => {
            let members = values[0],
                member = values[1],
                messages = values[2];

            io.emit('member_history', members);
            io.emit('message_history', messages);

            redis.publish('member_add', JSON.stringify(member));

            socket.on('send', message_text => {
                let date = moment.now(),
                    message = JSON.stringify({
                        date: date,
                        username: member['username'],
                        avatar: member['avatar'],
                        message: message_text
                    });

                redis.zadd('messages', date, message);
                redis.publish('messages', message);
            });

            socket.on('disconnect', () => {
                redis.hdel('members', socket.id);
                redis.publish('member_delete', JSON.stringify(socket.id));
            });
        }).catch(reason => {
            console.log('ERROR: ' + reason);
        });
    });

    return io;

};

module.exports = {sockets: sockets};