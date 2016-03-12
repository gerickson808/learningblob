var canvas = document.getElementById('canvas');
var canvasOffset = 200;
canvas.height = window.innerHeight - canvasOffset;
canvas.width = window.innerWidth;
canvas.top = canvasOffset;
var h = canvas.height,
    w = canvas.width;
var circle = [];
var i = 0;
var gravity = 1;
var wind = 0;
var gameSpeed = 10;
var hurdles = [];
var points = 0;
var colliding = false;
var overHurdle = false;
var brain = new deepqlearn.Brain(2, 2, myOpt);
var fast,real, nearestHurdle, pointsToGet;
var cleared = false;

var reward_graph = new cnnvis.Graph();


document.getElementById('canvas').onmousedown = function() {
    return false;
};

canvas = oCanvas.create({
	canvas: 'canvas',
	background:'#3cf',
	clearEachFrame: true,
	drawEachFrame: true,
	fps:120,
	disableScrolling:true
});

var ground = canvas.display.rectangle({
    x: -10,
    y: (7 * h) / 8,
    zIndex: "front",
    height: (2 * h) / 8,
    width: 1.5 * w,
    fill: "#663300",
    stroke: "inside 10px #0A0"
});
canvas.addChild(ground);


var hero = canvas.display.arc({
    x: canvas.width / 10,
    y: ground.y - 16,
    velX: 0,
    velY: 0,
    radius: 16,
    start: 0,
    end: 360,
    fill: '#c00',
});
var eye = canvas.display.arc({
    x: hero.radius / 2,
    y: -hero.radius / 2,
    radius: hero.radius / 4,
    start: 20,
    end: 340,
    fill: '#000',
    pieSection: true
});
var mouth = canvas.display.arc({
    x: 7 * hero.radius / 8,
    y: -hero.radius / 3,
    radius: 7 * hero.radius / 8,
    start: 90,
    end: 140,
    fill: '#000'
});
hero.addChild(eye);
hero.addChild(mouth);
canvas.addChild(hero);

var groundHeight = h - ground.height / 2;
var heroFloor = groundHeight - hero.radius;

canvas.bind("keydown", function(e) {
    if (e.which === 87) jump("big");
    if (e.which === 83) jump("little");
});

function createHurdle() {
    var size = random(2) * 40;
    var hurdle = canvas.display.arc({
        x: w + size,
        y: groundHeight,
        velX: -gameSpeed,
        velY: 0,
        radius: 80,
        start: 0,
        end: 360,
        fill: '#030',
        pastHero: false,
        hit: false
    });
    hurdles.push(hurdle);
    canvas.addChild(hurdle);
    hurdle.zIndex = "back";
}


function generateHurdlesGenerator() {
    var frame = 0;
    return function() {
        frame++;
        if (frame > 50) {
            if (random(25) === 6) {
                createHurdle();
                frame = 0;
            }
        }
    };
}

var generateHurdles = generateHurdlesGenerator();

checkCollisions = function(objToCheck) {
    var centerA = { x: hero.x, y: hero.y };
    var centerB = { x: objToCheck.x, y: objToCheck.y };
    var distance = Math.sqrt(((centerB.x - centerA.x) * (centerB.x - centerA.x) + (centerB.y - centerA.y) * (centerB.y - centerA.y)));

    if (distance < (hero.radius + objToCheck.radius)) {
        // if (!colliding) pointsToGet = -4;
        pointsToGet = -0.5;
        colliding = true;
        objToCheck.hit = true;

    } else {
        colliding = false;
    }
};

checkIfOverHurdle = function(hurdle) {
    if (colliding) return;
    var heroCenter = hero.x;
    var heroLeft = hero.x - hero.radius;
    var heroRight = hero.x + hero.radius;
    var hurdleCenter = hurdle.x;
    var hurdleLeft = hurdle.x - hurdle.radius;
    var hurdleRight = hurdle.x + hurdle.radius;
    if ((heroLeft < hurdleRight && heroLeft > hurdleLeft) || (heroRight < hurdleRight && heroRight > hurdleLeft)) {
        overHurdle = true;
    } else overHurdle = false;
};

function random(num) {
    return Math.floor((Math.random() * num) + 1);
}

function jump(size) {
    if (hero.y < heroFloor) return;
    // if(size === "big")hero.velY = -17;
    // else hero.velY = -12;
    hero.velY = -14.5;
}

function moveHero(){
		if (hero.y <= heroFloor){
			hero.x += hero.velX;
			hero.y += hero.velY;
			hero.rotate(11.3);
		}
		else {
			hero.y = heroFloor;
			hero.velY = 0;
		}
}

function moveHurdles(){
	hurdles.forEach(function(hurdle){
		if (hurdle.x > 0 - hurdle.radius){
			hurdle.x += hurdle.velX;
		}
		else {
			canvas.removeChild(hurdle);
			hurdles.shift();
		}
		if(hurdle.x < hero.x - hero.radius && hurdle.x > hero.x - hero.radius - 10 && hurdle.hit === false) {
			points++;
			cleared = true;
		}
	});
}

function applyGravity(grav) {
    if (hero.y < heroFloor) hero.velY += grav;
}

function getState() {
    // isJumping, distnace from next obstacle, obstacle type
    var leastDistance = w,
        obsType;
    hurdles.forEach(function(hurdle) {
        var distance = hurdle.x - hero.x;
        if (hurdle.x > hero.x && distance < leastDistance) {
            leastDistance = distance;
            nearestHurdle = hurdle;
        }
    });
    // if(nearestHurdle) obsType = nearestHurdle.size == 80 ? 1 : 0;
    // else obsType = 0;
    var isJumping = hero.y < heroFloor ? 1 : 0;
    leastDistance = leastDistance / w || w;
    checkCollisions(nearestHurdle);
    checkIfOverHurdle(nearestHurdle);

    // return [isJumping, leastDistance, obsType];
    return [isJumping, leastDistance];

}

function getReward(action, state) {
	// body...
	if(!pointsToGet) pointsToGet = 0;
	if(state[0]===0 && !colliding) pointsToGet = 0.05;
	if(state[0]===1 && !overHurdle && !colliding) pointsToGet = -0.2;
	if(state[0]===1 && overHurdle && !colliding) pointsToGet = 0.8;
	// if(cleared) pointsToGet = 10;
	var reward = pointsToGet;
	pointsToGet = 0;
	cleared = false;
	return reward;
}

function toggleLearning() {

    if (brain.learning) {
        console.log('Learning turned off');
        brain.learning = false;
        brain.epsilon_test_time = 0.0;
    } else {
        console.log('Learning turned on');

        brain.learning = true;
        brain.epsilon_test_time = 0.01;
    }
}

function saveBrain() {
    var net = brain.value_net.toJSON();
    console.log(JSON.stringify(net));
}

function loadBrain() {
	var brainToLoad = eval("(" + document.getElementById('brains').value + ')');
	brain.value_net.fromJSON(brainToLoad);
}

function realTime() {
    clearInterval(fast);
    canvas.setLoop().stop();

    canvas.setLoop(function() {
        applyGravity(gravity);
        moveHero();
        generateHurdles();
        moveHurdles();
        runBrain();
        draw_stats();
    }).start();
}

function fastLearning() {
    canvas.setLoop().stop();
    clearInterval(fast);

    fast = setInterval(function() {
        applyGravity(gravity);
        moveHero();
        generateHurdles();
        moveHurdles();
        runBrain();
    }, 0);
}

function runBrain() {
    var state = getState();
    var action = brain.forward(state);
    var reward = getReward(action, state);
    console.log("state: ", state, "\naction: ", action, "\nreward: ", reward);
    // console.log(state);
    brain.backward(reward);

    // do action
    // switch (action){
    // 	case 1:
    // 		jump("big");
    // 		break;
    // 	case 2:
    // 		jump("small");
    // 		break;
    if (action === 1) jump();

    brain.visSelf(document.getElementById('info'));
}

function draw_stats() {
    var canvas = document.getElementById("vis_canvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var b = brain;
    var netin = b.last_input_array;
    ctx.strokeStyle = "rgb(0,0,0)";
    //ctx.font="12px Verdana";
    //ctx.fillText("Current state:",10,10);
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (var k = 0, n = netin.length; k < n; k++) {
        ctx.moveTo(10 + k * 12, 120);
        ctx.lineTo(10 + k * 12, 120 - netin[k] * 100);
    }
    ctx.stroke();

}





// canvas.setLoop(function(){
// 	applyGravity(gravity);
// 	moveHero();
// 	generateHurdles();
// 	moveHurdles();
// 	runBrain();
// }).start();
