let socket = io();

let message = '',
    messages = [],
    members = {};

let inputMessage = $('#message');

inputMessage.on('keypress', e => {
    if(e.which === 13){
        send();
    }
});

$('#send').on('click', () => {
    send();
});

socket.on('messages', msgs => {
    messages.push(msgs);
    setMessages(messages);
});

socket.on('message_history', msgs => {
    messages = msgs;
    setMessages(messages);
});

socket.on('member_add', member => {
    members[member.socket] = member;
    setMembers(members);
});

socket.on('member_delete', socket_id => {
    delete members[socket_id];
    setMembers(members);
});

socket.on('member_history', mms => {
    members = mms;
    setMembers(members);
});

function send() {
    message = inputMessage.val();
    socket.emit('send', message);
    message = '';
    inputMessage.val('');
}

function formatMessageDate(date) {
    return moment(date).format("h:mm:ss a");
}

function setMessages(msgs) {
    let msgItem = '';
    $.each(msgs, (key, message) => {
        msgItem += '<li class="list-group-item message-item d-flex">';
        msgItem += message.message;
        msgItem += '<hr>';
        msgItem += '<small class="text-muted">' + message.username + ' @ ' + formatMessageDate(message.date) + '</small>';
        msgItem += '</li>';
    });

    $("#messages").html(msgItem);
}

function setMembers(mms) {
    let mmsItem = '';
    $.each(mms, (key, member) => {
        mmsItem += '<li class="list-group-item member-item justify-content-between bg-faded">';
        mmsItem += '<small>' + member.username + '</small>';
        mmsItem += '</li>';
    });

    $("#members").html(mmsItem);
}