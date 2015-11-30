var prevLife = [];
var currentLife = [];
var size = 10
var waitTime = 101;
var generation = 0;
var running = false;

function main() {
	drawInit();
	gameInit();
}

function gameInit() {
	for(var z = 0; z < size; z++)
	{
		prevLife[z] = [];
		currentLife[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			prevLife[z][y] = [];
			currentLife[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				prevLife[z][y][x] = 0;
				currentLife[z][y][x] = 0;
			}
		}
	}
}

function createLife(x, y, z) {
	currentLife[z][y][x] = true;
}