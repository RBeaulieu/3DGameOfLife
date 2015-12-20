"use strict";

var lifeBuffer;
var nextWrite;
var nextRead;
var bufferLimit = 10;

var bSet;
var sSet;
var preset = 1;
var checkAllChangeSet;
var size = 21;
var myWorker;
var isWorking;

function main()
{	
	myWorker = new Worker('game-worker.js');
	myWorker.onmessage = function(event) {
		if(isWorking)
		{
			lifeBuffer[nextWrite] = {arr: JSON.parse(event.data[0]), chng: JSON.parse(event.data[1])}
			nextWrite++;
			nextWrite = nextWrite % bufferLimit;
			isWorking = false;
		}
		else
		{
			console.log('Discarded changes, possible reset issue');
		}
	}
	
	gameInit();
	drawInit();
	
	generateNextStep(); // First life call
	draw(); // First draw call
}

function gameInit()
{
	lifeBuffer = [];
	
	var setup = [];
	checkAllChangeSet = {};
	
	for(var z = 0; z < size; z++)
	{
		setup[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			setup[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				setup[z][y][x] = 0;
				checkAllChangeSet[x.toString() + ' ' + y.toString() + ' ' + z.toString()] = true;
			}
		}
	}
	
	setPreset(setup);

	g_currStep = setup;
	
	// Set initial step update speed
	var initialSpeed = 1000;
	document.getElementById('rngSpeed').value = initialSpeed;
	setSpeed(initialSpeed);
	
	gameStart();
	gameStop();
}

function setPreset(setup){

	if(preset==1){
		//DEFAULT (BLINKER)4,5/5
		setup[11][10][10] = 1;
		setup[9][10][10] = 1;
		setup[10][10][11] = 1;
		setup[10][10][9] = 1;
		setup[10][11][10] = 1;
		setup[10][9][10] = 1;
		setup[10][10][10] = 1;
		document.getElementById('txtBVal').value = '4,5';
		document.getElementById('txtSVal').value = '5';
	}
	else if(preset==2){
		//ACCORDION (WALL 2 WALL BLINKER)4,5/5
		setup[10][10][11] = 1;
		setup[10][10][9] = 1;
		setup[10][11][10] = 1;
		setup[10][9][10] = 1;
		setup[10][10][10] = 1;
		document.getElementById('txtBVal').value = '4,5';
		document.getElementById('txtSVal').value = '5';
	}
	else if(preset==3){
		//BAD REACTION (EXPLOSION)4,5/5
		setup[9][10][10] = 1;
		setup[10][10][11] = 1;
		setup[10][10][9] = 1;
		setup[10][11][10] = 1;
		setup[10][9][10] = 1;
		setup[10][10][10] = 1;

		setup[12][10][10] = 1;
		setup[12][10][11] = 1;
		setup[12][10][9] = 1;
		setup[12][11][10] = 1;
		setup[12][9][10] = 1;
		setup[13][10][10] = 1;
		document.getElementById('txtBVal').value = '4,5';
		document.getElementById('txtSVal').value = '5';
	}
	else if(preset==4){
		//SHOCKWAVE (EXPLOSION)2,5/4,8
		setup[10][9][9] = 1;
		setup[10][9][11] = 1;
		setup[11][9][10] = 1;
		setup[9][9][10] = 1;
		setup[10][9][10] = 1;
		setup[10][8][10] = 1;

		setup[10][11][9] = 1;
		setup[10][11][11] = 1;
		setup[11][11][10] = 1;
		setup[9][11][10] = 1;
		setup[10][11][10] = 1;
		setup[10][12][10] = 1;
		document.getElementById('txtBVal').value = '2,5';
		document.getElementById('txtSVal').value = '4,8';
	}
	else if(preset==5){
		//Carter Bays 600 (Glider 5766)
		setup[10][17][2] = 1;
		setup[10][17][1] = 1;
		setup[10][18][2] = 1;
		setup[10][18][0] = 1;
		setup[10][19][2] = 1;
		setup[9][17][2] = 1;
		setup[9][17][1] = 1;
		setup[9][18][2] = 1;
		setup[9][18][0] = 1;
		setup[9][19][2] = 1;
		document.getElementById('txtBVal').value = '6';
		document.getElementById('txtSVal').value = '5,6,7';
	}
	else if(preset==6){
		//The Perrin Swivel (Blinker)
		for(var i=2; i<20; i+=8){
			for(var j=1; j<20; j+=8){
				for(var k=2; k<20; k+=8){
					setup[i+1][j+1][k+1] = 1;
					setup[i+1][j+1][k  ] = 1;
					setup[i  ][j+1][k  ] = 1;
					setup[i  ][j+2][k+1] = 1;
				}
			}
		}
		document.getElementById('txtBVal').value = '4';
		document.getElementById('txtSVal').value = '5';
	}
	else if(preset==7){
		//Burst Stream(Oscillator)
		for(var i=1; i<20; i+=6){
			setup[i][10][10] = 1;
			setup[i][10][9] = 1;
			setup[i][9][10] = 1;
			setup[i][9][9] = 1;		
		}
		document.getElementById('txtBVal').value = '4';
		document.getElementById('txtSVal').value = '2';
	}
	else if(preset==8){
		//Architect (Repeater)
		for(var i=3; i<18; i++){
			for(var j=0; j<20; j+=4){
				//left wall
				setup[i][1+j][1] = 1;
				setup[i][0+j][0] = 1;
				//right wall
				setup[i][1+j][20] = 1;
				setup[i][0+j][19] = 1;
				//back wall
				setup[1][1+j][i] = 1;
				setup[0][0+j][i] = 1;
				//front wall
				setup[19][1+j][i] = 1;
				setup[20][0+j][i] = 1;
			}
			for(var j=4; j<20; j+=4){
				//roof
				setup[4+i%13][20][1+j] = 1;
				setup[4+i%13][19][0+j] = 1;
				if(j<16){
					//floor
					setup[4+i%13][1][2+j%20] = 1;
					setup[4+i%13][0][1+j%20] = 1;	
				}
			}
		}
		//DEFAULT (BLINKER)4,5/5
		setup[11][10][10] = 1;
		setup[9][10][10] = 1;
		setup[10][10][11] = 1;
		setup[10][10][9] = 1;
		setup[10][11][10] = 1;
		setup[10][9][10] = 1;
		setup[10][10][10] = 1;
		document.getElementById('txtBVal').value = '4,5';
		document.getElementById('txtSVal').value = '5';
	}
	else if(preset==9){
		//Walls (Repeater)
		for(var i=0; i<21; i++){
			for(var j=0; j<20; j+=2){
				//left wall
				setup[i][0+j][1] = 1;
				setup[i][1+j][0] = 1;
				//right wall
				setup[i][0+j][19] = 1;
				setup[i][1+j][20] = 1;
			}
		}
		setup[10][10][10] = 1;
		setup[10][10][9] = 1;
		setup[11][10][9] = 1;
		setup[11][10][10] = 1;
		setup[11][10][11] = 1;
		setup[10][10][11] = 1;
		setup[9][10][11] = 1;
		setup[9][10][10] = 1;
		setup[9][10][9] = 1;

		setup[10][12][10] = 1;
		setup[10][12][9] = 1;
		setup[11][12][9] = 1;
		setup[11][12][10] = 1;
		setup[11][12][11] = 1;
		setup[10][12][11] = 1;
		setup[9][12][11] = 1;
		setup[9][12][10] = 1;
		setup[9][12][9] = 1;
		document.getElementById('txtBVal').value = '7,8,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25';
		document.getElementById('txtSVal').value = '3,5,7,11';
	}
	else if(preset==10){
		//setup[10][10][10] = 1;
		setup[10][10][9] = 1;
		setup[11][10][9] = 1;
		setup[11][10][10] = 1;
		setup[11][10][11] = 1;
		setup[10][10][11] = 1;
		setup[9][10][11] = 1;
		setup[9][10][10] = 1;
		setup[9][10][9] = 1;
		document.getElementById('txtBVal').value = '8,10';
		document.getElementById('txtSVal').value = '3,5,7,11';
	}
}

function gameStateInit(bInput, sInput)
{
	isWorking = false;
	nextWrite = 0;
	nextRead = 0;
	var currStepCopy = g_currStep.map(function(outerArr) { return outerArr.map(function(innerArr) { return innerArr.slice(); }) });
	lifeBuffer[0] = {arr: currStepCopy, chng: checkAllChangeSet}
	nextWrite++;
	
	bSet = {};
	sSet = {};
	
	for(var b of bInput) { bSet[b] = true; }
	for(var s of sInput) { sSet[s] = true; }
}

function generateNextStep()
{
	if(!isWorking && nextWrite != nextRead)
	{
		var prevWrite;
		if(nextWrite == 0) { prevWrite = bufferLimit - 1; }
		else { prevWrite = nextWrite - 1;}
		
		myWorker.postMessage([JSON.stringify(lifeBuffer[prevWrite].arr), JSON.stringify(lifeBuffer[prevWrite].chng), JSON.stringify(bSet), JSON.stringify(sSet), size]);
		isWorking = true;
	}
	setTimeout(generateNextStep, 100);
}

// POTENTIALLY UNSAFE, FIX SOON
function getGameStep()
{
	var temp = lifeBuffer[nextRead].arr;
	nextRead++;
	nextRead = nextRead % bufferLimit;
	return temp;
}