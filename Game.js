var prevLife = [];
var currentLife = [];

function main() {
	drawInit();
	gameInit();
}

function gameInit() {
	for(var z = 0; z < 10; z++)
	{
		prevLife[z] = [];
		currentLife[z] = [];
		
		for(var y = 0; y < 10; y++)
		{
			prevLife[z][y] = [];
			currentLife[z][y] = [];
			
			for(var x = 0; x < 10; x ++)
			{
				prevLife[z][y][x] = 0;
				currentLife[z][y][x] = 0;
			}
		}
	}
}