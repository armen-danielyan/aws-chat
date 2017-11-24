const DB = require('../bin/database');

let Room = DB.Model.extend({
    tableName: 'smart-telemed.rooms',
    hasTimestamps: true,
    idAttribute: 'id'
});

let Rooms = DB.Collection.extend({
    model: Room
});

module.exports = {
    Room: Room,
    Rooms: Rooms
};