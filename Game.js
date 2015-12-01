var prevLife = [];
var currentLife = [];
var changeList = [];
var bList = [];
var sList = [];
var size = 10

function main()
{
	drawInit();
	gameInit();
	
	//TEST STUFF FOR TESTING
	
	/*
	var blah = new Vector3([1, 2, 3]);
	
	console.log(blah);
	console.log(blah.elements);
	console.log(blah.elements[0]);
	*/
	
	/*
	var x = 5;
	var y = 5;
	var z = 5;
	
	for(var k = -1; k < 2; k++)
	{
		for(var j = -1; j < 2; j++)
		{
			for(var i = -1; i < 2; i++)
			{
				console.log((z + k) + ", " + (y + j) + ", " + (x + i));
			}
		}
	}
	*/
	
	var e = new Vector3([1, 2, 3]);
	var f = new Vector3([1, 2, 3]);
	var g = e;
	console.log(e.elements[0] == f.elements[0]);
	console.log(e.elements === f.elements);
	console.log(e == g);
	console.log(e === g);
}

function gameInit()
{
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
/*
function game()
{
	for(let loc of changeList) {
		var count = 0;
		var local
		var x = loc.elements[0];
		var y = loc.elements[1];
		var z = loc.elements[2];
		
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
								if(!(k == 0 && j == 0 && i == 0) && prevLife[z + k][y + j][x + i] != 0) { count++; }
							}
						}
					}
				}
			}
		}
		
		if(prevLife[z][y][x] != 0)
		{
			if(binaryIndexOf.call(sList, count) > 0)
			{
				changeList = changeList.concat();
			}
		}
		else
		{
			if(binaryIndexOf.call(bList, count) > 0)
			{
				changeList = changeList.concat();
			}
		}
	}
}
*/