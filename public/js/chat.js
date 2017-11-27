jQuery($ => {
    const socket = io('/chat');

    let hasNewMessage = false,
        lastMessageId;

    let username = $('#user-from').val(),
    toUser = $('#user-to').val();

    socket.on('connect', () => {
        socket.emit('set-user-data', username);
        createRoom();
    });

    socket.on('onlineStack', stack => {
        let text1 = "<strong>" + toUser + "</strong> ";
        $("#alert").show();
        if(stack[toUser] === 'Online') {
            $("#status").css("color", "green");
            $("#alert .user-message").html(text1 + "Joined!");
        } else {
            $("#status").css("color", "red");
            $("#alert .user-message").html(text1 + "Left!");
        }
        setTimeout(() => {
            $("#alert").fadeOut();
        }, 3000)
    });

    function createRoom() {
        $('#messages').empty();
        $('#typing').text("");

        $('#frndName').text(toUser);
        $('#initMsg').hide();
        $('#chatForm').show();
        $('#sendBtn').hide();

        socket.emit('set-room', toUser);
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
        hasNewMessage = true;
        let chatDate = moment(data.date).format("MM DD YYYY, hh:mm:ss a"),
            txt1 = $('<span></span>').text(data.msgFrom + " : "),
            txt2 = $('<span></span>').text(chatDate).attr("class", "datetime"),
            txt3 = $('<p></p>').append(txt1, txt2),
            txt4 = $('<p></p>').text(data.msg);

        $('#messages').append($('<li>').append(txt3, txt4).attr("id", "msg" + data.msgId));
        $('#typing').text("");
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
        lastMessageId = data.msgId;
        socket.emit("delivered", data.msgId);
    });

    socket.on("set-delivered", data => {
        $("#msg" + data).css("background-color", "#eee");
    });

    socket.on("set-seen", data => {
        let chatDate = moment(data.date).format("hh:mm:ss a");
        $("#msg-status").html("Seen " + chatDate);
    });

    $(window).focus(() => {
        if(hasNewMessage) {
            socket.emit("seen", lastMessageId);
            hasNewMessage = false;
        }
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