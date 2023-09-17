let isPlaying = false;
let wavesurfer;
let currentPosition = null;

// Undo/Redo functionality
let history = [];
let redoStack = [];

/* Event Listeners */
window.addEventListener('beforeunload', function() {
    eel.close_app();  // Notify Python to close the app
});

document.addEventListener('DOMContentLoaded', function() {
    initializeWaveSurfer();
});

/* Functions */
function initializeWaveSurfer() {

    console.log("Initializing WaveSurfer");

    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        barWidth: 1,
        height: 150,           // Increase for taller bars
        normalize: true,       // Normalize the waveform
        cursorColor: '#ff0000',
        cursorWidth: 2,
        plugins: [
            WaveSurfer.timeline.create({
                container: '#wave-timeline',
                formatTimeCallback: function (seconds) {
                    return new Date(seconds * 1000).toISOString().substring(11, 19);
                }
            }),
            WaveSurfer.regions.create({})
        ]
    });

    wavesurfer.on('seek', function (progress) {
        currentPosition = Math.round(progress * wavesurfer.getDuration() * 1000);
    });
    
    wavesurfer.on('region-click', function (region, e) {
        region.play();
    });    
}

function selectFile() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
}

function loadAudio() {
    const fileInput = document.getElementById('fileInput');
    const selectedFile = fileInput.files[0];
    const objectURL = URL.createObjectURL(selectedFile);
    wavesurfer.load(objectURL);
    wavesurfer.drawBuffer();
}

function togglePlayPause() {
    if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
        document.getElementById('playPauseBtn').innerText = 'Play';
    } else {
        wavesurfer.play();
        document.getElementById('playPauseBtn').innerText = 'Pause';
    }
}

function stopAudio() {
    wavesurfer.stop();
    document.getElementById('playPauseBtn').innerText = 'Play';
}

// Audio Splitting Functions
function splitAudio() {
    if (currentPosition !== null) {
        console.log("Splitting at position:", currentPosition);

        // Create two regions: one before and one after the current position
        const regionBefore = wavesurfer.addRegion({
            start: 0,
            end: currentPosition / 1000,
            color: 'rgba(0, 123, 255, 0.5)'
        });
        const regionAfter = wavesurfer.addRegion({
            start: currentPosition / 1000,
            end: wavesurfer.getDuration(),
            color: 'rgba(0, 123, 255, 0.5)'
        });

        console.log("Regions created:", regionBefore, regionAfter);
    } else {
        console.log("No position set for splitting");
    }

    regions.push(regionBefore, regionAfter);
    addAction({ type: 'split', regions: [regionBefore, regionAfter] });
}

function toggleHighlight(region) {
    if (region.color === 'rgba(0, 123, 255, 0.5)') {
        region.update({ color: 'rgba(255, 0, 0, 0.5)' });  // Highlighted color
    } else {
        region.update({ color: 'rgba(0, 123, 255, 0.5)' });  // Normal color
    }
}

// Undo/Redo Functions
function addAction(action) {
    history.push(action);
    redoStack = [];  // Clear the redo stack when a new action is added
}

function undo() {
    if (history.length > 0) {
        const lastAction = history.pop();
        if (lastAction.type === 'split') {
            lastAction.regions.forEach(region => region.remove());
            redoStack.push(lastAction);
        }
        // Handle other action types if needed
    }
}

function redo() {
    if (redoStack.length > 0) {
        const actionToRedo = redoStack.pop();
        if (actionToRedo.type === 'split') {
            actionToRedo.regions.forEach(region => {
                wavesurfer.addRegion({
                    start: region.start,
                    end: region.end,
                    color: region.color
                });
            });
            history.push(actionToRedo);
        }
        // Handle other action types if needed
    }
}