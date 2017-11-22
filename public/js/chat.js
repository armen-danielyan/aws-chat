var socket = io();
var message = '',
    messages = [],
    members = {};

var inputMessage = $('#message');
var msgsWrap = $('#messages-wrap');

inputMessage.on('keypress', function(e) {
    if(e.which === 13){
        send();
    }
});

$('#send').on('click', function() {
    send();
});

socket.on('messages', function(msgs) {
    messages.push(msgs);
    setMessages(messages);
});

socket.on('message_history', function(msgs) {
    messages = msgs;
    setMessages(messages);
});

socket.on('member_add', function(member) {
    members[member.socket] = member;
    setMembers(members);
});

socket.on('member_delete', function(socket_id) {
    delete members[socket_id];
    setMembers(members);
});

socket.on('member_history', function(mms) {
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
    var msgItem = '';
    $.each(msgs, function(key, message) {
        msgItem += '<li class="list-group-item message-item d-flex">';
        msgItem += message.message;
        msgItem += '<hr>';
        msgItem += '<small class="text-muted">' + message.username + ' @ ' + formatMessageDate(message.date) + '</small>';
        msgItem += '</li>';
    });

    $("#messages").html(msgItem);

    msgsWrap.scrollTop(msgsWrap.scrollHeight);
}

function setMembers(mms) {

    var mmsItem = '';
    $.each(mms, function(key, member) {
        mmsItem += '<li class="list-group-item member-item justify-content-between bg-faded">';
        mmsItem += '<small>' + member.username + '</small>';
        mmsItem += '</li>';
    });

    $("#members").html(mmsItem);
}