const socketio = require('socket.io'),
    faker = require('faker'),
    config = require('config'),
    moment = require('moment'),
    _ = require('lodash'),
    Redis = require('ioredis');

let modelChat = require('../models/chat'),
    modelRoom = require('../models/room');

const sockets = http => {
    let io = socketio.listen(http);
    let ioChat = io.of('/chat');

    let userStack = {},
        userSocket = {};

    ioChat.on('connection', socket => {
        socket.on('set-user-data', username => {
            console.log(`${username} logged In`);

            socket.username = username;
            userSocket[username] = socket.id;

            sendUserStack();
        });

        socket.on('set-room', toUser => {
            socket.leave(socket.room);

            let username = socket.username,
                currentRoom = username + "-" + toUser,
                reverseRoom = toUser + "-" + username;

            getRoomData({name1: currentRoom, name2: reverseRoom})
                .then(roomId => {
                    socket.room = roomId;
                    socket.join(socket.room);
                    return ioChat.to(userSocket[username]).emit('set-room', socket.room);

                })
                .catch(error => {
                    console.log(error);
                });
        });

        socket.on('typing', () => {
            socket.to(socket.room).broadcast.emit('typing', 'is typing ...');
        });

        socket.on('delivered', data => {
            socket.to(socket.room).broadcast.emit('set-delivered', data);
        });

        socket.on('seen', data => {
            socket.to(socket.room).broadcast.emit('set-seen', data);
        });

        socket.on('chat-msg', data => {
            saveChat({
                msgFrom: socket.username,
                msgTo: data.msgTo,
                msg: data.msg,
                room: socket.room,
                date: data.date
            })
                .then(msgId => {
                    ioChat.to(socket.room).emit('chat-msg', {
                        msgFrom: socket.username,
                        msg: data.msg,
                        msgId: msgId,
                        date: data.date
                    });
                })
                .catch(error => {
                    console.log(error);
                });
        });

        socket.on('disconnect', () => {
            console.log(`${socket.username} logged out`);
            socket.broadcast.emit('broadcast', {description: `${socket.username} Logged out`});
            console.log("chat disconnected.");

            _.unset(userSocket, socket.username);
            userStack[socket.username] = "Offline";

            ioChat.emit('onlineStack', userStack);
        });
    });

    let sendUserStack = () => {
        for (let i in userSocket) {
            for (let j in userStack) {
                if (j === i) {
                    userStack[j] = "Online";
                }
            }
        }

        ioChat.emit('onlineStack', userStack);
    };

    let saveChat = data => {
        return new Promise((resolve, reject) => {
            new modelChat()
                .save({
                    msg_from: data.msgFrom,
                    msg_to: data.msgTo,
                    msg: data.msg,
                    room: data.room
                })
                .then(model => {
                    let jmodel = model.toJSON();
                    resolve(jmodel.id);
                })
                .catch(error => {
                    reject(error);
                });
        });

    };

    let getRoomData = room => {
        return new Promise((resolve, reject) => {
            let newRoom = new modelRoom();
            newRoom.query(qb => {
                qb.where('name1', '=', room.name1)
                    .orWhere('name1', '=', room.name2)
                    .orWhere('name2', '=', room.name1)
                    .orWhere('name2', '=', room.name2);
            })
                .fetch()
                .then(model => {
                    if (!model) {
                        newRoom
                            .save({
                                name1: room.name1,
                                name2: room.name2
                            })
                            .then(model => {
                                let jmodel = model.toJSON();
                                resolve(jmodel.id);
                            })
                    } else {
                        let jmodel = model.toJSON();
                        resolve(jmodel.id);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });

    };


    /*let redisAddress = config.get('redis').address,
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
    });*/

    return io;
};

module.exports = {sockets: sockets};