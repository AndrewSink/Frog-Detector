let classifier;
let img = new Image();
let label = "Waiting...";
let conf = 0;
let highestConfidence = 0; // Variable to track the highest confidence for 'frog' or 'toad'
let highestLabel = ""; // Tracks whether 'Frog' or 'Toad' is associated with highestConfidence

// Load the model and set up file upload listener
async function preload() {
    try {
        classifier = await ml5.imageClassifier("MobileNet");

        // Set default image
        img.src = "images/frog.jpg";
        img.onload = classifyImage;

        // Handle file uploads
        const uploadInput = document.getElementById("imageUpload");
        uploadInput.addEventListener("change", handleImageUpload);
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

// Handle uploaded image
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        resetClassification(); // Reset values before loading a new image
        img.src = e.target.result;
        img.onload = classifyImage;
    };
    reader.readAsDataURL(file); // Load image as data URL
}

function resetClassification() {
    label = "Waiting...";
    conf = 0;
    highestConfidence = 0;
    highestLabel = "";

    // Clear UI elements
    document.getElementById("label").textContent = "Label: Waiting...";
    document.getElementById("confidence").textContent = "Confidence: 0%";
}

function classifyImage() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect ratio
    const imgAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    // Fit image while maintaining aspect ratio
    if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspectRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2; // Center vertically
    } else {
        // Image is taller than or equal to canvas
        drawWidth = canvas.height * imgAspectRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2; // Center horizontally
        offsetY = 0;
    }

    // Draw the image with corrected dimensions
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Classify the canvas
    if (classifier && classifier.classify) {
        classifier.classify(canvas, gotResults);
    } else if (classifier && classifier.predict) {
        classifier.predict(canvas, gotResults);
    } else {
        console.error("Classifier not properly initialized");
    }
}

// Handle classification results
function gotResults(results) {
    if (results && results.length > 0) {
        label = results[0].label || "Unknown";
        conf = results[0].confidence || 0;

        // Check results for 'frog' or 'toad' and update highestConfidence and highestLabel
        results.forEach((result) => {
            let resultLabel = result.label.toLowerCase();

            // Remove "tailed frog" from the result label if it exists
            resultLabel = resultLabel.replace("tailed frog, ", ""); // Remove with comma and space

            if (resultLabel.includes("frog") || resultLabel.includes("toad")) {
                if (result.confidence > highestConfidence) {
                    highestConfidence = result.confidence;
                    highestLabel = resultLabel.includes("frog") ? "frog" : "toad";
                }
            }
        });

        console.log("Results:", results);
        console.log(
            `Highest Confidence (Frog/Toad): ${highestConfidence}, Associated Type: ${highestLabel}`
        );
        updateUI();
    }
}

function updateUI() {
    const labelElement = document.getElementById("label");
    const confidenceElement = document.getElementById("confidence");

    // Determine which word to use: Frog or Toad
    const word = highestLabel || "frog/toad";

    // Generate message based on confidence
    let message = "";
    if (highestConfidence === 0) {
        message = `There is no frog or toad in this picture.`;
        confidenceElement.style.display = "none"; // Hide confidence if 0%
    } else {
        confidenceElement.style.display = "block"; // Show confidence otherwise
        if (highestConfidence >= 0.75) {
            message = `It’s very likely this picture contains a ${word}!`;
            launchConfetti(); // Launch confetti!

        } else if (highestConfidence >= 0.5) {
            message = `There is probably a ${word} in this picture.`;
        } else {
            message = `There is probably not a frog or toad in this picture.`;
        }
    }

    // Update the UI elements
    labelElement.textContent = message;
    confidenceElement.textContent = `Confidence: ${(highestConfidence * 100).toFixed(2)}%`;
}

// Function to launch confetti
function launchConfetti() {
    const textElement = document.getElementById("label");
    const rect = textElement.getBoundingClientRect(); // Get the position of the label

    confetti({
        particleCount: 100,
        startVelocity: 30,
        spread: 360,
        origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth, // Horizontal center of the label
            y: rect.top / window.innerHeight // Top of the label
        }
    });

}

// Start the process
preload().catch(error => {
    console.error("Failed to initialize:", error);
});