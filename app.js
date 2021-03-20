const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(express.static(__dirname+"/public"));

var usernames = 1;
var cubes = {}

io.on('connection', socket => {

    socket.on("message",data=>{
        io.emit("message",{message:data.message,username:socket.username});
    });

    socket.on("repositionCubes",data=>{
        socket.emit("repositionCubes",cubes);
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
            w:data.w,
            a:data.a,
            s:data.s,
            d:data.d,
            username:socket.username
        }
    });

    socket.on("handle key events",data=>{
        socket.broadcast.emit("handle key events",{username:socket.username,key:data.key,pressed:data.pressed});
        cubes[socket.username][data.key] = data.pressed;
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