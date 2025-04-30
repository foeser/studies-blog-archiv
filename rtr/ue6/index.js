var camera, scene, renderer;
var controls;
var cube;
var clock = new THREE.Clock();
var r = 0;

// Display error messages in the page.
function displayError(e) {
    $('#error').text(e);
    $('#error').css('display', 'block');
}

// Registers an onload handler.
window.onload = function() {
    $(window).resize(function() {
        var width = $('#canvas-container').innerWidth();
        $('#canvas')
        .attr('width', width)
        .attr('height', width * 0.6);
    });
    $(window).resize();
    try {        
        init();  
    } catch (e) {
        displayError(e.message || e);
    }
}


    
function onWindowResize() {

    var canvas = document.getElementById("canvas");
    camera.aspect = canvas.width/canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize( canvas.width, canvas.height);
//controls.handleResize();
}   
var worldWidth = 128, worldDepth = 128,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2; 

function init() {
    window.addEventListener( 'resize', onWindowResize, false );
        
    var canvas = document.getElementById("canvas");
       
    camera = new THREE.PerspectiveCamera( 45, canvas.width/canvas.height, 1, 20000 );
    camera.position.z = 750;   
    camera.position.y = 800;
    

    scene = new THREE.Scene();
    
    //   controls = new THREE.FlyControls( camera );
    //
    //   controls.movementSpeecontrolsd = 2500;
    //   controls.domElement = canvas;
    //   controls.rollSpeed = Math.PI / 6;
    //   controls.autoForward = false;
    //   controls.dragToLook = false;
                
    
    scene.fog = new THREE.Fog( 0x000000, 3500, 15000 );
    scene.fog.color.setHSV( 0.51, 0.6, 0.025 );
    
    // LIGHTS
    var ambient = new THREE.AmbientLight( 0xffffff );
    scene.add( ambient );
    var light = new THREE.PointLight( 0xffffff, 1.5, 4500 );
    light.position.set( -1500, 1000, 1000 );
    light.color.setHSV(  0.08, 0.825, 0.99 );
    scene.add( light );    

    // TERRAIN
    var waterMesh = Terrain.createWaterSurface('heightmaps/water.jpg');
    //waterMesh.position.y = 250;
    waterMesh.position.y = 110;
    scene.add(waterMesh);
    
    scene.add(Terrain.createHeightMap('heightmaps/h1.jpg', 'heightmaps/h1_tex.jpg', 128));        
    scene.add(Terrain.createSkyBox('skybox2/'));
    // camera target
    cube = new THREE.Mesh( new THREE.CubeGeometry( 200, 200, 200 ), new THREE.MeshNormalMaterial() );
    cube.position.y = 150;
    scene.add( cube );
    cube.visible = false;
   
    renderer = new THREE.WebGLRenderer({
        canvas:canvas, 
        antialias: true     
    });
    renderer.setSize( canvas.width, canvas.height );
    //renderer.setClearColor( scene.fog.color, 1 );
    //   renderer.gammaInput = true;
    //				renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

       
    animate();

}

function animate() {

    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );
    
    var dist = 1750;
    camera.position.x = dist*Math.cos(r);
    camera.position.z = dist*Math.sin(r);
    r += 0.005;

    camera.lookAt(cube.position);
    //controls.update( clock.getDelta() );
   
    renderer.render( scene, camera );

}






