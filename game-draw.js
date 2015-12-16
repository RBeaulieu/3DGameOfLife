// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Instance of canvas
var g_canvas;
// Instance of WebGL context
var g_webGL;

// Draw locations
var g_currStep = [];
// Update step speed
var g_updateSpeed = 2000;
// Last update time
var g_lastUpdate;

// Cube buffer that stores the vertices for the cube
var g_cubeBuffer = null;
// Number of indices for cube
var g_numIndices;
// Storage location of a_Position
var g_aPosition;
// Storage location of u_MVPMatrix
var g_uMVPMatrix;
// Model-View transformation matrix
var g_vpMatrix = new Matrix4();
// Model-View-Project transformation matrix
var g_mvpMatrix = new Matrix4();

// Movement speed
var g_moveSpeed = 0.5;
// Look speed
var g_lookSpeed = 2;
// Eye coordinates
var g_eyeX = 30.0, g_eyeY = 32.0, g_eyeZ = 60.0;
// Reference coordinates
var g_centerX = 0.0, g_centerY = 0.0, g_centerZ = 0.0;
// Control set
var g_controlSet = [];

// angle of the xz plane
var yaw = 90;
// angle of the yz plane
var pitch = -90;
// for multiplication, turning degrees into radians
var p180 = Math.PI/180

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
	//testCubes();
	g_currStep = lifeBuffer[0].arr;
	g_lastUpdate = 0;
	
	// Retrieve <canvas> element
	g_canvas = document.getElementById('myWebGLCanvas');
	
	// Get the rendering context for WebGL
	g_webGL = getWebGLContext(g_canvas);
	if (!g_webGL) {
		console.log('*** Error: Failed to get the rendering context for WebGL');
		return;
	}
	
	// Retrieve vertex shader and fragment shader from HTML page
	getShader(g_webGL, 'shader-vs');
	getShader(g_webGL, 'shader-fs');
	
	// Initialize shaders
	if (!initShaders(g_webGL, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('*** Error: Failed to intialize shaders.');
		return;
	}
	// Set vertex information
	g_numIndices = initVertexBuffers(g_webGL);
	if (g_numIndices < 0) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	// Specify the color for clearing <canvas>
	g_webGL.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing
	g_webGL.enable(g_webGL.DEPTH_TEST);
	// Turn on face culling
	g_webGL.enable(g_webGL.CULL_FACE);
	// Set to cull back faces
	g_webGL.cullFace(g_webGL.BACK);
	
	// Get the storage locations of attribute and uniform variables
	g_aPosition = g_webGL.getAttribLocation(g_webGL.program, 'a_Position');
	g_uMVPMatrix = g_webGL.getUniformLocation(g_webGL.program, 'u_MVPMatrix');
	if (g_aPosition < 0 || !g_uMVPMatrix) {
		console.log('*** Error: Failed to get the storage location of attribute or uniform variable');
		return;
	}
	
	// Register the event handler to be called on key press and key release
	document.onkeydown = function(ev){ keyDown(ev); };
	document.onkeyup = function(ev){ keyUp(ev); };
}

function getShader(g_webGL, scriptId)
{
	// Retrieve shader by HTML ID
	var shaderScript = document.getElementById(scriptId);
    if (!shaderScript) { console.log('*** Error: unknown script element ' + scriptId); }
	
	// Set shader to appropriate source container
	if (shaderScript.type == 'x-shader/x-vertex') { VSHADER_SOURCE = shaderScript.text; }
	else if (shaderScript.type == 'x-shader/x-fragment') { FSHADER_SOURCE = shaderScript.text; } 
	else { console.log('*** Error: shader type not set'); }
}

function initVertexBuffers(g_webGL)
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
	g_cubeBuffer = initArrayBufferForLaterUse(g_webGL, vertices, 3, g_webGL.FLOAT);
	
	if (!initArrayBuffer(g_webGL, 'a_Color', colors, 3, g_webGL.FLOAT)) { return -1; }
	//if (!initArrayBuffer(g_webGL, 'a_Normal', normals, 3, g_webGL.FLOAT)) { return -1; }
	
	// Write the indices to the buffer object
	var indexBuffer = g_webGL.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}
	
	// Write the indices to the buffer object
	g_webGL.bindBuffer(g_webGL.ELEMENT_ARRAY_BUFFER, indexBuffer);
	g_webGL.bufferData(g_webGL.ELEMENT_ARRAY_BUFFER, indices, g_webGL.STATIC_DRAW);
	
	return indices.length;
}

function initArrayBufferForLaterUse(g_webGL, data, num, type){
	var buffer = g_webGL.createBuffer();   // Create a buffer object
	if (!buffer) {
	console.log('Failed to create the buffer object');
	return null;
	}
	// Write date into the buffer object
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, buffer);
	g_webGL.bufferData(g_webGL.ARRAY_BUFFER, data, g_webGL.STATIC_DRAW);
	
	// Store the necessary information to assign the object to the attribute variable later
	buffer.num = num;
	buffer.type = type;
	
	return buffer;
}

function initArrayBuffer(g_webGL, attribute, data, num, type)
{
	var buffer = g_webGL.createBuffer();   // Create a buffer object
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	
	// Write date into the buffer object
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, buffer);
	g_webGL.bufferData(g_webGL.ARRAY_BUFFER, data, g_webGL.STATIC_DRAW);
	
	// Assign the buffer object to the attribute variable
	var a_attribute = g_webGL.getAttribLocation(g_webGL.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	g_webGL.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	
	// Enable the assignment of the buffer object to the attribute variable
	g_webGL.enableVertexAttribArray(a_attribute);
	
	return true;
}

function keyDown(ev)
{
	if(ev.keyCode == 37) { g_controlSet[37] = 1; } // The left arrow key was pressed
	if(ev.keyCode == 38) { g_controlSet[38] = 1; } // The up arrow key was pressed
	if(ev.keyCode == 39) { g_controlSet[39] = 1; } // The right arrow key was pressed
	if(ev.keyCode == 40) { g_controlSet[40] = 1; } // The down arrow key was pressed
	if(ev.keyCode == 65) { g_controlSet[65] = 1; } // The A key was pressed
	if(ev.keyCode == 68) { g_controlSet[68] = 1; } // The D key was pressed
	if(ev.keyCode == 69) { g_controlSet[69] = 1; } // The E key was pressed
	if(ev.keyCode == 81) { g_controlSet[81] = 1; } // The Q key was pressed
	if(ev.keyCode == 83) { g_controlSet[83] = 1; } // The S key was pressed
	if(ev.keyCode == 87) { g_controlSet[87] = 1; } // The W key was pressed
}

function keyUp(ev)
{
	if(ev.keyCode == 37) { g_controlSet[37] = 0; } // The left arrow key was released
	if(ev.keyCode == 38) { g_controlSet[38] = 0; } // The up arrow key was released
	if(ev.keyCode == 39) { g_controlSet[39] = 0; } // The right arrow key was released
	if(ev.keyCode == 40) { g_controlSet[40] = 0; } // The down arrow key was released
	if(ev.keyCode == 65) { g_controlSet[65] = 0; } // The A key was released
	if(ev.keyCode == 68) { g_controlSet[68] = 0; } // The D key was released
	if(ev.keyCode == 69) { g_controlSet[69] = 0; } // The E key was released
	if(ev.keyCode == 81) { g_controlSet[81] = 0; } // The Q key was released
	if(ev.keyCode == 83) { g_controlSet[83] = 0; } // The S key was released
	if(ev.keyCode == 87) { g_controlSet[87] = 0; } // The W key was released
}

function draw(highResTimestamp) {
	requestAnimationFrame(draw);
	
	// Clear color and depth buffer
	g_webGL.clear(g_webGL.COLOR_BUFFER_BIT | g_webGL.DEPTH_BUFFER_BIT);

	// The left
<<<<<<< HEAD
	if(g_controlSet[37]){
		degLR -= g_lookSpeed;
	}	
	// The right
	if(g_controlSet[39]){
		degLR += g_lookSpeed;
	}	
	// The up
	if(g_controlSet[38]){
		if(degUD + g_lookSpeed <= -10){
			degUD += g_lookSpeed;
		}
	}	
	// The downs
	if(g_controlSet[40]){
		if(degUD - g_lookSpeed >= -176){
			degUD -= g_lookSpeed;
=======
	if(controlSet[37]){
		yaw -= g_lookSpeed;
	}	
	// The right
	if(controlSet[39]){
		yaw += g_lookSpeed;
	}	
	// The up
	if(controlSet[38]){
		if(pitch + g_lookSpeed <= -10){
			pitch += g_lookSpeed;
		}
	}	
	// The downs
	if(controlSet[40]){
		if(pitch - g_lookSpeed >= -176){
			pitch -= g_lookSpeed;
>>>>>>> refs/remotes/origin/master
		}
	}	

	g_centerX = g_eyeX + (10 * Math.cos(yaw*p180) * Math.sin(pitch*p180))
	g_centerY = g_eyeY + (10 * Math.cos(pitch*p180))
	g_centerZ = g_eyeZ + (10 * Math.sin(yaw*p180) * Math.sin(pitch*p180))

	// The A (left)
<<<<<<< HEAD
	if(g_controlSet[65]){
		g_eyeX -= Math.sin(degLR*3.1416/180) * g_moveSpeed;
		g_eyeZ += Math.cos(degLR*3.1416/180) * g_moveSpeed;
	}
	// The D (right)
	if(g_controlSet[68]){
		g_eyeX += Math.sin(degLR*3.1416/180) * g_moveSpeed;
		g_eyeZ -= Math.cos(degLR*3.1416/180) * g_moveSpeed;
=======
	if(controlSet[65]){
		g_eyeX -= Math.sin(yaw*p180) * g_moveSpeed;
		g_eyeZ += Math.cos(yaw*p180) * g_moveSpeed;
	}
	// The D (right)
	if(controlSet[68]){
		g_eyeX += Math.sin(yaw*p180) * g_moveSpeed;
		g_eyeZ -= Math.cos(yaw*p180) * g_moveSpeed;
>>>>>>> refs/remotes/origin/master
	}
	// The E (up)
	if(g_controlSet[69]){
		g_eyeY -= g_moveSpeed;
	}
	// The Q (down)
	if(g_controlSet[81]){
		g_eyeY += g_moveSpeed;
	}
	// The W (forward)
<<<<<<< HEAD
	if(g_controlSet[87]){
		g_eyeX -= Math.sin((90+degLR)*3.1416/180) * g_moveSpeed;
		g_eyeZ += Math.cos((90+degLR)*3.1416/180) * g_moveSpeed;
	}
	// The S (back)
	if(g_controlSet[83]){
		g_eyeX += Math.sin((90+degLR)*3.1416/180) * g_moveSpeed;
		g_eyeZ -= Math.cos((90+degLR)*3.1416/180) * g_moveSpeed;
=======
	if(controlSet[87]){
		g_eyeX += g_moveSpeed * Math.cos(yaw*p180) * Math.sin(pitch*p180)
		g_eyeY += g_moveSpeed * Math.cos(pitch*p180)
		g_eyeZ += g_moveSpeed * Math.sin(yaw*p180) * Math.sin(pitch*p180)
	}
	// The S (back)
	if(controlSet[83]){
		g_eyeX -= g_moveSpeed * Math.cos(yaw*p180) * Math.sin(pitch*p180)
		g_eyeY -= g_moveSpeed * Math.cos(pitch*p180)
		g_eyeZ -= g_moveSpeed * Math.sin(yaw*p180) * Math.sin(pitch*p180)
>>>>>>> refs/remotes/origin/master
	}

	g_centerX = g_eyeX + (10 * Math.cos(yaw*p180) * Math.sin(pitch*p180))
	g_centerY = g_eyeY + (10 * Math.cos(pitch*p180))
	g_centerZ = g_eyeZ + (10 * Math.sin(yaw*p180) * Math.sin(pitch*p180))
	
	g_vpMatrix.setPerspective(60.0, g_canvas.width / g_canvas.height, 1.0, 200.0);
	g_vpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ,	g_centerX, 	g_centerY, 	g_centerZ, 0.0, 1.0, 0.0);
	
	//Read the 3D Array
	for(var z = 0; z < size; z++)
	{
		for(var y = 0; y < size; y++)
		{
			for(var x = 0; x < size; x ++)
			{
				if(g_currStep[z][y][x] == 1)
				{
					drawCube(x, y, z);
				}
			}
		}
	}

	setStep(yaw);
	setPopulation(pitch);
	setEyePos(g_eyeX, g_eyeY, g_eyeZ);
	setRefPos(g_centerX, g_centerY, g_centerZ);
	
	if(highResTimestamp - g_lastUpdate > g_updateSpeed) {
		g_currStep = getGameStep();
		g_lastUpdate = highResTimestamp;
	}
}

function drawCube(x, y, z)
{
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, g_cubeBuffer);
	// Assign the buffer object to the attribute variable
	g_webGL.vertexAttribPointer(g_aPosition, g_cubeBuffer.num, g_cubeBuffer.type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	g_webGL.enableVertexAttribArray(g_aPosition);
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(g_vpMatrix);
	g_mvpMatrix.translate(x * 3, y * 3, z * 3);
	g_webGL.uniformMatrix4fv(g_uMVPMatrix, false, g_mvpMatrix.elements);
	
	// Draw
	g_webGL.drawElements(g_webGL.TRIANGLES, g_numIndices, g_webGL.UNSIGNED_BYTE, 0);
}