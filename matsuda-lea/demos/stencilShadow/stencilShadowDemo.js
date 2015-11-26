/**
 * WebGL stencil shadow demo
 *
 * Copyright:
 * Arno van der Vegt, 2011  
 *
 * Contact:
 * legoasimo@gmail.com
 *
 * Licence:  
 * Creative Commons Attribution/Share-Alike license
 * http://creativecommons.org/licenses/by-sa/3.0/
 *
 * The WebGL setup code was provided by: http://learningwebgl.com
**/

var gl;
var shaderProgram;
var mvMatrix      = mat4.create();
var mvMatrixStack = [];
var pMatrix       = mat4.create();
var pMatrixStack  = [];

function initGL(canvas) {
    var names = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
    for (var i = 0; i < names.length; ++i) {
        try {
            gl = canvas.getContext(names[i], {stencil: true});
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;            
        }
        catch (e) {
        }
        if (gl) {
            break;
        }
    }

    if (!gl) {
        alert('Could not initialise WebGL, sorry :-(');
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var shader,
        str = '',
        k   = shaderScript.firstChild;

    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, 'shader-fs');
    var vertexShader = getShader(gl, 'shader-vs');

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Could not initialise shaders');
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform          = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    shaderProgram.mvMatrixUniform         = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
    shaderProgram.nMatrixUniform          = gl.getUniformLocation(shaderProgram, 'uNMatrix');
    shaderProgram.samplerUniform          = gl.getUniformLocation(shaderProgram, 'uSampler');

    shaderProgram.useLightingUniform      = gl.getUniformLocation(shaderProgram, 'uUseLighting');
    shaderProgram.useColorUniform         = gl.getUniformLocation(shaderProgram, 'uUseColor');

    shaderProgram.alphaUniform            = gl.getUniformLocation(shaderProgram, 'uAlpha');
    shaderProgram.ambientColorUniform     = gl.getUniformLocation(shaderProgram, 'uAmbientColor');
    shaderProgram.lightingLocationUniform = gl.getUniformLocation(shaderProgram, 'uLightingLocation');
    shaderProgram.lightingColorUniform    = gl.getUniformLocation(shaderProgram, 'uLightingColor');
}

function createTexture(color1, color2) {
    var canvas  = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        texture;

    canvas.width      = 128;
    canvas.height     = 128;

    context.fillStyle = color1;
    context.fillRect(0, 0, 128, 128);

    context.fillStyle = color2;
    context.fillRect( 0,  0, 64, 64);
    context.fillRect(64, 64, 64, 64);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length === 0) {
        throw 'Invalid popMatrix!';
    }
    mvMatrix = mvMatrixStack.pop();
}

function pPushMatrix() {
    var copy = mat4.create();
    mat4.set(pMatrix, copy);
    pMatrixStack.push(copy);
}

function pPopMatrix() {
    if (pMatrixStack.length === 0) {
        throw 'Invalid popMatrix!';
    }
    pMatrix = pMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function createObject(texture) {
    var that = function() {};

    /**
     * Initialize data...
    **/
    that.init = function(texture) {
        this.texture              =  texture;

        this.glVertexCount        = -1;    // The active vertex index
        this.glVertices           =  [];   // Vertex position list for gl
        this.glNormals            =  [];   // Normal list for gl
        this.glIndices            =  [];   // Index list for gl
        this.glTextureCoords      =  [];   // Texture cooordinate list for gl

        this.glPositionBuffer     =  null; // Position buffer for gl
        this.glNormalBuffer       =  null; // Normal buffer for gl
        this.glTextureCoordBuffer =  null; // Texture cooordinate buffer for gl
        this.glVertexIndexBuffer  =  null; // Vertex buffer for gl

        this.vertices             =  [];   // List of unique vertices of the object
        this.verticesHash         =  {};   // Hash list of vertices

        this.lines                =  [];   // List of lines in both directions...
        this.linesUnique          =  [];   // A list of unique lines

        this.triangles            =  [];   // Triangles in the object
    };

    /**
     * Add a vertex, merge close vertices...
     * Returns the vertex index
    **/
    that.addVextex = function(x, y, z) {
        var hash  = ~~(x * 1000) + '_' + ~~(y * 1000) + '_' + ~~(z * 1000),
            index = this.verticesHash[hash]; // Check if the value was added before...

        if (index === undefined) { // A new vertex...
            index                   = this.vertices.length;
            this.verticesHash[hash] = index;
            vertex                  = [x, y, z];
            this.vertices.push(vertex);
        }

        return index;
    };

    /**
     * Add position and texture cooordinates to the gl lists...
     * Returns the index of the vertex
    **/
    that.addGLVertex = function(x, y, z, u, v) {
        this.glVertices.push(x);
        this.glVertices.push(y);
        this.glVertices.push(z);

        this.glTextureCoords.push(u);
        this.glTextureCoords.push(v);

        this.glVertexCount++;
        return this.glVertexCount;
    };

    /**
     * Add a normal to a gl list...
    **/
    that.addNormal = function(normal) {
        this.glNormals.push(normal[0]);
        this.glNormals.push(normal[1]);
        this.glNormals.push(normal[2]);
    };

    /**
     * Add a line.
     * Check if the line is also used by an other polygon.
     & Returns the index of the line.
    **/
    that.addLine = function(v1, v2) {
        this.lines.push({v1:v1, v2:v2});

        return this.lines.length - 1;
    };

    /**
     * Add a triangle to this object...
     *
     * This method adds the vertex information to
     * the buffers needed the build the shadow.
    **/
    that.addTriangle = function(x1, y1, z1, uu1, vv1,
                                x2, y2, z2, uu2, vv2,
                                x3, y3, z3, uu3, vv3) {
        var vertex1, vertex2, vertex3,
            line1, line2, line3,
            vector1, vector2, vector3,
            triangleCount = this.triangles.length, // The index of the new triangle...
            center;

        // Add the vertices...
        vertex1 = this.addVextex(x1, y1, z1);
        vertex2 = this.addVextex(x2, y2, z2);
        vertex3 = this.addVextex(x3, y3, z3);

        // Add the lines, these are used to calculate the edge of the object...
        // Each line is associated with the new triangle...
        line1   = this.addLine(vertex1, vertex2);
        line2   = this.addLine(vertex2, vertex3);
        line3   = this.addLine(vertex3, vertex1);

        // Calculate the normal of the triangle...
        vector1 = vec3.create([x2 - x1, y2 - y1, z2 - z1]);
        vector2 = vec3.create([x3 - x2, y3 - y2, z3 - z2]);
        vector3 = vec3.normalize(vec3.cross(vector1, vector2));

        // Add normals for 3 vertices...
        this.addNormal(vector3);
        this.addNormal(vector3);
        this.addNormal(vector3);

        // Add the vertex cooordinates and texture info and store the index values...
        this.glIndices.push(this.addGLVertex(x1, y1, z1, uu1, vv1));
        this.glIndices.push(this.addGLVertex(x2, y2, z2, uu2, vv2));
        this.glIndices.push(this.addGLVertex(x3, y3, z3, uu3, vv3));

        // Add a new triangle...
        // The center is needed to caculate the direction
        // of the triangle to the light source.
        this.triangles.push({vertices : [vertex1, vertex2, vertex3],
                             lines    : [line1, line2, line3],
                             normal   : vector3,
                             center   : [(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3, (z1 + z2 + z3) / 3],
                             visible  : false});
    };

    /**
     * Create gl buffers for the object...
    **/
    that.createBuffers = function() {
        this.glPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.glVertices), gl.STATIC_DRAW);
        this.glPositionBuffer.itemSize = 3;

        this.glVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.glIndices), gl.STATIC_DRAW);
        this.glVertexIndexBuffer.itemSize = 1;
        this.glVertexIndexBuffer.numItems = this.glIndices.length;

        this.glTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.glTextureCoords), gl.STATIC_DRAW);
        this.glTextureCoordBuffer.itemSize = 2;

        this.glNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.glNormals), gl.STATIC_DRAW);
        this.glNormalBuffer.itemSize = 3;
    };

    /**
     * Render the object...
    **/
    that.render = function() {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Disable the color attribute, not needed because the object has a texture...
        gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
        
        // Set the vertex position buffer...
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.glPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // Enable the normal attribute and set the buffer...
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.glNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // Enable the texture coord attribute and set the buffer...
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.glTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // Set the texture...
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        // Don't use the color attribute...
        gl.uniform1i(shaderProgram.useColorUniform, 0);

        // Set the index, render the triangles...
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, this.glVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    };

    that.init(texture);

    return that;
}

function createCube(sizeX, sizeY, sizeZ, texture) {
    var that = createObject(texture);

    that.createObject = function(sizeX, sizeY, sizeZ) {
        this.addTriangle(-sizeX, -sizeY,  sizeZ, 0,0,  sizeX, -sizeY,  sizeZ, 1,0,  sizeX,  sizeY,  sizeZ,  1,1);
        this.addTriangle(-sizeX, -sizeY,  sizeZ, 0,0,  sizeX,  sizeY,  sizeZ, 1,1, -sizeX,  sizeY,  sizeZ,  0,1);

        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0, -sizeX,  sizeY, -sizeZ, 0,0,  sizeX,  sizeY, -sizeZ,  0,1);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0,  sizeX,  sizeY, -sizeZ, 0,1,  sizeX, -sizeY, -sizeZ,  1,1);

        this.addTriangle(-sizeX,  sizeY, -sizeZ, 0,0, -sizeX,  sizeY,  sizeZ, 1,0,  sizeX,  sizeY,  sizeZ,  1,1);
        this.addTriangle(-sizeX,  sizeY, -sizeZ, 0,0,  sizeX,  sizeY,  sizeZ, 1,1,  sizeX,  sizeY, -sizeZ,  0,1);

        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0,  sizeX, -sizeY, -sizeZ, 0,0,  sizeX, -sizeY,  sizeZ,  0,1);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0,  sizeX, -sizeY,  sizeZ, 0,1, -sizeX, -sizeY,  sizeZ,  1,1);

        this.addTriangle( sizeX, -sizeY, -sizeZ, 0,0,  sizeX,  sizeY, -sizeZ, 1,0,  sizeX,  sizeY,  sizeZ,  1,1);
        this.addTriangle( sizeX, -sizeY, -sizeZ, 0,0,  sizeX,  sizeY,  sizeZ, 1,1,  sizeX, -sizeY,  sizeZ,  0,1);

        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0, -sizeX, -sizeY,  sizeZ, 0,0, -sizeX,  sizeY,  sizeZ,  0,1);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 1,0, -sizeX,  sizeY,  sizeZ, 0,1, -sizeX,  sizeY, -sizeZ,  1,1);

        this.createBuffers();
    };

    that.createObject(sizeX, sizeY, sizeZ);

    return that;
}

function createPyramid(sizeX, sizeY, sizeZ, texture) {
    var that = createObject(texture);

    that.createObject = function(sizeX, sizeY, sizeZ) {
        this.addTriangle(-sizeX, -sizeY,  sizeZ, 1.0,0.0,  sizeX, -sizeY,  sizeZ, 0.0,0.0,  0,      sizeY,  0,      0.5,1.0);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 0.0,0.0,  0,      sizeY,  0,     0.5,1.0,  sizeX, -sizeY, -sizeZ,  1.0,0.0);

        this.addTriangle(-sizeX, -sizeY, -sizeZ, 0.0,0.0,  sizeX, -sizeY, -sizeZ, 1.0,0.0,  sizeX, -sizeY,  sizeZ,  1.0,1.0);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 0.0,0.0,  sizeX, -sizeY,  sizeZ, 1.0,1.0, -sizeX, -sizeY,  sizeZ,  0.0,1.0);

        this.addTriangle( sizeX, -sizeY, -sizeZ, 1.0,0.0,  0,      sizeY,  0,     0.5,1.0,  sizeX, -sizeY,  sizeZ,  0.0,0.0);
        this.addTriangle(-sizeX, -sizeY, -sizeZ, 0.0,0.0, -sizeX, -sizeY,  sizeZ, 1.0,0.0,  0,      sizeY,  0,      0.5,1.0);

        this.createBuffers();
    };

    that.createObject(sizeX, sizeY, sizeZ);

    return that;
}

function createStar(sizeX, sizeY, sizeZ, texture) {
    var that = createObject(texture);

    that.createObject = function(sizeX, sizeY, sizeZ) {
        var step  = degToRad(360 / 5),
            start = degToRad(360 / 10),
            x1, y1,
            x2, y2,
            x3, y3;
            
        for (i = 0; i < 5; i++) {
            x1 = Math.sin(start +  i        * step) * sizeX * 0.5;
            y1 = Math.cos(start +  i        * step) * sizeY * 0.5;
            x2 = Math.sin(start + (i + 1)   * step) * sizeX * 0.5;
            y2 = Math.cos(start + (i + 1)   * step) * sizeY * 0.5;
            x3 = Math.sin(start + (i + 0.5) * step) * sizeX;
            y3 = Math.cos(start + (i + 0.5) * step) * sizeY;

            u1 = (x1 + sizeX) / (sizeX * 2);
            v1 = (y1 + sizeY) / (sizeY * 2);
            u2 = (x2 + sizeX) / (sizeX * 2);
            v2 = (y2 + sizeY) / (sizeY * 2);
            u3 = (x3 + sizeX) / (sizeX * 2);
            v3 = (y3 + sizeY) / (sizeY * 2);
            
            this.addTriangle(x1, y1, -sizeZ,   u1,v1,
                             x2, y2, -sizeZ,   u2,v2,
                             0,  0,  -sizeZ,   u3,v3);
            this.addTriangle(x2, y2, -sizeZ,   u2,v2,
                             x1, y1, -sizeZ,   u1,v1,
                             x3, y3,  0,       u3,v3);
            
            this.addTriangle(x2, y2,  sizeZ,   u2,v2,
                             x1, y1,  sizeZ,   u1,v1,
                             0,  0,   sizeZ,   0.5,0.5);
            this.addTriangle(x1, y1,  sizeZ,   u1,v1,
                             x2, y2,  sizeZ,   u2,v2,
                             x3, y3,  0,       u3,v3);
                             
            this.addTriangle(x1, y1, -sizeZ,   u1,v1,
                             x1, y1,  sizeZ,   u1,v1,
                             x3, y3,  0,       u3,v3);
            this.addTriangle(x2, y2,  sizeZ,   u2,v2,
                             x2, y2, -sizeZ,   u2,v2,
                             x3, y3,  0,       u3,v3);
        }

        this.createBuffers();
    };

    that.createObject(sizeX, sizeY, sizeZ);

    return that;
}

function createShadowBuilder(item) {
    var that = function() {};

    that.init = function(item) {
        this.item                = item;
        this.glPositionBuffer    = null;
        this.glVertexIndexBuffer = null;
    };

    that.setupData = function() {
        if (this.glPositionBuffer !== null) {
            gl.deleteBuffer(this.glPositionBuffer);
        }
        if (this.glVertexIndexBuffer !== null) {
            gl.deleteBuffer(this.glVertexIndexBuffer);
        }

        this.glVertices = [];
        this.glIndices  = [];
    };

    that.addGLVertex = function(vector) {
        this.glVertices.push(vector[0]);
        this.glVertices.push(vector[1]);
        this.glVertices.push(vector[2]);
        this.glIndices.push(this.glIndices.length);
    };

    that.addShadowSide = function(vector1, vector2, vector3, vector4) {
        this.addGLVertex(vector1);
        this.addGLVertex(vector2);
        this.addGLVertex(vector3);

        this.addGLVertex(vector4);
        this.addGLVertex(vector3);
        this.addGLVertex(vector2);
    };

    /**
     * Check which triangles face the light source...
    **/
    that.checkDirection = function(lightLocation) {
        var triangles = this.item.triangles,
            triangle,
            vector,
            i         = triangles.length;

        while (i) {
            i--;

            // Create a normalized vector based on the vector from
            // the center of the triangle to the lights position...
            triangle         = triangles[i];
            vector           = vec3.create(triangle.center);
            vector           = vec3.normalize(vec3.subtract(vector, lightLocation));

            // Compare the vector with the normal of the triangle...
            triangle.visible = (vec3.dot(vector, triangle.normal) < 0);
        }
    }

    /**
     * Find the edge of the object...
    **/
    that.findEdge = function() {
        var triangles     = this.item.triangles,
            triangle,
            a, b,
            lines         = this.item.lines,
            line,
            lineSidesHash = {},
            i, j, k;

        this.lineSides = [];

        i = triangles.length;
        while (i) {
            i--;
            
            triangle = triangles[i];
            if (triangle.visible) {
                j = 3;
                while (j) {
                    j--;
                    
                    // Check if the side...
                    k    = triangle.lines[j];
                    line = lines[k];
                    a    = line.v1 + '_' + line.v2;
                    b    = line.v2 + '_' + line.v1;
                    
                    if (lineSidesHash[a] !== undefined) { // Check the v1 -> v2 direction...
                        // The side already exists, remove it...
                        delete(lineSidesHash[a]);
                    }
                    else if (lineSidesHash[b] !== undefined) { // Check the v2 -> v1 direction...
                        // The side already exists, remove it...
                        delete(lineSidesHash[b]);
                    }
                    else {
                        // It's a new side, add it to the list...
                        lineSidesHash[a] = k;
                    }
                }
            }
        }

        // Convert the hash map to an array...
        for (i in lineSidesHash) {
            line = lines[lineSidesHash[i]];
            this.lineSides.push(line);
        }
    };

    that.rotateVectorX = function(vector, angle) {
        var x, y,
            sin, cos;
        
        if (angle === 0) {
            return;
        }
        
        y         = vector[1];
        z         = vector[2];
        sin       = Math.sin(angle);
        cos       = Math.cos(angle);
        vector[1] = y * cos - z * sin;
        vector[2] = y * sin + z * cos;
    };
    
    that.rotateVectorY = function(vector, angle) {
        var x, z,
            sin, cos;
        
        if (angle === 0) {
            return;
        }
        
        x         = vector[0];
        z         = vector[2];
        sin       = Math.sin(angle);
        cos       = Math.cos(angle);
        vector[0] = z * sin + x * cos;
        vector[2] = z * cos - x * sin;
    };
    
    that.rotateVectorZ = function(vector, angle) {
        var x, y,
            sin, cos;
        
        if (angle === 0) {
            return;
        }
        
        x         = vector[0];
        y         = vector[1];            
        sin       = Math.sin(angle);
        cos       = Math.cos(angle);
        vector[0] = x * cos - y * sin;
        vector[1] = x * sin + y * cos;
    };
    
    /**
     * Update the shadow...
    **/
    that.update = function(lightLocation, lightAngle, matrix, zoom) {
        // Get the position of the light from the matrix, remove the zoom value...
        var vector = vec3.subtract(vec3.create(lightLocation), [matrix[12], matrix[13], matrix[14] + zoom]),
            sin, cos,
            x, y, z;

        // Instead of rotating the object to face the light at the
        // right angle it's a lot faster to rotate the light in the 
        // reverse direction...
        this.rotateVectorX(vector, -lightAngle[0]);
        this.rotateVectorY(vector, -lightAngle[1]);
        this.rotateVectorZ(vector, -lightAngle[2]);
        
        // Store the location for later use...
        this.lightLocation = vector;

        this.setupData();              // Reset all lists and buffers...
        this.checkDirection(vector);   // Check which triangles face the light source...
        this.findEdge();               // Find the edge...
    };

    /**
     * Create the buffers for the shadow volume...
    **/
    that.createVolume = function(lightLocation) {
        var vertices   = this.item.vertices,
            triangles  = this.item.triangles,
            triangle,
            lineSides  = this.lineSides,
            line,
            vector1, vector2, vector3, vector4,
            i          = lineSides.length,
            j;

        while (i) { // For all edge lines...
            i--;
            line    = lineSides[i];
            vector1 = vertices[line.v1];
            vector2 = vertices[line.v2];

            // Extrude the line away from the light...

            // Get the vector from the light position to the vertex...
            vector3 = vec3.subtract(vector1, lightLocation, vec3.create());

            // Add the normalized vector scaled with the volume
            // depth to the vertex which gives a point on the other
            // side of the object than the light source...
            vector3 = vec3.add(vec3.scale(vec3.normalize(vector3), 30), vector1);

            // And again for the second point on the line...
            vector4 = vec3.subtract(vector2, lightLocation, vec3.create());
            vector4 = vec3.add(vec3.scale(vec3.normalize(vector4), 30), vector2);

            this.addShadowSide(vector1, vector2, vector3, vector4);
        }

        // Add the end caps to the volume...
        i = triangles.length;
        while (i) {
            i--;
            triangle = triangles[i];
            if (triangle.visible) { // Only add polygons facing the light...
                // Add the top...
                j = 3;
                while (j) {
                    j--;
                    this.addGLVertex(vertices[triangle.vertices[j]]);
                }
                
                // Add the bottom...
                j = 0;
                while (j < 3) {
                    vector1 = vertices[triangle.vertices[j]];
                    vector2 = vec3.subtract(vector1, lightLocation, vec3.create());

                    this.addGLVertex(vec3.add(vec3.scale(vec3.normalize(vector2), 30), vector1));
                    j++;
                }
            }
        }

        // Create the vertex position buffer...
        this.glPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.glVertices), gl.STATIC_DRAW);
        this.glPositionBuffer.itemSize = 3;

        // Create the vertex index buffer...
        this.glVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glVertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.glIndices), gl.STATIC_DRAW);
        this.glVertexIndexBuffer.numItems = this.glIndices.length;
    };

    that.render = function() {
        // Create the volume for the light...
        this.createVolume(this.lightLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.glPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glVertexIndexBuffer);
        setMatrixUniforms();

        // Disable the texture coord attribute...
        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
        // Disable the normal attribute...
        gl.disableVertexAttribArray(shaderProgram.vertexNormalAttribute);
        // Disable the color attribute...
        gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);

        // Render both front and back facing polygons with different stencil operations...
        gl.disable(gl.CULL_FACE);                 
        gl.enable(gl.STENCIL_TEST);
        gl.depthFunc(gl.LESS);

        // Disable rendering to the color buffer...
        gl.colorMask(false, false, false, false); 
        // Disable z buffer updating...
        gl.depthMask(false);                      
        // Allow all bits in the stencil buffer...
        gl.stencilMask(255);                      

        // Increase the stencil buffer for back facing polygons, set the z pass opperator
        gl.stencilOpSeparate(gl.BACK,  gl.KEEP, gl.KEEP, gl.INCR); 
        // Decrease the stencil buffer for front facing polygons, set the z pass opperator
        gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.DECR); 
        
        // Always pass...
        gl.stencilFunc(gl.ALWAYS, 0, 255);
        gl.drawElements(gl.TRIANGLES, this.glVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        // Enable rendering the the color and depth buffer again...
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);

        gl.disable(gl.STENCIL_TEST);
    };

    that.init(item);

    return that;
}

function createShadowOverlay() {
    if (createShadowOverlay.overlay !== undefined) {
        return createShadowOverlay.overlay;
    }

    var that = function() {};

    /**
     * Create buffers for an overlay...
    **/
    that.init = function() {
        var size       = 200,
            glVertices = [0,                0,                 0,     
                          gl.viewportWidth, 0,                 0,     
                          gl.viewportWidth, gl.viewportHeight, 0,    
                          0,                gl.viewportHeight, 0],
            glIndices  = [0, 1, 2,  2, 3, 0],
            glColors   = [0, 0, 0, 1,  0, 0, 0, 1,  0, 0, 0, 1,  0, 0, 0, 1];
        
        // Create a rectangle...
        this.glPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glVertices), gl.STATIC_DRAW);
        this.glPositionBuffer.itemSize = 3;

        this.glIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(glIndices), gl.STATIC_DRAW);
        this.glIndexBuffer.itemSize = 1;
        this.glIndexBuffer.numItems = glIndices.length;

        this.glColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glColors), gl.STATIC_DRAW);
        this.glColorBuffer.itemSize = 4;
    };

    /**
     * This function darkens the spots which are covered by shadows...
    **/
    that.render = function() {
        var stencil;
        
        mvPushMatrix();
            gl.disable(gl.DEPTH_TEST);               // No depth test...
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // Don't change the stencil buffer...

            // Enable the color attribute, disable texture coords and normals...
            gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
            gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
            gl.disableVertexAttribArray(shaderProgram.vertexNormalAttribute);

            gl.depthMask(false); // Don't write to the depth buffer...

            // The stencil buffer contains the shadow values...
            gl.enable(gl.STENCIL_TEST);
            
            // Enable blending...
            gl.blendFunc(gl.ZERO, gl.DST_COLOR);
            gl.enable(gl.BLEND);

            // Enable color...
            gl.uniform1i(shaderProgram.useColorUniform, 1);        
            // Disable lighting...
            gl.uniform1i(shaderProgram.useLightingUniform, 0);

            // Render 2D...
            pPushMatrix();
                pMatrix  = mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, 0, -100);
                mvMatrix = mat4.identity(mat4.create());
                
                // Set the buffers...
                gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.glPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.glColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.glColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glIndexBuffer);
                setMatrixUniforms();
                
                // Render 3 passes, each pas with a darker alpha value...
                stencil = 128;
                while (stencil < 132) {
                    stencil++;
                    
                    // The stencil value controls the darkness, 
                    // with each shadow the stencil buffer is increased.
                    // When more shadows overlap the shadow gets darker.
                    gl.stencilFunc(gl.EQUAL, stencil, 255);
                    gl.uniform1f(shaderProgram.alphaUniform, 0.8 - (stencil - 129) * 0.1);

                    // Render the rectangle...
                    gl.drawElements(gl.TRIANGLES, this.glIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
                }

                gl.depthMask(true); // Enable depth buffer updates again...

                gl.disable(gl.BLEND);
                gl.disable(gl.STENCIL_TEST);            
            pPopMatrix();
        mvPopMatrix();
    };

    that.init();

    createShadowOverlay.overlay = that;

    return that;
}

function createLight() {
    var that = function() {};
    
    that.init = function() {
        // Create a small cube to show the light position...
        this.cube = createCube(0.2, 0.2, 0.2, createTexture('#FFFFFF', '#FFDD00'));
    };
    
    /**
     * Update the light source position, render a cube to show the position...
    **/
    that.update = function(angle) {
        this.location = vec3.create([     Math.sin(angle)       * 6, 
                                     18 + Math.cos(angle * 0.5) * 4, 
                                          Math.cos(angle * 0.8) * 9]);
                
        mvPushMatrix();
            // Move to the light position...
            mat4.translate(mvMatrix, this.location);
            
            gl.stencilFunc(gl.NEVER, 0, 255);

            // Set alpha, disable lighting...
            gl.uniform1f(shaderProgram.alphaUniform,       1);
            gl.uniform1i(shaderProgram.useLightingUniform, 0);
            
            // Render the cube...
            this.cube.render();

            // Set the light position, color and the ambient color...
            gl.uniform3f(shaderProgram.lightingLocationUniform, mvMatrix[12], mvMatrix[13], mvMatrix[14]);            
            gl.uniform3f(shaderProgram.lightingColorUniform, 0.5, 0.5, 0.5);
            gl.uniform3f(shaderProgram.ambientColorUniform,  0.5, 0.5, 0.5);
        mvPopMatrix();
    };
    
    that.init();
    
    return that;
}

function createDemo() {
    if (createDemo.demo !== undefined) {
        return createDemo.demo;
    }

    var that = function() {};

    /**
     * Initialize the demo data...
    **/
    that.init = function() {
        this.shapes         = [];
        this.shapeInstances = [];
        this.cubeAngle      = 0;
        this.shadowAngle    = 0;
        this.light          = createLight();

        // Create a floor...
        this.addShape(createCube(15, 1, 15, createTexture('#808080', '#707070')), false);

        // Create the rotating objects with colors...
        this.addShape(createCube   (1.5, 1.5, 1.5, createTexture('#00EE00', '#FF0000')), true);
        this.addShape(createStar   (2,   2,   0.5, createTexture('#FFDD00', '#EE6600')), true);
        this.addShape(createPyramid(1.5, 1.5, 1.5, createTexture('#00FFDD', '#EE00FF')), true);
        
        // Create the objects on the floor in black and white...
        this.addShape(createCube   (2, 1, 2, createTexture('#FFFFFF', '#000000')), true);
        this.addShape(createPyramid(2, 2, 2, createTexture('#FFFFFF', '#000000')), true);
        
        // Create an instance of the floor...
        this.shapeInstances.push({shape:0, location:[ 0, -8,  0], angle:[0, 0, 0]});
        
        // Create instances of the rotating objects...
        this.shapeInstances.push({shape:1, location:[-4,  5,  0], angle:[0, 0, 0]});
        this.shapeInstances.push({shape:2, location:[ 0,  1,  0], angle:[0, 0, 0]});
        this.shapeInstances.push({shape:3, location:[ 4, -3,  0], angle:[0, 0, 0]});
        
        // Create instances for the objects on the floor...
        this.shapeInstances.push({shape:4, location:[-8, -6,  8], angle:[0, 0, 0]});
        this.shapeInstances.push({shape:4, location:[ 8, -6, -8], angle:[0, 0, 0]});
        this.shapeInstances.push({shape:5, location:[-8, -6, -8], angle:[0, 0, 0]});
        this.shapeInstances.push({shape:5, location:[ 8, -6,  8], angle:[0, 0, 0]});
    };

    /**
     * Add a shape to the list, check if a shadow builder is needed...
    **/
    that.addShape = function(shape, shadow) {
        shape.shadow = shadow ? createShadowBuilder(shape) : null;
        this.shapes.push(shape);
    };

    /**
     * Update the matrix for the given shape instance...
    **/
    that.applyShapeInstance = function(shapeInstance) {
        mat4.translate(mvMatrix, shapeInstance.location);
        if (shapeInstance.angle[0] !== 0) {
            mat4.rotateX(mvMatrix, shapeInstance.angle[0]);
        }
        if (shapeInstance.angle[1] !== 0) {
            mat4.rotateY(mvMatrix, shapeInstance.angle[1]);
        }
        if (shapeInstance.angle[2] !== 0) {
            mat4.rotateZ(mvMatrix, shapeInstance.angle[2]);
        }
    };
    
    /**
     * Render all objects and their shadows...
    **/
    that.render = function() {
        var shapeInstances = this.shapeInstances,
            shapeInstance,
            shape,
            shadow,
            zoom           = 60,
            i;

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);
        
        mat4.translate(mvMatrix, [0, 0, -zoom]);        
        mat4.rotateX(mvMatrix, degToRad(20));
        mat4.rotateY(mvMatrix, degToRad(-this.cubeAngle * 0.5));

        this.light.update(this.shadowAngle);
        
        gl.uniform1i(shaderProgram.useLightingUniform, 1);
        
        // Render all objects...
        i = shapeInstances.length;
        while (i) {
            i--;
            shapeInstance = shapeInstances[i];
            mvPushMatrix();
                this.applyShapeInstance(shapeInstance);
                this.shapes[shapeInstance.shape].render();
            mvPopMatrix();
        }

        // Render all shadows...
        i = shapeInstances.length;
        while (i) {
            i--;
            shapeInstance = shapeInstances[i];
            shape         = this.shapes[shapeInstance.shape];
            shadow        = shape.shadow;
            if (shadow !== null) {
                mvPushMatrix();
                    this.applyShapeInstance(shapeInstance);
                    shadow.update(this.light.location, shapeInstance.angle, mvMatrix, zoom);
                    shadow.render();
                mvPopMatrix();
            }
        }

        // Render the overlay to make the shadow areas darker...
        createShadowOverlay().render();
    };

    /**
     * Update angles...
    **/
    that.update = function(elapsed) {
        var shapeInstances = this.shapeInstances;
        
        this.cubeAngle   += 0.03  * elapsed;
        this.shadowAngle += 0.001 * elapsed;
        
        shapeInstances[1].angle[1] += 0.0006 * elapsed;
        shapeInstances[1].angle[2] += 0.0005 * elapsed;        
        shapeInstances[2].angle[1] -= 0.0004 * elapsed;
        shapeInstances[3].angle[0] += 0.0003 * elapsed;
        shapeInstances[3].angle[1] -= 0.0005 * elapsed;                    
    };

    that.init();

    createDemo.demo = that;

    return that;
}

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        createDemo().update(timeNow - lastTime);
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    createDemo().render();
    animate();
}

function webGLStart() {
    var canvas = document.getElementById('demoCanvas');
    initGL(canvas);
    initShaders();

    gl.clearColor(0.5, 0.7, 0.8, 1.0);
    gl.clearStencil(128);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
