// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Instance of canvas
var g_canvas;
// Instance of HUD
var g_hud;
// Instance of WebGL context
var g_webGL;
// Instance of 2DCG
var g_2DCG;

// Draw locations
var g_currStep = [];
// Current step
var g_stepCounter;
// Population of current step
var g_population;
// Update step speed
var g_updateSpeed;
// Last update time
var g_lastUpdate;
// Game stopped boolean
var g_isStopped;

// Cube buffer that stores the vertices for the cube
var g_cubeBuffer = null;
// Number of indices for cube
var g_numIndices;
// Storage location of a_Position
var g_aPosition;
// Storage location of u_MMatrix
var g_uMMatrix;
// Storage location of u_MVPMatrix
var g_uMVPMatrix;
// Storage location of u_NormalMatrix
var g_uNormalMatrix;
// Storage location of u_LightColor
var g_uLightColor;
// Storage location of u_LightDirection
var g_uLightPosition;
// Storage location of u_AmbientLight
var g_uAmbientLight;
// Model transformation matrix
var g_modelMatrix = new Matrix4();
// Model-View transformation matrix
var g_vpMatrix = new Matrix4();
// Model-View-Project transformation matrix
var g_mvpMatrix = new Matrix4();
// Normal matrix
var g_normalMatrix = new Matrix4();
// Size of outline
var g_outlineSize;
// Origin of outline
var g_outlineOrigin;

// Control set
var g_controlSet = [];
// Movement speed
var g_moveSpeed = 0.5;
// Look speed
var g_lookSpeed = 1.5;
// Eye coordinates
var g_eyeX = 30.0, g_eyeY = 31.5, g_eyeZ = 60.0;
// Reference coordinates
var g_centerX = 0.0, g_centerY = 0.0, g_centerZ = 0.0;
// angle of the xz plane
var g_yaw = 90;
// angle of the yz plane
var g_pitch = -90;
// for multiplication, turning degrees into radians
var g_pi180 = Math.PI/180;
// Delta's for Look-At Calculation (spacebar controls)
var g_dX;
var g_dY;
var g_dZ;

// TEXTURE STUFF
var g_aTexCoord;
var g_uSampler;
var g_texture;
var g_SHIT;

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
				if(z == 10 || y == 10 || x == 10) { g_currStep[z][y][x] = 1; }
				else if(z == 9 || y == 9 || x == 9) { g_currStep[z][y][x] = 1; }
				else { g_currStep[z][y][x] = 1; }
			}
		}
	}
}

function drawInit()
{
	// Set up test cube array (comment out if using game)
	//testCubes();
	g_currStep = lifeBuffer[0].arr;
	g_isStopped = true;
	g_lastUpdate = 0;
	g_stepCounter = 0;
	
	// Retrieve <canvas> elements
	g_canvas = document.getElementById('myWebGLCanvas');
	g_hud = document.getElementById('myHUDCanvas');
	
	// Get the rendering context for WebGL
	//g_webGL = getWebGLContext(g_canvas);
	// Use this version for better performance (no debug errors)
	g_webGL = getWebGLContext(g_canvas, false);
	if (!g_webGL) {
		console.log('*** Error: Failed to get the rendering context for WebGL');
		return;
	}
	
	// Get the rendering context for 2DCG
	g_2DCG = g_hud.getContext('2d');
	
	// Retrieve vertex shader and fragment shader from HTML page
	getShader(g_webGL, 'shader-vs');
	getShader(g_webGL, 'shader-fs');
	
	// Initialize shaders
	if (!initShaders(g_webGL, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('*** Error: Failed to intialize shaders.');
		return;
	}
	
	// Specify the color for clearing <canvas>
	g_webGL.clearColor(23.0/255.0, 27.0/255.0, 31.0/255.0, 1.0);
	// Enable depth testing
	g_webGL.enable(g_webGL.DEPTH_TEST);
	// Turn on face culling
	g_webGL.enable(g_webGL.CULL_FACE);
	// Set to cull back faces
	g_webGL.cullFace(g_webGL.BACK);
	
	// Get the storage locations of attribute and uniform variables
	g_aPosition = g_webGL.getAttribLocation(g_webGL.program, 'a_Position');
	g_aTexCoord = g_webGL.getAttribLocation(g_webGL.program, 'a_TexCoord');
	g_uMMatrix = g_webGL.getUniformLocation(g_webGL.program, 'u_MMatrix');
	g_uMVPMatrix = g_webGL.getUniformLocation(g_webGL.program, 'u_MVPMatrix');
	g_uNormalMatrix = g_webGL.getUniformLocation(g_webGL.program, 'u_NormalMatrix');
	g_uLightColor = g_webGL.getUniformLocation(g_webGL.program, 'u_LightColor');
	g_uLightPosition = g_webGL.getUniformLocation(g_webGL.program, 'u_LightPosition');
	g_uAmbientLight = g_webGL.getUniformLocation(g_webGL.program, 'u_AmbientLight');
	g_uSampler = g_webGL.getUniformLocation(g_webGL.program, 'u_Sampler');
	
	if (g_aPosition < 0 || g_aTexCoord < 0 || !g_uMMatrix || !g_uMVPMatrix || !g_uNormalMatrix || !g_uLightColor || !g_uLightPosition || !g_uAmbientLight || !g_uSampler) {
		console.log('*** Error: Failed to get the storage location of attribute or uniform variable');
		return;
	}
	
	// Set vertex information
	g_numIndices = initVertexBuffers(g_webGL);
	if (g_numIndices < 0) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	g_texture = initTextures(g_webGL);
	if (!g_texture) {
		console.log('Failed to intialize the texture.');
		return;
	}
	
	// Set sizes of outline representing game area
	g_outlineSize = size * 3.0 / 2.0; 
	g_outlineOrigin = g_outlineSize - 1.5;
	
	// Set point light color
	g_webGL.uniform3f(g_uLightColor, 1.0, 1.0, 1.0);
	
	// Set amount and color of ambient light
	g_webGL.uniform3f(g_uAmbientLight, 0.3, 0.3, 0.3);
	
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

function initTextures(g_webGL) {
	var texture = g_webGL.createTexture();   // Create a texture object
	if (!texture) {
		console.log('Failed to create the texture object');
		return null;
	}
	
	var image = new Image();  // Create a image object
	if (!image) {
		console.log('Failed to create the image object');
		return null;
	}
	// Register the event handler to be called when image loading is completed
	image.onload = function() {
		// Write the image data to texture object
		g_webGL.pixelStorei(g_webGL.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
		g_webGL.activeTexture(g_webGL.TEXTURE0);
		g_webGL.bindTexture(g_webGL.TEXTURE_2D, texture);
		g_webGL.texParameteri(g_webGL.TEXTURE_2D, g_webGL.TEXTURE_MIN_FILTER, g_webGL.LINEAR);
		g_webGL.texImage2D(g_webGL.TEXTURE_2D, 0, g_webGL.RGBA, g_webGL.RGBA, g_webGL.UNSIGNED_BYTE, image);
	
		// Pass the texure unit 0 to u_Sampler
		g_webGL.useProgram(g_webGL.program);
		g_webGL.uniform1i(g_uSampler, 0);
	
		g_webGL.bindTexture(g_webGL.TEXTURE_2D, null); // Unbind texture
	};
	
	// Tell the browser to load an Image
	image.src = 'textures/bCube.png';
	
	return texture;
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
	
	var cubeVertices = new Float32Array([   // Vertex coordinates
		1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
		1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
		-1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
		-1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
		1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
	]);
	
	/*
	var cubeColors = new Float32Array([    // Colors
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8,     // v0-v1-v2-v3 front
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8,     // v0-v3-v4-v5 right
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8,     // v0-v5-v6-v1 up
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8,     // v1-v6-v7-v2 left
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8,     // v7-v4-v3-v2 down
		0.8, 0.8, 0.8,   0.8, 0.8, 0.8,   0.8, 0.8, 0.8,  0.8, 0.8, 0.8　    // v4-v7-v6-v5 back
 	]);
	*/
	
	
	var cubeColors = new Float32Array([     // Colors
		0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
		0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
		1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
		1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
		0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  0.2, 0.3, 0.4,  // v7-v4-v3-v2 down
		0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
	]);
	
	
	var cubeNormals = new Float32Array([    // Normal
		0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
		0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
		0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
		0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
	]);
	
	var texCoords = new Float32Array([   // Texture coordinates
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
		0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
		1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
	]);
	
	var cubeIndices = new Uint8Array([       // Indices of the vertices
		0, 1, 2,   0, 2, 3,    // front
		4, 5, 6,   4, 6, 7,    // right
		8, 9,10,   8,10,11,    // up
		12,13,14,  12,14,15,    // left
		16,17,18,  16,18,19,    // down
		20,21,22,  20,22,23     // back
	]);
	
	// Write coords to buffers, but don't assign to attribute variables
	g_cubeBuffer = initArrayBufferForLaterUse(g_webGL, cubeVertices, 3, g_webGL.FLOAT);
	
	if (!initArrayBuffer(g_webGL, 'a_Color', cubeColors, 3, g_webGL.FLOAT)) { return -1; }
	if (!initArrayBuffer(g_webGL, 'a_Normal', cubeNormals, 3, g_webGL.FLOAT)) { return -1; }
	if (!initArrayBuffer(g_webGL, 'a_TexCoord', texCoords, 2, g_webGL.FLOAT)) { return -1; }
	
	// Bind texture object to texture unit 0
	
	// Write the indices to the buffer object
	var indexBuffer = g_webGL.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}
	
	// Write the indices to the buffer object
	g_webGL.bindBuffer(g_webGL.ELEMENT_ARRAY_BUFFER, indexBuffer);
	g_webGL.bufferData(g_webGL.ELEMENT_ARRAY_BUFFER, cubeIndices, g_webGL.STATIC_DRAW);
	
	return cubeIndices.length;
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

function keyDown(ev){ g_controlSet[ev.keyCode] = 1; }

function keyUp(ev){ g_controlSet[ev.keyCode] = 0; }

function moveCamera(){

	// The A Key: Strafe Left (Perpendicular of up vector)
	if(g_controlSet[65]){
		g_eyeX -= Math.sin(g_yaw*g_pi180) * g_moveSpeed;
		g_eyeZ += Math.cos(g_yaw*g_pi180) * g_moveSpeed;
	}
	// The D: Strafe Right (Perpendicular of up vector)
	if(g_controlSet[68]){
		g_eyeX += Math.sin(g_yaw*g_pi180) * g_moveSpeed;
		g_eyeZ -= Math.cos(g_yaw*g_pi180) * g_moveSpeed;
	}
	// The E: Descend (Down the Y Axis)
	if(g_controlSet[69]){
		g_eyeY -= g_moveSpeed;
	}
	// The Q: Ascend (Up the Y Axis)
	if(g_controlSet[81]){
		g_eyeY += g_moveSpeed;
	}
	// The W: Move Towards Look-At
	if(g_controlSet[87]){
		g_eyeX += g_moveSpeed * Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
		g_eyeY += g_moveSpeed * Math.cos(g_pitch*g_pi180);
		g_eyeZ += g_moveSpeed * Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
	}
	// The S: Move Away From Look-At
	if(g_controlSet[83]){
		g_eyeX -= g_moveSpeed * Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
		g_eyeY -= g_moveSpeed * Math.cos(g_pitch*g_pi180);
		g_eyeZ -= g_moveSpeed * Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
	}

	// The Space Bar: Lock on to Center of Cube Array
	if(g_controlSet[32]){
		//Delta's of eye(x,y,z) and origin(x,y,z)
		g_dX = g_eyeX-g_outlineOrigin;
		g_dY = g_eyeY-g_outlineOrigin;
		g_dZ = g_eyeZ-g_outlineOrigin;
		//Verticle angle, rotate around XZ plane
		g_pitch = -Math.atan2(g_dY, Math.sqrt(g_dZ*g_dZ + g_dX*g_dX))/g_pi180 - 90.0;
		//Horizontal angle, rotate around Y axis
		g_yaw = Math.atan2(g_dZ, g_dX)/g_pi180;
	}
	else{
		// The Left Arrow: Look Left
		if(g_controlSet[37]){
			g_yaw -= g_lookSpeed;
		}	
		// The Right Arrow: Look Right
		if(g_controlSet[39]){
			g_yaw += g_lookSpeed;
		}	
		// The Up Arrow: Look Up
		if(g_controlSet[38]){
			if(g_pitch + g_lookSpeed <= -10){
				g_pitch += g_lookSpeed;
			}
		}	
		// The Down Arrow: Look Down
		if(g_controlSet[40]){
			if(g_pitch - g_lookSpeed >= -176){
				g_pitch -= g_lookSpeed;
			}
		}	
	}

	//Set the Look-At Point
	//Based on pitch and yaw
	//Radius of 1 from the Eye-Point
	g_centerX = g_eyeX + (Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180));
	g_centerY = g_eyeY + (Math.cos(g_pitch*g_pi180));
	g_centerZ = g_eyeZ + (Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180));
	
}

function draw(highResTimestamp) {
	requestAnimationFrame(draw);
	
	g_webGL.activeTexture(g_webGL.TEXTURE0);
	g_webGL.bindTexture(g_webGL.TEXTURE_2D, g_texture);
	
	moveCamera();
	
	// Clear color and depth buffer
	g_webGL.clear(g_webGL.COLOR_BUFFER_BIT | g_webGL.DEPTH_BUFFER_BIT);
	
	g_webGL.uniform3f(g_uLightPosition, g_eyeX, g_eyeY, g_eyeZ)

	g_vpMatrix.setPerspective(70.0, g_canvas.width / g_canvas.height, 1.0, 200.0);
	g_vpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, g_centerX, g_centerY, g_centerZ, 0.0, 1.0, 0.0);
	
	//drawLargeCubeOutline();
	
	g_population = 0;
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
					g_population++;
				}
			}
		}
	}

	drawHUD();

	if(!g_isStopped && highResTimestamp - g_lastUpdate > g_updateSpeed) {
		g_currStep = getGameStep();
		g_lastUpdate = highResTimestamp;
		g_stepCounter++;
	}
}

function drawCube(x, y, z)
{
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, g_cubeBuffer);
	// Assign the buffer object to the attribute variable
	g_webGL.vertexAttribPointer(g_aPosition, g_cubeBuffer.num, g_cubeBuffer.type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	g_webGL.enableVertexAttribArray(g_aPosition);
	
	g_modelMatrix.setTranslate(x * 3, y * 3, z * 3);
	g_webGL.uniformMatrix4fv(g_uMMatrix, false, g_modelMatrix.elements);
	
	// Calculate the model view project matrix and pass it to g_uMVPMatrix
	g_mvpMatrix.set(g_vpMatrix);
	g_mvpMatrix.multiply(g_modelMatrix);
	g_webGL.uniformMatrix4fv(g_uMVPMatrix, false, g_mvpMatrix.elements);
	// Calculate matrix for normal and pass it to g_uNormalMatrix
	g_normalMatrix.setInverseOf(g_modelMatrix);
	g_normalMatrix.transpose();
	g_webGL.uniformMatrix4fv(g_uNormalMatrix, false, g_normalMatrix.elements);
	
	// Draw
	g_webGL.drawElements(g_webGL.TRIANGLES, g_numIndices, g_webGL.UNSIGNED_BYTE, 0);
}

function drawLargeCubeOutline()
{
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, g_cubeBuffer);
	// Assign the buffer object to the attribute variable
	g_webGL.vertexAttribPointer(g_aPosition, g_cubeBuffer.num, g_cubeBuffer.type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	g_webGL.enableVertexAttribArray(g_aPosition);
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(g_vpMatrix);
	g_mvpMatrix.translate(g_outlineOrigin, g_outlineOrigin, g_outlineOrigin);
	g_mvpMatrix.scale(g_outlineSize, g_outlineSize, g_outlineSize);
	g_webGL.uniformMatrix4fv(g_uMVPMatrix, false, g_mvpMatrix.elements);
	
	// Draw
	g_webGL.drawElements(g_webGL.LINES, g_numIndices, g_webGL.UNSIGNED_BYTE, 0);
}

function drawHUD(pop)
{
	// Drawing HUD to screen
	g_2DCG.clearRect(0, 0, g_hud.width, g_hud.height);
	g_2DCG.font = '14px "Lucida Console"'
	g_2DCG.fillStyle = 'rgba(255, 255, 255, 1)';
	g_2DCG.fillText('Current Step: ' + g_stepCounter, 3, 15);
	g_2DCG.fillText('Population: ' + g_population, 3, 35);
	g_2DCG.fillText('Camera Coords: (' + g_eyeX.toFixed(1) + ', ' + g_eyeY.toFixed(1) + ', ' + g_eyeZ.toFixed(1) + ')', 3, 575);
	g_2DCG.fillText('Look At Coords: (' + g_centerX.toFixed(1) + ', ' + g_centerY.toFixed(1) + ', ' + g_centerZ.toFixed(1) + ')', 3, 595);
}