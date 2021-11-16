import './style.css'
const THREE = require('three')
global.THREE = THREE

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import { Pane } from 'tweakpane'

require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/RGBELoader.js");

/**
 * Debug
 */
const debug = window.location.hash === '#debug'
let pane;
if(debug) {
    pane = new Pane()
    pane.containerElem_.style.width = '300px'
}


/**
 * Base
 */
// Loaders
const textureLoader = new THREE.TextureLoader()
const rgbeLoader = new THREE.RGBELoader()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 8
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Background
 */
const bgTexture = textureLoader.load('/texture.jpg')
const bgGeometry = new THREE.PlaneGeometry(5, 5)
const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture })
const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
bgMesh.position.set(0, 0, -1)
scene.add(bgMesh)

/**
 * Material
 */
//hdr
const hdrEquirect = rgbeLoader.load(
    "/empty_warehouse_01_2k.hdr",  
    () => { 
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping; 
    }
);

// normal
const normalTexture = textureLoader.load('/normal.jpg')
normalTexture.wrapS = THREE.RepeatWrapping;
normalTexture.wrapT = THREE.RepeatWrapping;
normalTexture.repeat.set(1, 1)


const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.6,
    transmission: 1,
    thickness: 1.2,
    envMap: hdrEquirect,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(1, 1),
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    clearcoatNormalMap: normalTexture,
    clearcoatNormalScale: new THREE.Vector2(0.3, 0.3),
});

/**
 * Shapes
 */

if(debug) {
    const materialFolder = pane.addFolder({
        title: 'Gettin FROSTY'
    })
    
    materialFolder.addInput(
        material,
        'roughness',
        { min: 0, max: 1, step: 0.01 }
    )
    
    materialFolder.addInput(
        material,
        'transmission',
        { min: 0, max: 1, step: 0.01 }
    )
    
    materialFolder.addInput(
        material,
        'thickness',
        { min: 0, max: 5, step: 0.01 }
    )
}


const shapes = {}

// icosahedron
shapes.icosahedron = {}
shapes.icosahedron.geometry = new THREE.IcosahedronGeometry(0.8, 0)
shapes.icosahedron.position = new THREE.Vector3(-0.85, 0.85, 0)
shapes.icosahedron.mesh = new THREE.Mesh(shapes.icosahedron.geometry, material)

// rounded rect
shapes.roundedRect = {}
shapes.roundedRect.geometry = new THREE.RoundedBoxGeometry(1.15, 1.15, 1.15, 16, 0.2)
shapes.roundedRect.position = new THREE.Vector3(0.85, 0.85, 0)
shapes.roundedRect.mesh = new THREE.Mesh(shapes.roundedRect.geometry, material)

// knot
shapes.knot = {}
shapes.knot.geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 100, 32 );
shapes.knot.position = new THREE.Vector3(-0.85, -0.85, 0)
shapes.knot.mesh = new THREE.Mesh(shapes.knot.geometry, material)

// torus
shapes.torus = {}
shapes.torus.geometry = new THREE.TorusGeometry( 0.55, 0.24, 16, 100 )
shapes.torus.position = new THREE.Vector3(0.85, -0.85, 0)
shapes.torus.mesh = new THREE.Mesh(shapes.torus.geometry, material)


for(const _shape in shapes) {
    shapes[_shape].mesh.position.copy(shapes[_shape].position)
    scene.add(shapes[_shape].mesh)
}

 const light = new THREE.DirectionalLight(0xfff0dd, 1);
 light.position.set(0, 5, 10);
 scene.add(light);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x1f1e1c, 1);

/**
 * Postprocessing
 */
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(sizes.width, sizes.height),
    0.5,
    0.33,
    0.85
)


composer.addPass(renderPass)
composer.addPass(bloomPass)

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    // Rotate shapes
    for(const _shape in shapes) {
        shapes[_shape].mesh.rotation.x = elapsedTime * 0.5
        shapes[_shape].mesh.rotation.y = elapsedTime * 0.56
    }

    // Update controls
    controls.update()

    // Render
    // renderer.render(scene, camera)
    composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()