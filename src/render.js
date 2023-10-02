// Video element
const videoElement = document.querySelector('video'); // Video element

// Buttons
const reloadBtn = document.getElementById('reloadBtn'); // reloads the dropdown menu
const videoSelect = document.getElementById('videoSelect'); // Dropdown menu

const recordBtn = document.getElementById('recordBtn'); // Toggle button, starts and stops recording
const openFolderBtn = document.getElementById('openFolderBtn'); // Opens the folder where the video is saved

let selectedSourceId = null; // Value of selected source from dropdown menu
let savePath = null; // Path to save video

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = []; // Chunks of video data

async function updateSelectOptions(event){
  reloadBtn.blur();
  const videoSources = await api.getVideoSources();
  
  // Clear the videoSelect dropdown
  videoSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.innerText = "Select a source";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  videoSelect.appendChild(defaultOption);

  // Populate the videoSelect dropdown with the available sources
  videoSources.forEach(source => {
    const option = document.createElement('option');
    option.value = source.id;
    option.innerText = source.name;
    videoSelect.appendChild(option);
  });
};

// Run updateSelectOptions() when the page loads
updateSelectOptions();

// Reload the dropdown menu
reloadBtn.addEventListener("click", updateSelectOptions); 

// When a source is selected, set the selectedSource variable to the value of the selected source
videoSelect.addEventListener('change', async (event) => {
  selectedSourceId = videoSelect.value;
  console.log(selectedSourceId);

  const constraint = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: selectedSourceId
      }
    }
  };

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraint);

  //Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: 'video/webm; codecs=vp9' }; // Options for the video recorder
  mediaRecorder = new MediaRecorder(stream, options); // Create a MediaRecorder instance

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
});

// Toggle button, starts and stops recording
recordBtn.onclick = () => {
  recordBtn.blur();
  // If recording, stop recording
  if (recordBtn.innerText === '🟢START') {
    mediaRecorder.start();
    recordBtn.innerText = '🟥STOP';
  } else {
    mediaRecorder.stop();
    recordBtn.innerText = '🟢START';
  }
}

// Save path to savePath variable
openFolderBtn.onclick = async () => {
  openFolderBtn.blur();
  savePath = await api.openFolder();
  openFolderBtn.innerText = savePath;
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  if (savePath === null) { // If no save path is selected, open the folder selection dialog
    savePath = await api.openFolder();
    openFolderBtn.innerText = savePath;
  }

  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = await api.convertBlob(blob); // Convert blob to buffer
  const filePath = `${savePath}/recording-${Date.now()}`; // File name
  
  // Save the video file
  await api.saveVideo({filePath, buffer});
}