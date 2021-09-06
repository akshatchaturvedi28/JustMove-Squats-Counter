const controls = window;
// Our input frames will come from here.
const POSE_CONNECTIONS = [[24, 26], [26, 28],[23, 25],[25, 27],[12, 24], [11, 23],[24, 23],[11, 12],[11, 13],[13, 15],[12, 14],[14, 16],];
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
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "white" });


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

    let y1 = results.poseLandmarks[25].y * h;
    let y2 = results.poseLandmarks[23].y * h;
    let length = y2 - y1;
    //console.log(length);
    if(length>=0 && f==0){
        f=1;
    }
    else if(length<-100 && f==1){
        f=0;
        count = count + 1;
        //console.log(count);
    }

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