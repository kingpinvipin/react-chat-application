const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users') ;

const PORT = process.env.PORT || 5000 ;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


io.on('connection', (socket) => {
    socket.on('join', ({ name, room}, callback) => {
        const { error, user } = addUser({id : socket.id, name, room});

        if(error) return callback(error) ;

        var text1 = user.name + ',Welcome to the room ' + user.room ;
        var text2 = user.name + ' has joined';

        socket.emit('message', {user : 'admin', text : text1});
        socket.broadcast.to(user.room).emit('message', {user : 'admin', text : text2});

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room : user.room, users : getUsersInRoom(user.room)});

        callback();
    }); 

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        console.log(user.name, user.room, socket.id);
        io.to(user.room).emit('message' , { user : user.name, text : message });
        io.to(user.room).emit('roomData', { room : user.room, users : getUsersInRoom(user.room)});

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        let text0 = user.name + ' has left';
        if(user) {
            io.to(user.room).emit('message', {user : 'admin', text : text0});
        }
    });
});

app.use(router);
app.use(cors());

server.listen(PORT, () => console.log('Server is running...'));