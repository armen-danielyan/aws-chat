const DB = require('../bin/database').DB;

let Chat = DB.Model.extend({
    tableName: 'chats',
    hasTimestamps: true,
    idAttribute: 'id'
});

let Chats = DB.Collection.extend({
    model: Chat
});

module.exports = {
    Chat: Chat,
    Chats: Chats
};