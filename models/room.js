const DB = require('../bin/database').DB;

let Room = DB.Model.extend({
    tableName: 'rooms',
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