const app = require('../app'),
    chat = require('../libs/chat.js'),
    http = require('http').Server(app);

let port = process.env.PORT || 3000;
app.set('port', port);
chat.sockets(http);
http.listen(port);

http.on('error', error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

http.on('listening', () => {
    let addr = http.address(),
        bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
});
