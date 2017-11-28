const socketio = require('socket.io'),
    config = require('config'),
    _ = require('lodash'),
    Redis = require('ioredis');

let redisAddress = config.get('redis').address,
    redisUserSocket = new Redis(redisAddress),
    redisUserStack = new Redis(redisAddress),
    redisMessages = new Redis(redisAddress);

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

            redisUserSocket.hgetall('userSocket')
                .then(data => {
                    userSocket = data;
                    userSocket[username] = socket.id;
                    redisUserSocket.hset('userSocket', username, socket.id);
                })
                .then(() => {
                    redisUserStack.hgetall('userStack')
                        .then(data => {
                            userStack = data;

                            for (let i in userSocket) {
                                for (let j in userStack) {
                                    if (j === i) {
                                        userStack[j] = "Online";
                                        redisUserStack.hset('userStack', j, "Online");
                                    }
                                }
                            }

                            ioChat.emit('onlineStack', userStack);
                        })
                });
        });

        socket.on('set-room', toUser => {
            socket.leave(socket.room);

            let username = socket.username,
                currentRoom = username + "-" + toUser,
                reverseRoom = toUser + "-" + username;

            getRoomData({
                name1: currentRoom,
                name2: reverseRoom
            })
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

                redisMessages.hset('messages', msgId, JSON.stringify({
                    msgFrom: socket.username,
                    msgTo: data.msgTo,
                    msg: data.msg,
                    room: socket.room,
                    date: data.date
                }));
            })
            .catch(error => {
                console.log(error);
            });
        });

        socket.on('disconnect', () => {
            let username = socket.username;

            console.log(`${username} logged out`);
            console.log("chat disconnected.");

            _.unset(userSocket, username);
            redisUserSocket.hdel('userSocket', username);

            userStack[username] = "Offline";
            redisUserStack.hset('userStack', username, "Offline");

            ioChat.emit('onlineStack', userStack);
        });
    });

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
            newRoom
                .query(qb => {
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

    return io;
};

module.exports = {
    sockets: sockets
};