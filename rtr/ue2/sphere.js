var Sphere = function (recursionDepth) {

    this.recursionDepth = recursionDepth;
    
    // initial tetrahedron vertices
    this.a = [-1.0, 1.0, 1.0];
    this.b = [1.0, 1.0, -1.0];
    this.c = [1.0, -1.0, 1.0];
    this.d = [-1.0, -1.0, -1.0];
    
    // normalize initial tetrahedron vertices   
    this.a = vec3.normalize(this.a);    
    this.b = vec3.normalize(this.b);
    this.c = vec3.normalize(this.c);
    this.d = vec3.normalize(this.d);
	
    // define buffers to store the spheres' vertex positions and colors
    this.vertices = [];
    this.vertexColors = [];
	
    // tesselate the tetrahedron trinagle wise
    this.tessellateTriangle(this.a, this.b, this.c, this.recursionDepth);
    this.tessellateTriangle(this.a, this.b, this.d, this.recursionDepth);
    this.tessellateTriangle(this.a, this.c, this.d, this.recursionDepth);
    this.tessellateTriangle(this.b, this.c, this.d, this.recursionDepth);		
    
    // create a vertex buffer and apply the previous calculated vertices
    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = this.vertices.length / 3; 
   
    // create a buffer for each vertex color and fill it
    this.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
    
    for(i=0; i < this.vertices.length; i+=3) {
        this.vertexColors.push((this.vertices[i] + 1) / 2); // x->r
        this.vertexColors.push((this.vertices[i+1] + 1) / 2); // y->g
        this.vertexColors.push((this.vertices[i+2] + 1) / 2); // z->b       
        this.vertexColors.push(1); // a
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexColors), gl.STATIC_DRAW);
    this.vertexColorBuffer.itemSize = 4;
    this.vertexColorBuffer.numItems = this.vertexColors.length / 4; 
    
}

Sphere.prototype.calculateMedianVector = function(a, b)
{
    // add the two vector to create a direction vector (median)
    var c = vec3.create(0,0,0);    
    vec3.add(a, b, c);    
    return this.normalize(c);
}

Sphere.prototype.normalize = function(vec)
{
    // the normalization function return the center (vector) of the median   
    vec3.normalize(vec);	
    var normalizedVector = [vec[0], vec[1], vec[2]];    
    return normalizedVector;
}

Sphere.prototype.tessellateTriangle = function(a, b, c, depth) {

    if(depth == 1)
    { 
        // a recursion depth of 1 means to store the vertices and to break
        // the recursion
        this.vertices.push(a[0], a[1], a[2]);
        this.vertices.push(b[0], b[1], b[2]);
        this.vertices.push(c[0], c[1], c[2]);       
    }
    else
    {
        // calculate the medians...   
        var ab = this.calculateMedianVector(a, b);    
        var ac = this.calculateMedianVector(a, c);
        var bc = this.calculateMedianVector(b, c);
    
        // ...and use them to span four new triangles which then gets tessellated again
        this.tessellateTriangle(a, ab, ac, depth-1);
        this.tessellateTriangle(ac, bc, c, depth-1);
        this.tessellateTriangle(ab, b, bc, depth-1);
        this.tessellateTriangle(ab, ac, bc, depth-1); 
    }  

}

Sphere.prototype.draw = function(isWireFrameEnabled) {
		
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    if(isWireFrameEnabled)
        gl.drawArrays(gl.LINE_STRIP, 0, this.vertexPositionBuffer.numItems); //  -> wireframe
    else
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);
        
}