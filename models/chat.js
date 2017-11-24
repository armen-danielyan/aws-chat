const DB = require('../bin/database');

let Chat = DB.Model.extend({
    tableName: 'smart-telemed.chats',
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