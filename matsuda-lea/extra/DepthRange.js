// HelloTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_Color;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  function draw() {
    var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.uniform4f(u_Color, 1,1, 0 , 1);
    gl.depthRange(g_yellow,g_yellow+0.01);  
    gl.drawArrays(gl.TRIANGLES, 0, n);
    gl.uniform4f(u_Color, 1,0, 1 , 1);
    gl.depthRange(g_purple,g_purple+0.01);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    coords.innerHTML='yellow = ' + g_yellow + ' purple= ' + g_purple;
  }

  g_yellow = 0.1;
  g_purple= 0.5;
  
  function keydown(ev) {
    switch(ev.keyCode){
    case 39: g_purple += .1; break;  // The right arrow key was pressed
    case 37: g_purple -= .1; break;  // The left arrow key was pressed
    case 38: g_yellow += .1;  break;  // The up arrow key was pressed
    case 40: g_yellow -= .1;  break;  // The down arrow key was pressed
    default: return; // Prevent the unnecessary drawing
    }
    draw();
  }

  document.onkeydown=keydown;
  draw();
 
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    0, 0.5, 0,   -0.5, -0.5, 0,   0.5, -0.5, 0.
  ]);
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}
