jQuery(function($){
    var socket = io('/chat');

    var username = $('#user-from').val();
    var noChat = 0;
    var msgCount = 0;
    var oldInitDone = 0;
    var roomId;
    var toUser = $('#user-to').val();

    socket.on('connect',function(){
        socket.emit('set-user-data', username);
        createRoom();
    });



    //receiving onlineStack.
    socket.on('onlineStack',function(stack){
        $('#list').empty();
        var totalOnline = 0;
        for (var user in stack){
            if(user == username){
                var txt1 = $('<button class="boxF disabled"> </button>').text(user).css({"font-size":"18px"});
            } else {
                var txt1 = $('<button id="ubtn" class="btn btn-success  btn-md">').text(user).css({"font-size":"18px"});
            }
            if(stack[user] == "Online"){
                var txt2 = $('<span class="badge"></span>').text("*"+stack[user]).css({"float":"right","color":"#009933","font-size":"18px"});
                totalOnline++;

            } else {
                var txt2 = $('<span class="badge"></span>').text(stack[user]).css({"float":"right","color":"#a6a6a6","font-size":"18px"});
            }
            $('#list').append($('<li>').append(txt1,txt2));
            $('#totalOnline').text(totalOnline);
        }//end of for.
        $('#scrl1').scrollTop($('#scrl1').prop("scrollHeight"));


    }); //end of receiving onlineStack event.


    function createRoom() {
        $('#messages').empty();
        $('#typing').text("");
        msgCount = 0;
        noChat = 0;
        oldInitDone = 0;

        $('#frndName').text(toUser);
        $('#initMsg').hide();
        $('#chatForm').show();
        $('#sendBtn').hide();

        var currentRoom = username+"-"+toUser;
        var reverseRoom = toUser+"-"+username;

        socket.emit('set-room', {name1:currentRoom, name2:reverseRoom});
    }

    //event for setting roomId.
    socket.on('set-room',function(room){
        //empty messages.
        $('#messages').empty();
        $('#typing').text("");
        msgCount = 0;
        noChat = 0;
        oldInitDone = 0;
        //assigning room id to roomId variable. which helps in one-to-one and group chat.
        roomId = room;
        console.log("roomId : "+roomId);

    }); //end of set-room event.



    // keyup handler.
    $('#myMsg').keyup(function(){
        if($('#myMsg').val()){
            $('#sendBtn').show(); //showing send button.
            socket.emit('typing');
        }
        else{
            $('#sendBtn').hide(); //hiding send button to prevent sending empty messages.
        }
    }); //end of keyup handler.

    //receiving typing message.
    socket.on('typing',function(msg){
        var setTime;
        //clearing previous setTimeout function.
        clearTimeout(setTime);
        //showing typing message.
        $('#typing').text(msg);
        //showing typing message only for few seconds.
        setTime = setTimeout(function(){
            $('#typing').text("");
        },3500);
    }); //end of typing event.

    //sending message.
    $('form').submit(function(){
        socket.emit('chat-msg',{msg:$('#myMsg').val(),msgTo:toUser,date:Date.now()});
        $('#myMsg').val("");
        $('#sendBtn').hide();
        return false;
    }); //end of sending message.

    //receiving messages.
    socket.on('chat-msg',function(data){
        //styling of chat message.
        var chatDate = moment(data.date).format("MMMM Do YYYY, hh:mm:ss a");
        var txt1 = $('<span></span>').text(data.msgFrom+" : ").css({"color":"#006080"});
        var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
        var txt3 = $('<p></p>').append(txt1,txt2);
        var txt4 = $('<p></p>').text(data.msg).css({"color":"#000000"});
        //showing chat in chat box.
        $('#messages').append($('<li>').append(txt3,txt4));
        msgCount++;
        console.log(msgCount);
        $('#typing').text("");
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
    }); //end of receiving messages.

    //on disconnect event.
    //passing data on connection.
    socket.on('disconnect',function(){


        //showing and hiding relevant information.
        $('#list').empty();
        $('#messages').empty();
        $('#typing').text("");
        $('#frndName').text("Disconnected..");
        $('#loading').hide();
        $('#noChat').hide();
        $('#initMsg').show().text("...Please, Refresh Your Page...");
        $('#chatForm').hide();
        msgCount = 0;
        noChat = 0;
    });//end of connect event.



});//end of function.