const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(express.static(__dirname+"/public"));

var usernames = 1;
var cubes = {}

io.on('connection', socket => {

    socket.on("message",data=>{
        io.emit("message",data);
    });

    socket.username = usernames;
    socket.broadcast.emit("newCube",usernames);

    socket.emit("username",usernames);
    socket.emit("positions",cubes);
    usernames++;

    socket.on("position",data=>{
        cubes[socket.username] = {
            x:data.x,
            y:data.y,
            z:data.z,
            username:socket.username
        }
        console.log(cubes);
        var dataToEmit = {
            x:data.x,
            y:data.y,
            z:data.z,
            username:socket.username
        }
        socket.broadcast.emit("cubeMoved",dataToEmit);
    });

    socket.on('disconnect',() => {
        delete cubes[socket.username];
        socket.broadcast.emit("disconnected",socket.username);
    });
});

app.get("/",(req,res)=>{
    res.sendFile("index.html");
});

server.listen(process.env.PORT);