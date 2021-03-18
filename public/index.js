import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
// (function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()
const socket = io();

var username;

var cubes = {};

socket.on("newCube", username => {
    cubes[username] = new Cube(0,5,0);
});

socket.on("positions",data=>{
    console.log(data);
    Object.keys(data).forEach(function(key){
        cubes[data[key].username] = new Cube(data[key].x,data[key].y,data[key].z);
    });
});

socket.on("cubeMoved",data=>{
    cubes[data.username].setPosition(data.x,data.y,data.z);
});

socket.on("username",data=>{
    username = data;
});

var scene,renderer,camera,controls;
var keyboard = {};
var speed = 0.3;
var cubeMaterial = new THREE.MeshBasicMaterial({wireframe:true});
var cubeGeometry = new THREE.BoxGeometry(10,10,10,3,3,3);


function init(){
    var WIDTH = window.innerWidth,HEIGHT = window.innerHeight;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH,HEIGHT);
    renderer.setClearColor(0x333F47,1);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45,WIDTH/HEIGHT,1,10000);
    camera.position.set(0,20,100);
    camera.lookAt(0,0,0);
    scene.add(camera);

    var material = new THREE.MeshBasicMaterial({wireframe:true,color:"black"});

    var floorGeometry = new THREE.PlaneGeometry(200,200,20,20);
    var floor = new THREE.Mesh(floorGeometry,material);
    floor.rotation.x = Math.PI/2;
    scene.add(floor);

    controls = new OrbitControls(camera,renderer.domElement);
    controls.minDistance = 50;
    controls.maxDistance = 275;
    animate();
}

function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene,camera);
}

init();

class Cube{
    constructor(positionX,positionY,positionZ){
        this.positionX = positionX;
        this.positionY = positionY;
        this.positionZ = positionZ;

        this.cube = new THREE.Mesh(cubeGeometry,cubeMaterial);
        this.cube.position.set(positionX,positionY,positionZ);
        scene.add(this.cube);
    }

    move(direction){
        switch(direction){
            case "w": if(this.cube.position.z >-90)
            this.cube.position.z -= speed;
            camera.position.z = this.cube.position.z-50;
            camera.lookAt(this.cube.position.x,this.cube.position.y,this.cube.position.z);
            break;
            case "s": if(this.cube.position.z < 90)
            this.cube.position.z += speed;
            camera.position.z = this.cube.position.z-50;
            camera.lookAt(this.cube.position.x,this.cube.position.y,this.cube.position.z);
            break;
            case "a": if(this.cube.position.x > -90)
            this.cube.position.x -= speed;
            camera.position.x = this.cube.position.x-50;
            camera.lookAt(this.cube.position.x,this.cube.position.y,this.cube.position.z);
            break;
            case "d": if(this.cube.position.x < 90)
            this.cube.position.x += speed;
            camera.position.x = this.cube.position.x-50;
            camera.lookAt(this.cube.position.x,this.cube.position.y,this.cube.position.z);
            break;
        }

        // for (var vertexIndex = 0; vertexIndex < this.cube.geometry.vertices.length; vertexIndex++){       
        //     var localVertex = this.cube.geometry.vertices[vertexIndex].clone();
        //     var globalVertex = this.cube.matrix.multiplyVector3(localVertex);
        //     var directionVector = globalVertex.subSelf(this.cube.Player.position);
        //     var ray = new THREE.Ray(this.cube.Player.position,directionVector.clone().normalize());
        //     var collisionResults = ray.intersectObjects( collidableMeshList );
        //     if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()){
        //         console.log("collision!!");
        //     }
        // }
    }

    setPosition(positionX,positionY,positionZ){
        this.cube.position.x = positionX;
        this.cube.position.y = positionY;
        this.cube.position.z = positionZ;
    }  

    getPosition(){
        return this.cube.position;
    }

    remove(){
        scene.remove(this.cube);
    }
}

var userCube = new Cube(0,5.5,0);

var dirty = true;

function trackUserMovements(){
    if(keyboard[87]){ 
		userCube.move("w");
        dirty = true;
	}
	if(keyboard[83]){ 
		userCube.move("s");
        dirty = true;
	}
	if(keyboard[65]){ 
		userCube.move("a");
        dirty = true;
	}
	if(keyboard[68]){
		userCube.move("d");
        dirty = true;
	}
    if(dirty){
        dirty = false;
        var x = userCube.getPosition().x;
        var y = userCube.getPosition().y;
        var z = userCube.getPosition().z;
        socket.emit("position",{username:username,x:x,y:y,z:z});
    }

    requestAnimationFrame(trackUserMovements);
}

function keyDown(event){
    if(event.keyCode == 13){
        document.querySelector(".chatbox input").focus();
    }
    keyboard[event.keyCode] = true;
}
function keyUp(event){
    keyboard[event.keyCode] = false;
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

trackUserMovements();

socket.on("disconnected",data=>{
    cubes[data].remove();
});

//chat
document.querySelector(".chatbox input").addEventListener("focus",function(eve){
    window.removeEventListener('keydown',keyDown);
    window.removeEventListener('keyup',keyUp);
    window.addEventListener("keydown",sendMessage);
    eve.stopPropagation();
    window.addEventListener("click",handleBlur);
});

document.querySelector(".chatbox input").addEventListener("blur",function(){
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.removeEventListener("keydown",sendMessage);
    window.removeEventListener("click",handleBlur);
});

function handleBlur(event){
    if(event.target.nodeName == "CANVAS"){
        document.querySelector(".chatbox input").blur();
    }
}

function sendMessage(eve){
    if(eve.keyCode == 13 &&  document.querySelector(".chatbox input").value!=""){
        var message = document.querySelector(".chatbox input").value;
        document.querySelector(".chatbox input").value = "";
        document.querySelector(".chatbox input").blur();
        socket.emit("message",{message:message,username:username});
    }
}

socket.on("message",data=>{
    var div = document.createElement("div");
    div.className = "message"
    div.innerText = data.username+":     "+data.message;
    document.querySelector(".messages").appendChild(div);
    document.querySelector(".messages").scrollTop =  document.querySelector(".messages").scrollHeight;
});




document.addEventListener('visibilitychange', function(){
   if(document.visibilityState=="hidden"){
       keyboard = {};
   }
});