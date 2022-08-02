const express = require("express");
const path = require("path");

const { createAndTrainModel, predict } = require("./modules/model");
const { extractPixelDataFromImages, writePixelDataToCSV } = require("./modules/utils");

const app = express();

app.set("port", (process.env.PORT || 4000));
app.use("/", express.static(path.join(__dirname, "../client/public")));

app.get("/extract-pixel-data-from-images", (req, res) => {
    extractPixelDataFromImages();
    res.send("Extraction started!");
});

app.get("/export-to-csv", (req, res) => {
    writePixelDataToCSV();
    res.send("Export started!");
});

app.get("/train-model", async (req, res) => {
    createAndTrainModel();
    res.send("Model Training Initiated...");
});

app.get("/predict", async (req, res) => {
    const predictedNumber = await predict(path.join(__dirname, "./12357.jpg"));

    if (predictedNumber) {
        res.status(200).json(predictedNumber);
    } else {
        res.status(404).json({error: "Model not ready"});
    }
});

app.listen(app.get("port"), () => {
    console.log(`App listening on port #${app.get("port")}`);
});
