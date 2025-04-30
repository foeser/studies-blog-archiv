function Terrain() {
	
}

Terrain.createHeightMap = function (heightMapPath, heightMapTexturePath, size) {
    var data = Terrain.getHeightData(heightMapPath, size)
    
    // base for terrain is a plane    
    var geometry = new THREE.PlaneGeometry(3000, 3000, size-1, size-1);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    
    var material = Terrain.getTerrainMaterial(heightMapTexturePath, size);
    
    var i, il;

    for ( i = 0, il = geometry.vertices.length; i < il; i ++ ) {       
        geometry.vertices[ i ].y = data[i]*10;
    }                          
    //console.log( "triangles: " + geometry.faces.length * 2 + " faces: " + geometry.faces.length + " vertices: " + geometry.vertices.length );
    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
  

    var plane = new THREE.Mesh( geometry, material ); 
    plane.overdraw = true;
    plane.doubleSided = false;
    plane.updateMatrix();
    // plane.position.y = -100;
    return plane;

}  

Terrain.getHeightData = function (imgString, size) {
    
    var canvas = document.createElement( 'canvas' );
    canvas.width = size;
    canvas.height = size;
    context = canvas.getContext( '2d' );				
    var imageObj = new Image();
    imageObj.src = imgString;
   
    var data = new Float32Array( size*size );
    context.drawImage(imageObj, 0, 0);

    
    var imgd = context.getImageData(0, 0, size, size); 
   
    var pix = imgd.data;
 
    var j=0;
    for (var i = 0, n = pix.length; i < n; i += (4)) {
        var all = pix[i]+pix[i+1]+pix[i+2];
        data[j++] = all/15;
    }

    return data;    
   
}

Terrain.getTerrainMaterial = function (imgString, size) {   
    var terrainMaterial = new THREE.MeshPhongMaterial( {
        map: new THREE.Texture(null, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping), 
        ambient: 0xaaaaaa, 
        specular: 0xffffff, 
        shininess: 0, 
        shading: THREE.SmoothShading
    } );

// load manuel
//    var canvas = document.createElement( 'canvas' );
//    canvas.width = size;
//    canvas.height = size;
//    context = canvas.getContext( '2d' );				
//    var imageObj = new Image();
//    imageObj.src = imgString;
//   
//  
//    context.drawImage(imageObj, 0, 0);
//				
//    terrainMaterial.map.image = imageObj;
//    imageObj.onload = function () {
//        terrainMaterial.map.image.loaded = 1;
//                                        
//    };
// load through three.js
    var texture = THREE.ImageUtils.loadTexture(imgString);    
    terrainMaterial.map = texture;
    
    terrainMaterial.map.needsUpdate = true;
    return terrainMaterial;
}

Terrain.createWaterSurface = function (imgString, size) {
    
    var geometry = new THREE.PlaneGeometry( 3000, 3000, 1, 1 );
  
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();               
    var material = Terrain.getWaterMaterial(imgString, size);
                                
    var water = new THREE.Mesh( geometry, material );   
    return water;
}

Terrain.getWaterMaterial = function (imgString, size) {
    // skybox for refraction
    var path = "skybox2/";
    var format = '.jpg';
    var urls = [
    path + 'px' + format, path + 'nx' + format,
    path + 'py' + format, path + 'ny' + format,
    path + 'pz' + format, path + 'nz' + format
    ];                                
                            
    var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );

    //	var waterMaterial = new THREE.MeshPhongMaterial( { map: new THREE.Texture(null, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping), color: 0xffffff, ambient: 0x666666, specular: 0xffffff, env_map: textureCube, combine: THREE.MultiplyOperation , opacity: 0.8, shininess: 10, shading: THREE.SmoothShading } );
    var waterMaterial = new THREE.MeshPhongMaterial( {
        map: new THREE.Texture(null, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping),  
        specular: 0xffffff,
        envMap: textureCube, 
        refractionRatio: 0.95, 
        opacity: 0.8 , 
        shininess: 10, 
        shading: THREE.SmoothShading
    } );
				
    var texture = THREE.ImageUtils.loadTexture(imgString);    
    waterMaterial.map = texture;
    
    waterMaterial.map.needsUpdate = true;    

    return waterMaterial;
}

Terrain.createSkyBox = function(rootImagePath) {
    var path = rootImagePath;
    var format = '.jpg';
    var urls = [
    path + 'px' + format, path + 'nx' + format,
    path + 'py' + format, path + 'ny' + format,
    path + 'pz' + format, path + 'nz' + format
    ];                                
                            
    var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
   
    var shader = THREE.ShaderLib[ "cube" ];
    shader.uniforms[ "tCube" ].value = textureCube;

    var material = new THREE.ShaderMaterial( {

        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        side: THREE.BackSide

    } ),
    //
    mesh = new THREE.Mesh( new THREE.CubeGeometry( 3500, 3500, 3500 ), material );
    return mesh;
}                

