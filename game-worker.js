"use strict";

// COMMENT WHEN POSSIBLE

onmessage = function(event) {
	var prevStep = JSON.parse(event.data[0]);
	var currStep = prevStep.map(function(outerArr) { return outerArr.map(function(innerArr) { return innerArr.slice(); }) });
	var prevChangeSet = JSON.parse(event.data[1]);
	var currChangeSet = {};
	var bSet = JSON.parse(event.data[2]);
	var sSet = JSON.parse(event.data[3]);
	var size = JSON.parse(event.data[4]);
	
	for(var loc in prevChangeSet) {
		var count = 0;
		var neighbors = [];
		var neighborsCount = 0;
		var matches = loc.match(/(\d+)/g);
		var x = parseInt(matches[0]);
		var y = parseInt(matches[1]);
		var z = parseInt(matches[2]);
		
		for(var k = -1; k < 2; k++)
		{
			if((z + k) > -1 && (z + k) < size) // Check to make sure we're not checking out of bounds
			{
				for(var j = -1; j < 2; j++)
				{
					if((y + j) > -1 && (y + j) < size) // Check to make sure we're not checking out of bounds
					{
						for(var i = -1; i < 2; i++)
						{
							if((x + i) > -1 && (x + i) < size) // Check to make sure we're not checking out of bounds
							{
								// If is neighbor and neighbor is alive, increment count
								if(!(k == 0 && j == 0 && i == 0) && prevStep[z + k][y + j][x + i] != 0) { count++; }
								// Store valid neighbor
								neighbors[neighborsCount] = (x + i).toString() + ' ' + (y + j).toString() + ' ' + (z + k).toString();
								// Increment neighbor count
								neighborsCount++;
							}
						}
					}
				}
			}
		}
		
		if(prevStep[z][y][x] != 0)
		{
			if(sSet[count.toString()] === undefined)
			{
				currStep[z][y][x] = 0;
				for(var chng of neighbors)	{ currChangeSet[chng] = true; }
			}
		}
		else
		{
			if(bSet[count.toString()] !== undefined)
			{
				currStep[z][y][x] = 1;
				for(var chng of neighbors)	{ currChangeSet[chng] = true; }
			}			
		}
	}
	
	postMessage([JSON.stringify(currStep), JSON.stringify(currChangeSet)]);
}