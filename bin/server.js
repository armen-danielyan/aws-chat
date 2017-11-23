const express = require('express'),
    chat = require('../libs/chat.js');

let app = express();
const http = require('http').Server(app);
chat.sockets(http);
    
let port = process.env.PORT || 3000;

app.use(express.static('public'));

http.listen(port, () => {
    console.log('Started server on port ' + port);
});
