const config = require('config');

const knex = require('knex')({
    client: 'pg',
    connection: config.get('pg')
});

const DB = require('bookshelf')(knex);

module.exports = DB;