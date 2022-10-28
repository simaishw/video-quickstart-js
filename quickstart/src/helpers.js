'use strict';

var Video = require('twilio-video');

/**
 * Display local video in the given HTMLVideoElement.
 * @param {HTMLVideoElement} video
 * @returns {Promise<void>}
 */
function displayLocalVideo(video) {
  return Video.createLocalVideoTrack().then(function(localTrack) {
    localTrack.attach(video);
    return localTrack;
  });
}

/**
 * Take snapshot of the local video from the HTMLVideoElement and render it
 * in the HTMLCanvasElement.
 * @param {HTMLVideoElement} video
 * @param {LocalVideoTrack} localVideoTrack
 * @param {HTMLCanvasElement|HTMLImageElement} snapshot
 */
 function takeLocalVideoSnapshot(video, localVideoTrack, snapshot) {
  if (window.ImageCapture) {
    const imageCapture = new ImageCapture(localVideoTrack.mediaStreamTrack);
    imageCapture.takePhoto().then(function(blob) {
      snapshot.src = URL.createObjectURL(blob);
    });
  } else {
    snapshot.getContext('2d').drawImage(video, 0, 0);
  }
}

module.exports.displayLocalVideo = displayLocalVideo;
module.exports.takeLocalVideoSnapshot = takeLocalVideoSnapshot;


//screenshare ------------------------------------>>>>>>>>>>>>>>>>



/**
 * Create a LocalVideoTrack for your screen. You can then share it
 * with other Participants in the Room.
 * @param {number} height - Desired vertical resolution in pixels
 * @param {number} width - Desired horizontal resolution in pixels
 * @returns {Promise<LocalVideoTrack>}
 */
function createScreenTrack(height, width) {
  if (typeof navigator === 'undefined'
    || !navigator.mediaDevices
    || !navigator.mediaDevices.getDisplayMedia) {
    return Promise.reject(new Error('getDisplayMedia is not supported'));
  }
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      height: height,
      width: width
    }
  }).then(function(stream) {
    return new Video.LocalVideoTrack(stream.getVideoTracks()[0]);
  });
}

exports.createScreenTrack = createScreenTrack;
