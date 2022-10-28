'use strict';

const { isSupported } = require('twilio-video');

const { isMobile } = require('./browser');
const joinRoom = require('./joinroom');
const micLevel = require('./miclevel');
const selectMedia = require('./selectmedia');
const selectRoom = require('./selectroom');
const showError = require('./showerror');

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $showErrorModal = $('#show-error', $modals);
const $joinRoomModal = $('#join-room', $modals);


// ConnectOptions settings for a video web application.
const connectOptions = {
  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  bandwidthProfile: {
    video: {
      dominantSpeakerPriority: 'high',
      mode: 'collaboration',
      clientTrackSwitchOffControl: 'auto',
      contentPreferencesMode: 'auto'
    }
  },

  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  dominantSpeaker: true,

  // Comment this line if you are playing music.
  maxAudioBitrate: 16000,

  // VP8 simulcast enables the media server in a Small Group or Group Room
  // to adapt your encoded video quality for each RemoteParticipant based on
  // their individual bandwidth constraints. This has no utility if you are
  // using Peer-to-Peer Rooms, so you can comment this line.
  preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

  // Capture 720p video @ 24 fps.
  video: { height: 720, frameRate: 24, width: 1280 }
};

// For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps.
if (isMobile) {
  connectOptions
    .bandwidthProfile
    .video
    .maxSubscriptionBitrate = 2500000;
}

// On mobile browsers, there is the possibility of not getting any media even
// after the user has given permission, most likely due to some other app reserving
// the media device. So, we make sure users always test their media devices before
// joining the Room. For more best practices, please refer to the following guide:
// https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
const deviceIds = {
  audio: isMobile ? null : localStorage.getItem('audioDeviceId'),
  video: isMobile ? null : localStorage.getItem('videoDeviceId')
};

/**
 * Select your Room name, your screen name and join.
 * @param [error=null] - Error from the previous Room session, if any
 */
async function selectAndJoinRoom(error = null) {
  const formData = await selectRoom($joinRoomModal, error);
  if (!formData) {
    // User wants to change the camera and microphone.
    // So, show them the microphone selection modal.
    deviceIds.audio = null;
    deviceIds.video = null;
    return selectMicrophone();
  }
  const { identity, roomName } = formData;

  try {
    // Fetch an AccessToken to join the Room.
    const response = await fetch(`/token?identity=${identity}`);

    // Extract the AccessToken from the Response.
    const token = await response.text();

    // Add the specified audio device ID to ConnectOptions.
    connectOptions.audio = { deviceId: { exact: deviceIds.audio } };

    // Add the specified Room name to ConnectOptions.
    connectOptions.name = roomName;

    // Add the specified video device ID to ConnectOptions.
    connectOptions.video.deviceId = { exact: deviceIds.video };

    // Join the Room.
    await joinRoom(token, connectOptions);

    // After the video session, display the room selection modal.
    return selectAndJoinRoom();
  } catch (error) {
    return selectAndJoinRoom(error);
  }
}

/**
 * Select your camera.
 */
async function selectCamera() {
  if (deviceIds.video === null) {
    try {
      deviceIds.video = await selectMedia('video', $selectCameraModal, videoTrack => {
        const $video = $('video', $selectCameraModal);
        videoTrack.attach($video.get(0))
      });
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectAndJoinRoom();
}

/**
 * Select your microphone.
 */
async function selectMicrophone() {
  if (deviceIds.audio === null) {
    try {
      deviceIds.audio = await selectMedia('audio', $selectMicModal, audioTrack => {
        const $levelIndicator = $('svg rect', $selectMicModal);
        const maxLevel = Number($levelIndicator.attr('height'));
        micLevel(audioTrack, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
      });
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectCamera();
}

// If the current browser is not supported by twilio-video.js, show an error
// message. Otherwise, start the application.
window.addEventListener('load', isSupported ? selectMicrophone : () => {
  showError($showErrorModal, new Error('This browser is not supported.'));
});



const mediaContainer = document.querySelector('div#media-container');
const renderDimensionsOption = document.querySelector('select#renderDimensionsOption');


const renderDimensionsObj = {
  qHD: { width: 960, height: 540 },
  VGA: { width: 640, height: 480 },
  QCIF: { width: 640, height: 360}
}

// Adjust Remote Video element size.
renderDimensionsOption.addEventListener('change', () => {
  const renderDimensions = renderDimensionsObj[renderDimensionsOption.value];
  mediaContainer.style.height = `${renderDimensions.height}px`;
  mediaContainer.style.width = `${renderDimensions.width}px`;
});


var Prism = require('prismjs');
var getSnippet = require('../../examples/util/getsnippet');
var helpers = require('./helpers');
var displayLocalVideo = helpers.displayLocalVideo;
var takeLocalVideoSnapshot = helpers.takeLocalVideoSnapshot;

var canvas = document.querySelector('.snapshot-canvas');
var img = document.querySelector('.snapshot-img');
var takeSnapshot = document.querySelector('button#takesnapshot');
var video = document.querySelector('video#videoinputpreview');

let videoTrack;
let el;

// Show image or canvas
window.onload = function() {
  el = window.ImageCapture ? img : canvas;
  el.classList.remove('hidden');
  if(videoTrack) {
    setSnapshotSizeToVideo(el, videoTrack);
  }
}

// Set the canvas size to the video size.
function setSnapshotSizeToVideo(snapshot, video) {
  snapshot.width = video.dimensions.width;
  snapshot.height = video.dimensions.height;
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// Request the default LocalVideoTrack and display it.
displayLocalVideo(video).then(function(localVideoTrack) {
  // Display a snapshot of the LocalVideoTrack on the canvas.
  videoTrack = localVideoTrack;
  takeSnapshot.onclick = function() {
    setSnapshotSizeToVideo(el, localVideoTrack);
    takeLocalVideoSnapshot(video, localVideoTrack, el);
  };
});

// Resize the canvas to the video size whenever window is resized.
window.onresize = function() {
  setSnapshotSizeToVideo(el, videoTrack);
};

//local audio video mute ------------------------------------------------------->>>>>>>>>>>>>>>


//const Prism = require('prismjs');
const Video = require('twilio-video');
//const getSnippet = require('../../examples/util/getsnippet');
const getRoomCredentials = require('../../examples/util/getroomcredentials');
const helperss = require('./helperss');
const muteYourAudio = helperss.muteYourAudio;
const muteYourVideo = helperss.muteYourVideo;
const unmuteYourAudio = helperss.unmuteYourAudio;
const unmuteYourVideo = helperss.unmuteYourVideo;
const participantMutedOrUnmutedMedia = helperss.participantMutedOrUnmutedMedia;

const audioPreview = document.getElementById('audiopreview');
const videoPreview = document.getElementById('videopreview');
let roomName = null;

(async function(){
  // Load the code snippet.

  // Get the credentials to connect to the Room.
  const credsP1 = await getRoomCredentials();
  const credsP2 = await getRoomCredentials();

  // Create room instance and name for participants to join.
  const roomP1 = await Video.connect(credsP1.token);

  // Set room name for participant 2 to join.
  roomName = roomP1.name;

  // Connecting remote participants.
  const roomP2 = await Video.connect(credsP2.token, {
    name: roomName,
    tracks: []
  });

  // Muting audio track and video tracks click handlers
  muteAudioBtn.onclick = () => {
    const mute = !muteAudioBtn.classList.contains('muted');
    const activeIcon = document.getElementById('activeIcon');
    const inactiveIcon = document.getElementById('inactiveIcon');

    if(mute) {
      muteYourAudio(roomP1);
      muteAudioBtn.classList.add('muted');
      muteAudioBtn.innerText = 'Enable Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';

    } else {
      unmuteYourAudio(roomP1);
      muteAudioBtn.classList.remove('muted');
      muteAudioBtn.innerText = 'Disable Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';
    }
  }

  muteVideoBtn.onclick = () => {
    const mute = !muteVideoBtn.classList.contains('muted');

    if(mute) {
      muteYourVideo(roomP1);
      muteVideoBtn.classList.add('muted');
      muteVideoBtn.innerText = 'Enable Video';
    } else {
      unmuteYourVideo(roomP1);
      muteVideoBtn.classList.remove('muted');
      muteVideoBtn.innerText = 'Disable Video';
    }
  }

  // Starts video upon P2 joining room
  roomP2.on('trackSubscribed', track => {
    if (track.isEnabled) {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      } else{
        videoPreview.appendChild(track.attach());
      }
    }
  });

  participantMutedOrUnmutedMedia(roomP2, track => {
    track.detach().forEach(element => {
      element.srcObject = null;
      element.remove();
    });
  }, track => {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      }
      if (track.kind === 'video') {
        videoPreview.appendChild(track.attach());
      }
  });

  // Disconnect from the Room
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());


//screenshare --------------------------------------------------------->>>>>>>>>


