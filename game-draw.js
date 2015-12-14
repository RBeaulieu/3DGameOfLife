// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Draw locations
var g_currStep = [];
// Cube buffer that stores the vertices for the cube
var g_cubeBuffer = null;
// Coordinate transformation matrix
var g_mvpMatrix = new Matrix4();
// Movement speed
var g_moveSpeed = 0.5;
// Eye coordinates
var g_eyeX = 13.5, g_eyeY = 13.5, g_eyeZ = 13.5;
// Reference coordinates
var g_centerX = 0.0, g_centerY = 0.0, g_centerZ = 10.0;

//KEYDOWN VARIABLES
var gl;
var n;
var VPMatrix;
var a_Position;
var u_MVPMatrix;
var controlSet = [];
var isStopped;

//CAMERA VARIABLES
var degLR = 0;
var degUD = -90;

function testCubes()
{
	for(var z = 0; z < size; z++)
	{
		g_currStep[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			g_currStep[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				if(z == 0 || y == 0 || x == 0) { g_currStep[z][y][x] = 1; }
				else { g_currStep[z][y][x] = 0; }
			}
		}
	}
}

function drawInit()
{
	// Set up test cube array (comment out if using game)
	testCubes();
	
	// Retrieve <canvas> element
	var canvas = document.getElementById('myWebGLCanvas');
	
	// Get the rendering context for WebGL
	gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('*** Error: Failed to get the rendering context for WebGL');
		return;
	}
	
	// Retrieve vertex shader and fragment shader from HTML page
	getShader(gl, 'shader-vs');
	getShader(gl, 'shader-fs');
	
	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('*** Error: Failed to intialize shaders.');
		return;
	}
	// Set vertex information
	n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);
	// Turn on face culling
	gl.enable(gl.CULL_FACE);
	// Set to cull back faces
	gl.cullFace(gl.BACK);
	
	// Get the storage locations of attribute and uniform variables
	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	u_MVPMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
	if (a_Position < 0 || !u_MVPMatrix) {
		console.log('*** Error: Failed to get the storage location of attribute or uniform variable');
		return;
	}
	
	// Calculate the view projection matrix
	VPMatrix = new Matrix4();
	
	// Register the event handler to be called on key press and key release
	document.onkeydown = function(ev){ keyDown(ev, gl, n, VPMatrix, a_Position, u_MVPMatrix); };
	document.onkeyup = function(ev){ keyUp(ev, gl, n, VPMatrix, a_Position, u_MVPMatrix); };
}

function getShader(gl, scriptId)
{
	// Retrieve shader by HTML ID
	var shaderScript = document.getElementById(scriptId);
    if (!shaderScript) { console.log('*** Error: unknown script element ' + scriptId); }
	
	// Set shader to appropriate source container
	if (shaderScript.type == 'x-shader/x-vertex') { VSHADER_SOURCE = shaderScript.text; }
	else if (shaderScript.type == 'x-shader/x-fragment') { FSHADER_SOURCE = shaderScript.text; } 
	else { console.log('*** Error: shader type not set'); }
}

function initVertexBuffers(gl)
{
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	
	var vertices = new Float32Array([   // Vertex coordinates
		1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
		1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
		-1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
		-1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
		1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
	]);
	
	var colors = new Float32Array([     // Colors
		0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
		0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
		1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
		1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
		0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  // v7-v4-v3-v2 down
		0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
	]);
	
	var indices = new Uint8Array([       // Indices of the vertices
		0, 1, 2,   0, 2, 3,    // front
		4, 5, 6,   4, 6, 7,    // right
		8, 9,10,   8,10,11,    // up
		12,13,14,  12,14,15,    // left
		16,17,18,  16,18,19,    // down
		20,21,22,  20,22,23     // back
	]);
	
	// Write coords to buffers, but don't assign to attribute variables
	g_cubeBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
	
	if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) { return -1; }
	
	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}
	
	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	
	return indices.length;
}

function initArrayBufferForLaterUse(gl, data, num, type){
	var buffer = gl.createBuffer();   // Create a buffer object
	if (!buffer) {
	console.log('Failed to create the buffer object');
	return null;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	
	// Store the necessary information to assign the object to the attribute variable later
	buffer.num = num;
	buffer.type = type;
	
	return buffer;
}

function initArrayBuffer(gl, attribute, data, num, type)
{
	var buffer = gl.createBuffer();   // Create a buffer object
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);
	
	return true;
}

//function keyDown(ev, gl, n, VPMatrix, a_Position, u_MVPMatrix)
function keyDown(ev)
{
	if(ev.keyCode == 37) { controlSet[37] = 1; } // The left arrow key was pressed
	if(ev.keyCode == 38) { controlSet[38] = 1; } // The up arrow key was pressed
	if(ev.keyCode == 39) { controlSet[39] = 1; } // The right arrow key was pressed
	if(ev.keyCode == 40) { controlSet[40] = 1; } // The down arrow key was pressed
	if(ev.keyCode == 65) { controlSet[65] = 1; } // The A key was pressed
	if(ev.keyCode == 68) { controlSet[68] = 1; } // The D key was pressed
	if(ev.keyCode == 69) { controlSet[69] = 1; } // The E key was pressed
	if(ev.keyCode == 81) { controlSet[81] = 1; } // The Q key was pressed
	if(ev.keyCode == 83) { controlSet[83] = 1; } // The S key was pressed
	if(ev.keyCode == 87) { controlSet[87] = 1; } // The W key was pressed
}

function keyUp(ev)
{
	if(ev.keyCode == 37) { controlSet[37] = 0; } // The left arrow key was released
	if(ev.keyCode == 38) { controlSet[38] = 0; } // The up arrow key was released
	if(ev.keyCode == 39) { controlSet[39] = 0; } // The right arrow key was released
	if(ev.keyCode == 40) { controlSet[40] = 0; } // The down arrow key was released
	if(ev.keyCode == 65) { controlSet[65] = 0; } // The A key was released
	if(ev.keyCode == 68) { controlSet[68] = 0; } // The D key was released
	if(ev.keyCode == 69) { controlSet[69] = 0; } // The E key was released
	if(ev.keyCode == 81) { controlSet[81] = 0; } // The Q key was released
	if(ev.keyCode == 83) { controlSet[83] = 0; } // The S key was released
	if(ev.keyCode == 87) { controlSet[87] = 0; } // The W key was released
}

function draw(highResTimestamp) {
	requestAnimationFrame(draw);
	//console.time('fps');
	
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//if(controlSet[37]){ g_centerX -= g_moveSpeed; }	// The right arrow key was released
	//if(controlSet[38]){ g_centerY += g_moveSpeed; }	// The up arrow key was released
	//if(controlSet[39]){ g_centerX += g_moveSpeed; }	// The left arrow key was released
	//if(controlSet[40]){ g_centerY -= g_moveSpeed; }	// The down arrow key was released
	//if(controlSet[65]){ g_eyeX -= g_moveSpeed; g_centerX -= g_moveSpeed; }	// The A key was released
	//if(controlSet[68]){ g_eyeX += g_moveSpeed; g_centerX += g_moveSpeed;}	// The D key was released
	//if(controlSet[69]){ g_eyeY -= g_moveSpeed; }	// The E key was released
	//if(controlSet[81]){ g_eyeY += g_moveSpeed; }	// The Q key was released
	//if(controlSet[83]){ g_eyeZ -= g_moveSpeed; }	// The S key was released
	//if(controlSet[87]){ g_eyeZ += g_moveSpeed; }	// The W key was released
	
	//Read the 3D Array
	for(var z = 0; z < size; z++)
	{
		for(var y = 0; y < size; y++)
		{
			for(var x = 0; x < size; x ++)
			{
				if(g_currStep[z][y][x] == 1)
				{
					drawCube(x, y, z, gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
				}
			}
		}
	}
	//console.timeEnd('fps');

	if(controlSet[65]){ g_eyeX -= g_moveSpeed; }	// The A key was released
	if(controlSet[68]){ g_eyeX += g_moveSpeed; }	// The D key was released
	if(controlSet[69]){ g_eyeY -= g_moveSpeed; }	// The E key was released
	if(controlSet[81]){ g_eyeY += g_moveSpeed; }	// The Q key was released
	if(controlSet[83]){ g_eyeZ -= g_moveSpeed; }	// The S key was released
	if(controlSet[87]){ g_eyeZ += g_moveSpeed; }	// The W key was released

	// The left arrow key was released
	if(controlSet[37]){
		degLR -= 2;
	}	
	// The right arrow key was released
	if(controlSet[39]){
		degLR += 2;
	}	
	// The up arrow key was released
	if(controlSet[38]){
		if(degUD+2 <= -10){
			degUD += 2;
		}
	}	
	// The down arrow key was released
	if(controlSet[40]){
		if(degUD-2 >= -176){
			degUD -= 2;
		}
	}	

	g_centerX = g_eyeX + (10 * Math.cos(degLR*3.1416/180) * Math.sin(degUD*3.1416/180))
	g_centerY = g_eyeY + (10 * Math.cos(degUD*3.1416/180))
	g_centerZ = g_eyeZ + (10 * Math.sin(degLR*3.1416/180) * Math.sin(degUD*3.1416/180))
	
	VPMatrix.setPerspective(60.0, 600 / 400, 1.0, 200.0);
	VPMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, g_centerX, g_centerY, g_centerZ, 0.0, 1.0, 0.0);

	setEyePos(g_eyeX, g_eyeY, g_eyeZ);
	setRefPos(g_centerX, g_centerY, g_centerZ);
	
	//updateGameState();
}

function drawCube(x, y, z, gl, n, buffer, VPMatrix, a_Position, u_MVPMatrix)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// Assign the buffer object to the attribute variable
	gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_Position);
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(VPMatrix);
	g_mvpMatrix.translate(x * 3, y * 3, z * 3);
	gl.uniformMatrix4fv(u_MVPMatrix, false, g_mvpMatrix.elements);
	
	// Draw
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function updateGameState()
{
	//if(!isStopped)
	//{
		//console.log("------------ step " + step + " ------------");
	//}
}