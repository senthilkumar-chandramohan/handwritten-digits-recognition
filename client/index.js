const jimp = require("jimp");
import * as tf from '@tensorflow/tfjs';

let model;
const labels = ['0','1','2','3','4','5','6','7','8','9'];
let startPrediction = false;

(async function() {
    model = await tf.loadLayersModel('model/model.json');
})();

const predict = (pixelData, imageWidth, imageHeight, imageChannels) => {
    if (model) {
        const imageTensor = tf.tensor(pixelData, [imageWidth, imageHeight, imageChannels]);
        const inputTensor = imageTensor.expandDims();
        const prediction = model.predict(inputTensor);
        const scores = prediction.arraySync()[0];

        const maxScore = prediction.max().arraySync();
        const maxScoreIndex = scores.indexOf(maxScore);

        const labelScores = [];
        scores.forEach((s, i) => {
            labelScores[labels[i]] = parseFloat(s.toFixed(4));
        });

        return {
            prediction: labels[maxScoreIndex],
            confidence: parseInt(maxScore * 100),
            scores: labelScores,
        };
    } else {
        return null;
    }
};

const canvas = document.getElementById('canvas');
canvas.style.margin = 0;
canvas.style.height = '280px';
canvas.style.width = '280px';

// get canvas 2D context and set him correct size
const ctx = canvas.getContext('2d');
ctx.fillStyle="rgb(0,0,0)"
ctx.fillRect(0, 0, canvas.width, canvas.height);

// last known position
const pos = { x: 0, y: 0 };

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mousedown', setPosition);
canvas.addEventListener('touchstart', setPosition);
// canvas.addEventListener('mouseenter', setPosition);
canvas.addEventListener('mouseup', triggerPredictTimer);
canvas.addEventListener('touchend', triggerPredictTimer);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle="rgb(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// new position from mouse event
function setPosition(e) {
    startPrediction = false;
    console.log("startPrediction", startPrediction);
    pos.x = e.offsetX;
    pos.y = e.offsetY;
}

function draw(e) {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    ctx.beginPath(); // begin

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
}

// document.getElementById('predict').addEventListener('click', async function() {

function triggerPredictTimer() {
    startPrediction = true;
    console.log("startPrediction", startPrediction);
    setTimeout(()=> {
        readImageAndPredict();
    }, 750);
};

async function readImageAndPredict() {
    console.log("startPrediction", startPrediction);
    if (startPrediction) {
        const imageWidth=28, imageHeight=28, imageChannels=1;
        const pixelData = [];
        const dataURL = canvas.toDataURL();
        // document.getElementById("canvasimg").src = dataURL;

        const image = await jimp.default.read(dataURL);

        await image
            .resize(imageWidth, imageHeight)
            .greyscale()
            // .getBase64Async("image/png")
            .scan(0, 0, imageWidth, imageHeight, (x, y, idx) => {
                let v = image.bitmap.data[idx + 0];
                pixelData.push(v===0?0.0039216:v/255);
            });

        // document.getElementById("canvasimg").src = processedImage;
        console.log(pixelData);
        const result = predict(pixelData, imageWidth, imageHeight, imageChannels);
        if (result) {
            document.getElementById('result').innerHTML += ` | ${result.prediction} (${result.confidence}%) | ${result.scores.map(v=>`${v*100}%`)} <br>`;
            speechSynthesis.speak(new SpeechSynthesisUtterance(result.prediction));
            clearCanvas();
            // document.getElementById('result').innerHTML += "<br><br>" + result.scores;
        }
    }
}