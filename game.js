"use strict";

var lifeBuffer;
var nextWrite;
var nextRead;
var bufferLimit = 10;

var bSet = {};
var sSet = {};
var size = 20;
var myWorker;
var isWorking;
var testBuffer;

function main()
{	
	myWorker = new Worker('game-worker.js');
	myWorker.onmessage = function(event) {
		
		lifeBuffer[nextWrite] = {arr: JSON.parse(event.data[0]), chng: JSON.parse(event.data[1])}
		nextWrite++;
		nextWrite = nextWrite % bufferLimit;
		isWorking = false;
	}
	
	gameInit();
	drawInit();
	
	generateNextStep(); // First life call
	draw(); // First draw call
}

function gameInit()
{
	lifeBuffer = [];
	nextWrite = 0;
	nextRead = 0;
	isWorking = false;
	
	var setup = [];
	var checkAllChangeSet = {};
	
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
		
	setup[10][10][11] = 1;
	setup[10][10][9] = 1;
	setup[10][11][10] = 1;
	setup[10][9][10] = 1;
	setup[10][10][10] = 1;
	
	lifeBuffer[0] = {arr: setup, chng: checkAllChangeSet}
	nextWrite++;
/*	
	bSet["5"] = true;
	bSet["7"] = true;
	sSet["6"] = true;
*/
	bSet["4"] = true;
	bSet["5"] = true;
	sSet["5"] = true;
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

function getGameStep()
{
	var temp = lifeBuffer[nextRead].arr;
	nextRead++;
	nextRead = nextRead % bufferLimit;
	return temp;
}