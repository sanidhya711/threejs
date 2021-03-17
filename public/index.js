import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
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

    var floorGeometry = new THREE.PlaneGeometry(100,100,20,20);
    var floor = new THREE.Mesh(floorGeometry,material);
    floor.rotation.x = Math.PI/2;
    scene.add(floor);

    controls = new OrbitControls(camera,renderer.domElement);
    controls.minDistance = 70;
    controls.maxDistance = 175;
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
            case "w": this.cube.position.z -= speed;
            break;
            case "s": this.cube.position.z += speed;
            break;
            case "a": this.cube.position.x -= speed;
            break;
            case "d": this.cube.position.x += speed;
            break;
        }
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

var userCube = new Cube(0,5,0);

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