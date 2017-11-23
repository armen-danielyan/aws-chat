const socketio = require('socket.io'),
    faker = require('faker'),
    config = require('config'),
    moment = require('moment'),
    Redis = require('ioredis');

let doctors = require('../mocks/doctors');

const sockets = http => {
    let io = socketio.listen(http);

    let redisAddress = config.get('redis').address,
        redis = new Redis(redisAddress),
        redisSubscribers = {};

    function addRedisSubscriber(subscriber_key) {
        let client = new Redis(redisAddress);

        client.subscribe(subscriber_key);
        client.on('message', (channel, message) => {
            io.emit(subscriber_key, JSON.parse(message));
        });

        redisSubscribers[subscriber_key] = client;
    }

    addRedisSubscriber('member_add');
    addRedisSubscriber('member_delete');

    io.on('connection', socket => {
        let get_members = redis.hgetall('members')
            .then(redis_members => {
                let members = {};
                for (let key in redis_members) {
                    members[key] = JSON.parse(redis_members[key]);
                }
                return members;
            });

        let initialize_member = get_members
            .then(members => {
                if (members[socket.id]) {
                    return members[socket.id];
                }

                let member = {
                        socket: socket.id,
                        username: faker.fake("{{name.firstName}} {{name.lastName}}")
                    };

                return redis.hset('members', socket.id, JSON.stringify(member))
                    .then(() => {
                        return member;
                    });
            });

        initialize_member
            .then(member => {
                redis.publish('member_add', JSON.stringify(member));

                socket.on('send', message_text => {
                    let date = moment.now(),
                        message = {
                            date: date,
                            username: member['username'],
                            message: message_text
                        };

                    io.emit('messages', message);
                });

                socket.on('disconnect', () => {
                    redis.hdel('members', socket.id);
                    redis.publish('member_delete', JSON.stringify(socket.id));
                });
            })
            .catch(reason => {
                console.log('ERROR: ' + reason);
            });
    });

    return io;
};

module.exports = {sockets: sockets};