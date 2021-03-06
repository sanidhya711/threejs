import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

const socket = io();
var cubes = {};
var colors = [0xc9e069,0xc453cf,0xcf5353,0x3f4d49,];

socket.on("newCube", username => {
    cubes[username] = new Cube(0,5,0);
});

socket.on("positions",data=>{
    Object.keys(data).forEach(function(key){
        cubes[data[key].username] = new Cube(data[key].x,data[key].y,data[key].z,data[key].w,data[key].a,data[key].s,data[key].d);
    });
});

socket.on("handle key events",data=>{
    if(data.pressed){
        cubes[data.username].keyPressed(data.key);
    }else{
        cubes[data.username].keyReleased(data.key);
    }
});

var scene,renderer,camera,controls,thirdPersonCamera,userCube;
var keyboard = {
    83:false,
    87:false,
    65:false,
    68:false
};
var speed = 0.3;
var cubeGeometry = new THREE.BoxGeometry(10,10,10,3,3,3);

class Cube{
    constructor(positionX,positionY,positionZ,w,a,s,d){
        this.positionX = positionX;
        this.positionY = positionY;
        this.positionZ = positionZ;
        this.keyboard = {
            w:w,
            a:a,
            s:s,
            d:d
        }
        var random = Math.floor(Math.random() * 5);
        this.cubeMaterial = new THREE.MeshBasicMaterial({wireframe:true,color:colors[random]});
        this.cube = new THREE.Mesh(cubeGeometry,this.cubeMaterial);
        this.cube.position.set(positionX,positionY,positionZ);
        scene.add(this.cube);
    }

    move(direction){
        switch(direction){
            case "w": if(this.cube.position.z >-90)
            this.cube.position.z -= speed;
            break;
            case "s": if(this.cube.position.z < 90)
            this.cube.position.z += speed;
            break;
            case "a": if(this.cube.position.x > -90)
            this.cube.position.x -= speed;
            break;
            case "d": if(this.cube.position.x < 90)
            this.cube.position.x += speed;
            break;
        }
    }

    getPosition(){
        return this.cube.position;
    }

    keyPressed(key){
        switch(key){
            case 87: this.keyboard["w"] = true;
            break;
            case 83: this.keyboard["a"] = true;
            break;
            case 65: this.keyboard["s"] = true;
            break;
            case 68: this.keyboard["d"] = true;
            break;
        }
        
    }

    keyReleased(key){
        switch(key){
            case 87: this.keyboard["w"] = false;
            break;
            case 83: this.keyboard["a"] = false;
            break;
            case 65: this.keyboard["s"] = false;
            break;
            case 68: this.keyboard["d"] = false;
            break;
        }
    }

    update(){
        if(this.keyboard.w){
            this.move("w");
        }
        if(this.keyboard.a){
            this.move("s");
        }
        if(this.keyboard.s){
            this.move("a");
        }
        if(this.keyboard.d){
            this.move("d");
        }
    }

    setPosition(x,y,z){
        this.cube.position.x = x;
        this.cube.position.y = y;
        this.cube.position.z = z;
    }

    get Position() {
        return this.cube.position;
    }
    
    get Rotation() {
        return this.cube.quaternion;
    }

    remove(){
        scene.remove(this.cube);
    }
}

function init(){
    var WIDTH = window.innerWidth,HEIGHT = window.innerHeight;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH,HEIGHT);
    renderer.setClearColor(0x333F47,1);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45,WIDTH/HEIGHT,1,10000);
    camera.position.set(0,15,60);
    camera.lookAt(0,0,0);
    scene.add(camera);

    var material = new THREE.MeshBasicMaterial({wireframe:true,color:"black"});

    var floorGeometry = new THREE.PlaneGeometry(200,200,20,20);
    var floor = new THREE.Mesh(floorGeometry,material);
    floor.rotation.x = Math.PI/2;
    scene.add(floor);

    controls = new OrbitControls(camera,renderer.domElement);
    controls.minDistance = 10;
    controls.maxDistance = 275;

    userCube = new Cube(0,5.5,0);
    animate();
}

init();

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
        socket.emit("position",{x:userCube.getPosition().x,y:userCube.getPosition().y,z:userCube.getPosition().z,w:keyboard[87],a:keyboard[65],s:keyboard[83],d:keyboard[68],});
        dirty = false;
    }
    requestAnimationFrame(trackUserMovements);
}

function updatePositions(){
    Object.keys(cubes).forEach(function(cube){
        cubes[cube].update();
    });
    requestAnimationFrame(updatePositions);
}

updatePositions();

function keyDown(event){
    if(event.keyCode == 13){
        document.querySelector(".chatbox input").focus();
        keyboard = {};
        socket.emit("handle key events",{key:65,pressed:false});
        socket.emit("handle key events",{key:68,pressed:false});
        socket.emit("handle key events",{key:83,pressed:false});
        socket.emit("handle key events",{key:87,pressed:false});
    }
    keyboard[event.keyCode] = true;
    if(event.keyCode == 65 || event.keyCode == 68 || event.keyCode == 83 || event.keyCode == 87){
        socket.emit("handle key events",{key:event.keyCode,pressed:true});
    }
}
function keyUp(event){
    keyboard[event.keyCode] = false;
    if(event.keyCode == 65 || event.keyCode == 68 || event.keyCode == 83 || event.keyCode == 87){
        socket.emit("handle key events",{key:event.keyCode,pressed:false});
    }
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

trackUserMovements();

socket.on("disconnected",data=>{
    cubes[data].remove();
});

var previousT;

function animate(){
    controls.update();
    if (previousT === null) {
        previousT = t;
    }
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
}


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
    if(eve.keyCode == 13){
        document.querySelector(".chatbox input").blur();
        if(document.querySelector(".chatbox input").value!=""){
            var message = document.querySelector(".chatbox input").value;
            document.querySelector(".chatbox input").value = "";
            socket.emit("message",{message:message});
        }
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
        socket.emit("handle key events",{key:65,pressed:false});
        socket.emit("handle key events",{key:68,pressed:false});
        socket.emit("handle key events",{key:83,pressed:false});
        socket.emit("handle key events",{key:87,pressed:false});
   }else{
        repositionCubes();
   }
});

function resetKeyboard(){
    keyboard = {};
    socket.emit("handle key events",{key:65,pressed:false});
    socket.emit("handle key events",{key:68,pressed:false});
    socket.emit("handle key events",{key:83,pressed:false});
    socket.emit("handle key events",{key:87,pressed:false});
}

function repositionCubes(){
    socket.emit("repositionCubes",true);
    socket.on("repositionCubes",data=>{
        Object.keys(data).forEach(function(key){
            if(cubes[data[key].username]){
                cubes[data[key].username].setPosition(data[key].x,data[key].y,data[key].z);
            }
        });
    });
}

window.addEventListener('blur',resetKeyboard);

function resize(){
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize",resize);










// class ThirdPersonCamera {
//     constructor(params) {
//       this._params = params;
//       this._camera = params.camera;
  
//       this._currentPosition = new THREE.Vector3();
//       this._currentLookat = new THREE.Vector3();
//     }
  
//     _CalculateIdealOffset() {
//       const idealOffset = new THREE.Vector3(0, 15,40);
//       idealOffset.applyQuaternion(this._params.target.Rotation);
//       idealOffset.add(this._params.target.Position);
//       return idealOffset;
//     }
  
//     _CalculateIdealLookat() {
//       const idealLookat = new THREE.Vector3(0, 0, 0);
//       idealLookat.applyQuaternion(this._params.target.Rotation);
//       idealLookat.add(this._params.target.Position);
//       return idealLookat;
//     }
  
//     Update(timeElapsed) {
//       const idealOffset = this._CalculateIdealOffset();
//       const idealLookat = this._CalculateIdealLookat();
//       const t = 1.0 - Math.pow(0.001, timeElapsed);
  
//       this._currentPosition.lerp(idealOffset, t);
//       this._currentLookat.lerp(idealLookat, t);
  
//       this._camera.position.copy(this._currentPosition);
//       this._camera.lookAt(this._currentLookat);
//     }
//   }