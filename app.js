const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(express.static(__dirname+"/public"));

var usernames = 1;
var cubes = {}

io.on('connection', socket => {

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
        var dataToEmit = {
            x:data.x,
            y:data.y,
            z:data.z,
            username:socket.username
        }
        socket.broadcast.emit("cubeMoved",dataToEmit);
    });

    socket.on('disconnect',() => {
        cubes[socket.username] = null;
        socket.broadcast.emit("disconnected",socket.username);
    });
});

app.get("/",(req,res)=>{
    res.sendFile("index.html");
});

server.listen(3000,()=>{console.log("server started on port 3000");});