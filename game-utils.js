function test()
{
	//TEST STUFF FOR TESTING
	
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
	
	/*
	var obj = {"123":true, "2":true, "3":true, "9":true};
	var A = "1";
	var B = "5";
	
	if (A in obj) {
    	console.log("true");
	} else { console.log("false"); }
	if (B in obj) {
    	console.log("true");
	} else { console.log("false"); }
	
	console.log(obj[B]);
	console.log(undefined == true);
	
	for(let C in obj)
	{
		console.log(parseInt(C.charAt(0)));
	}
	*/
	/*
	var a = [];
	a[0] = ['apple', 'orange', 'grape'];
	a[1] = ['water', 'soda', 'tea'];
	a[2] = ['phone', 'tablet', 'laptop'];
	
	var b = a.map(function(arr) { return arr.slice(); });
	var c = a.map(function(arr) { return arr.slice(); });
	
	var test = [a, b, c];
	
	var test2 = test.map(function(arr) { return arr.slice(); });
	test[0][0][0] = 'shit';
	console.log(test);
	console.log(test2);
	*/
	
	/*
	var test = [];
	for(var z = 0; z < 3; z++)
	{
		test[z] = [];
		
		for(var y = 0; y < 3; y++)
		{
			test[z][y] = [];
			
			for(var x = 0; x < 3; x ++)
			{
				test[z][y][x] = x;
			}
		}
	}
	
	console.log(test);
	
	var test2 = test.map(
		function(arr)
		{
			return arr.map(
				function(arr2)
				{
					return arr2.slice();
				}
			)
		}
	);
	//var test2 = test.map(function(arr) { arr.map(function(arr) { return arr.slice(); }); });
	test2[0][0][0] = 'shit';
	console.log(test);
	console.log(test2);
	*/
	
	//var blah = [];
	//console.log(blah.length);
}