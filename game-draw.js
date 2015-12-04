// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Draw locations
var g_currStep = [];
// Cube buffer that stores the vertices for the cube
var g_cubeBuffer = null;
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();
// Movement speed
var g_moveSpeed = 0.1;
// Eye coordinates
var g_eyeX = 4.0, g_eyeY = 12.0, g_eyeZ = 25.00;
// Reference coordinates
var g_centerX = 6.0, g_centerY = 3.0, g_centerZ = 3.0;

//TEST GLOBAL VARS AND STUFF
var g_gl = null;
var g_n = null;
var g_VPMatrix = null;
var g_a_Position = null;
var g_u_MVPMatrix = null;

var isAlreadyUpdating = false;
var isDrawing = false;

var size = 5;

function drawInit(currStep)
{
	g_currStep = currStep;
	
	/*
	for(var z = 0; z < size; z++)
	{
		g_currStep[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			g_currStep[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				//if(z == 2 || y == 2 || x == 2)
				//{
				//	g_currStep[z][y][x] = 1;
				//}
				//else
				//{
				//	g_currStep[z][y][x] = 0;
				//}
				//g_currStep[z][y][x] = 0;
			}
		}
	}*/
	
	console.log(g_currStep);
	
	// Retrieve <canvas> element
	var canvas = document.getElementById('myWebGLCanvas');
	
	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
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
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	// Specify the color for clearing <canvas> and enable depth testing
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Get the storage locations of attribute and uniform variables
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	var u_MVPMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
	if (a_Position < 0 || !u_MVPMatrix) {
		console.log('*** Error: Failed to get the storage location of attribute or uniform variable');
		return;
	}
	
	// Calculate the view projection matrix
	var VPMatrix = new Matrix4();
	
	// Register the event handler to be called on key press
	document.onkeydown = function(ev){ keyDown(ev, gl, n, VPMatrix, a_Position, u_MVPMatrix); };
	
	g_gl = gl;
	g_n = n;
	g_VPMatrix = VPMatrix;
	g_a_Position = a_Position;
	g_u_MVPMatrix = u_MVPMatrix;
	
	draw(gl, n, VPMatrix, a_Position, u_MVPMatrix); // Draw
}

function getShader(gl, scriptId)
{
	// Retrieve shader by HTML ID
	var shaderScript = document.getElementById(scriptId);
    if (!shaderScript) {
        console.log('*** Error: unknown script element ' + scriptId);
    }
	
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
		1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
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

function keyDown(ev, gl, n, VPMatrix, a_Position, u_MVPMatrix)
{
	if(ev.keyCode == 37) { g_centerX -= g_moveSpeed; } // The right arrow key was pressed
	if(ev.keyCode == 38) { g_centerY += g_moveSpeed; } // The up arrow key was pressed
	if(ev.keyCode == 39) { g_centerX += g_moveSpeed; } // The left arrow key was pressed
	if(ev.keyCode == 40) { g_centerY -= g_moveSpeed; } // The down arrow key was pressed
	if(ev.keyCode == 65) { g_eyeX -= g_moveSpeed; } // The A key was pressed
	if(ev.keyCode == 68) { g_eyeX += g_moveSpeed; } // The D key was pressed
	if(ev.keyCode == 69) { g_eyeY -= g_moveSpeed; } // The E key was pressed
	if(ev.keyCode == 81) { g_eyeY += g_moveSpeed; } // The Q key was pressed
	if(ev.keyCode == 83) { g_eyeZ -= g_moveSpeed; } // The S key was pressed
	if(ev.keyCode == 87) { g_eyeZ += g_moveSpeed; } // The W key was pressed
    
	draw(gl, n, VPMatrix, a_Position, u_MVPMatrix); // <===== MUST BE MOVED
}

function draw(gl, n, VPMatrix, a_Position, u_MVPMatrix) {
	isDrawing = true;
	
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	VPMatrix.setPerspective(60.0, 600 / 400, 1.0, 100.0);
	VPMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, g_centerX, g_centerY, g_centerZ, 0.0, 1.0, 0.0);
	
	for(var z = 0; z < size; z++)
	{
		for(var y = 0; y < size; y++)
		{
			for(var x = 0; x < size; x ++)
			{
				if(g_currStep[z][y][x] == 1)
				{
					g_modelMatrix.setTranslate(x * 3, y * 3, z * 3);
					drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
				}
			}
		}
	}
	
	/*
	g_modelMatrix.setTranslate(0.0, 0.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(3.0, 0.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(6.0, 0.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(0.0, 3.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(-3.0, 0.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(0.0, -3.0, 0.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(0.0, 0.0, 3.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	
	g_modelMatrix.setTranslate(0.0, 0.0, -3.0);
	g_modelMatrix.translate(0.0, 0.0, 0.0);
	g_modelMatrix.rotate(0.0, 1.0, 0.0, 0.0);
    drawCube(gl, n, g_cubeBuffer, VPMatrix, a_Position, u_MVPMatrix);
	*/
	
	setEyePos(g_eyeX, g_eyeY, g_eyeZ);
	setRefPos(g_centerX, g_centerY, g_centerZ);
	
	if(!isAlreadyUpdating)
	{
		isAlreadyUpdating = true;
		setTimeout(generateNextStep, 2000);
	}
	
	isDrawing = false;
}

function drawCube(gl, n, buffer, VPMatrix, a_Position, u_MVPMatrix)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// Assign the buffer object to the attribute variable
	gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_Position);
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(VPMatrix);
	g_mvpMatrix.multiply(g_modelMatrix);
	gl.uniformMatrix4fv(u_MVPMatrix, false, g_mvpMatrix.elements);
	
	// Draw
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function canDraw()
{
	return !isDrawing;
}

function drawNonCamUpdate(currStep)
{
	g_currStep = currStep;
	isAlreadyUpdating = false;
	draw(g_gl, g_n, g_VPMatrix, g_a_Position, g_u_MVPMatrix);
}