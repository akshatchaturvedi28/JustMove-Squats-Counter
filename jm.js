const controls = window;
// Our input frames will come from here.
const POSE_CONNECTIONS = [[7, 11], [8,12], [24, 26], [26, 28],[23, 25],[25, 27],[12, 24], [11, 23],[24, 23],[11, 12],[11, 13],[13, 15],[12, 14],[14, 16],];
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');



// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};
// const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const fpsControl = new controls.FPS();

// Get angle from the coordinates
function getAngle(x1, y1, x2, y2, x3, y3) {
    var result = (Math.atan2(y3 - y2, x3 - x2)
            - Math.atan2(y1 - y2, x1 - x2))
    result = result * (180/Math.PI)
    result = Math.abs(result) // Angle should never be negative
    if (result > 180) {
        result = 360.0 - result // Always get the acute representation of the angle
    }
    return result
}

let count=0;
let f = 0;
function onResults(results) {

    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: "white", fillColor: "white", lineWidth: 6, radius: 4 });


    // Add a coloured gradient counter
    canvasCtx.font = '150px serif';
    var gradient = canvasCtx.createLinearGradient(0, 0, canvasElement.width, 0);
    gradient.addColorStop("0"," magenta");
    gradient.addColorStop("0.5", "blue");
    gradient.addColorStop("1.0", "red");
    // Fill with gradient
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillText(count, 1100, 200);
  
    //console.log(results.poseLandmarks) x,y,z,visibility

    // Logic Applied

    let h = results.image.height; //720
    let w = results.image.width; // 1280

    // Shoulder Coordinates
    let sx = results.poseLandmarks[12].x * w;
    let sy = results.poseLandmarks[12].y * h;


    // Hip Coordinates
    let hx = results.poseLandmarks[24].x * w;
    let hy = results.poseLandmarks[24].y * h;


    // Knee Coordinates
    let kx = results.poseLandmarks[26].x * w;
    let ky = results.poseLandmarks[26].y * h;


    // Ankle Coordinates
    let ax = results.poseLandmarks[28].x * w;
    let ay = results.poseLandmarks[28].y * h;

    // Angle between shoulder-hip-knee
    let angle_shk = getAngle(sx, sy, hx, hy, kx, ky);

    // Angle between hip-knee-ankle
    let angle_hka = getAngle(hx, hy, kx, ky, ax, ay);

    // Distance between eye and knee
    let d = results.poseLandmarks[26].y*h - results.poseLandmarks[6].y*h;

    if(angle_shk<90 && angle_shk>40 && angle_hka<90 && angle_hka>40 && d<210){
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "green" });
    }else{
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "white" });
    }

    if(angle_shk<90 && angle_shk>40 && angle_hka<90 && angle_hka>40 && f==0 && d<210){
        
        f=1;
    }else if(angle_hka>=160 && angle_shk>=160 && f==1){
        count = count + 1;

        f=0;
    }
    //console.log(angle_shk + " " + angle_hka);

    canvasCtx.restore();
}
var pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.3.1621277220/${file}`;
    },
});
pose.onResults(onResults);

var camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
});
camera.start();


// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
     selfieMode: true,
     modelComplexity: 0,
     smoothLandmarks: true,
     minDetectionConfidence: 0.95,
     minTrackingConfidence: 0.95,
     })
     .add([
     new StaticText({title: 'MediaPipe Pose'}),
     fpsControl,
     new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
     new Slider({
         title: 'Model Complexity',
         field: 'modelComplexity',
         discrete: ['Lite', 'Full', 'Heavy'],
     }),
     new Toggle({title: 'Smooth Landmarks', field: 'smoothLandmarks'}),
     new Slider({
         title: 'Min Detection Confidence',
         field: 'minDetectionConfidence',
         range: [0, 1],
         step: 0.01
     }),
     new Slider({
         title: 'Min Tracking Confidence',
         field: 'minTrackingConfidence',
         range: [0, 1],
         step: 0.01
     }),
     ])
     .on(options => {
         pose.setOptions(options);
     });