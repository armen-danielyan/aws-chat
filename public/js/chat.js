var socket = io();
var message = '',
    messages = [],
    members = {};

var inputMessage = $('#message');

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
}

function setMembers(mms) {
    var membersWrap = $('</ul>', {
        id: 'members',
        class: 'list-group members-group'
    });

    $.each(mms, function(key, member) {
        var memberItem = $('</li>', {
            class: 'list-group-item member-item justify-content-between bg-faded'
        }).appendTo(membersWrap);

        $('</small>', {
            text: member.username
        }).appendTo(memberItem);
    });

    $("#members-wrap").html(mmsItem);
}