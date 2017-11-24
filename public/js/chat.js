jQuery($ => {
    const socket = io('/chat');

    let username = $('#user-from').val(),
    toUser = $('#user-to').val();

    socket.on('connect', () => {
        socket.emit('set-user-data', username);
        createRoom();
    });

    socket.on('onlineStack', stack => {
        console.log(stack);
    });

    function createRoom() {
        $('#messages').empty();
        $('#typing').text("");

        $('#frndName').text(toUser);
        $('#initMsg').hide();
        $('#chatForm').show();
        $('#sendBtn').hide();

        let currentRoom = username + "-" + toUser,
            reverseRoom = toUser + "-" + username;

        socket.emit('set-room', {name1: currentRoom, name2: reverseRoom});
    }

    $('#myMsg').keyup(() => {
        if ($('#myMsg').val()) {
            $('#sendBtn').show();
            socket.emit('typing');
        } else {
            $('#sendBtn').hide();
        }
    });

    socket.on('typing', msg => {
        let setTime;
        clearTimeout(setTime);
        $('#typing').text(msg);
        setTime = setTimeout(() => {
            $('#typing').text("");
        }, 4000);
    });

    $('form').submit(() => {
        socket.emit('chat-msg', {msg: $('#myMsg').val(), msgTo: toUser, date: Date.now()});
        $('#myMsg').val("");
        $('#sendBtn').hide();
        return false;
    });

    socket.on('chat-msg', data => {
        let chatDate = moment(data.date).format("MM DD YYYY, hh:mm:ss a"),
            txt1 = $('<span></span>').text(data.msgFrom + " : ").css({"color": "#006080"}),
            txt2 = $('<span></span>').text(chatDate).css({"float": "right", "color": "#a6a6a6", "font-size": "12px"}),
            txt3 = $('<p></p>').append(txt1, txt2),
            txt4 = $('<p></p>').text(data.msg).css({"color": "#000000"});

        $('#messages').append($('<li>').append(txt3, txt4));
        $('#typing').text("");
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
    });

    socket.on('disconnect', () => {
        $('#messages').empty();
        $('#typing').text("");
        $('#frndName').text("Disconnected..");
        $('#loading').hide();
        $('#initMsg').show().text("...Please, Refresh Your Page...");
        $('#chatForm').hide();
    });
});