(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.iosrtc = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Expose an object with WebRTC Errors.
 */
var Errors = module.exports = {},


/**
 * Local variables.
 */
	IntermediateInheritor = function () {};


IntermediateInheritor.prototype = Error.prototype;


/**
 * Create error classes.
 */
addError('InvalidStateError');
addError('InvalidSessionDescriptionError');
addError('InternalError');
addError('MediaStreamError');


function addError(name) {
	Errors[name] = function () {
		var tmp = Error.apply(this, arguments);

		this.name = tmp.name = name;
		this.message = tmp.message;

		Object.defineProperty(this, 'stack', {
			get: function () {
				return tmp.stack;
			}
		});

		return this;
	};

	Errors[name].prototype = new IntermediateInheritor();
}

},{}],2:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com
 * @author Jesús Leganés Combarro "Piranna" <piranna@gmail.com>
 */


/**
 * Specification: https://dom.spec.whatwg.org
 */


/**
 * Expose the EventTarget class.
 */
module.exports = EventTarget;


function EventTarget() {
	var listeners = {};

	this.addEventListener = function (type, newListener) {
		var listenersType,
			i, listener;

		if (!type || !newListener) {
			return;
		}

		listenersType = listeners[type];
		if (listenersType === undefined) {
			listeners[type] = listenersType = [];
		}

		for (i = 0; !!(listener = listenersType[i]); i++) {
			if (listener === newListener) {
				return;
			}
		}

		listenersType.push(newListener);
	};

	this.removeEventListener = function (type, oldListener) {
		var listenersType,
			i, listener;

		if (!type || !oldListener) {
			return;
		}

		listenersType = listeners[type];
		if (listenersType === undefined) {
			return;
		}

		for (i = 0; !!(listener = listenersType[i]); i++) {
			if (listener === oldListener) {
				listenersType.splice(i, 1);
				break;
			}
		}

		if (listenersType.length === 0) {
			delete listeners[type];
		}
	};

	this.dispatchEvent = function (event) {
		var type,
			listenersType,
			dummyListener,
			stopImmediatePropagation = false,
			i, listener;

		if (!(event instanceof Event)) {
			throw new Error('first argument must be an instance of Event');
		}

		type = event.type;

		listenersType = (listeners[type] || []);

		dummyListener = this['on' + type];
		if (typeof dummyListener === 'function') {
			listenersType.push(dummyListener);
		}

		event.target = this;

		for (i = 0; !!(listener = listenersType[i]); i++) {
			if (stopImmediatePropagation) {
				break;
			}

			listener.call(this, event);
		}

		return !event.defaultPrevented;
	};
}

},{}],3:[function(require,module,exports){
/**
 * Expose the MediaDeviceInfo class.
 */
module.exports = MediaDeviceInfo;


function MediaDeviceInfo(data) {
	data = data || {};

	Object.defineProperties(this, {
		// MediaDeviceInfo spec.
		deviceId: {
			value: data.deviceId
		},
		kind: {
			value: data.kind
		},
		label: {
			value: data.label
		},
		groupId: {
			value: data.groupId || ''
		},
		// SourceInfo old spec.
		id: {
			value: data.deviceId
		},
		facing: {
			value: ''
		}
	});
}

},{}],4:[function(require,module,exports){
/**
 * Expose the MediaStream class.
 * Make MediaStream be a Blob so it can be consumed by URL.createObjectURL().
 */
var MediaStream = module.exports = window.Blob,


/**
 * Spec: http://w3c.github.io/mediacapture-main/#mediastream
 */


/**
 * Dependencies.
 */
	debug = require('debug')('iosrtc:MediaStream'),
	exec = require('cordova/exec'),
	MediaStreamTrack = require('./MediaStreamTrack'),
	EventTarget = require('./EventTarget');


/**
 * Class methods.
 */


MediaStream.create = function (dataFromEvent) {
	debug('create() | [dataFromEvent:%o]', dataFromEvent);

	var stream,
		trackId,
		track;

	// Note that this is the Blob constructor.
	stream = new MediaStream([dataFromEvent.id], {
		type: 'stream'
	});

	// Make it an EventTarget.
	EventTarget.call(stream);

	// Public atributes.
	stream.id = dataFromEvent.id;
	stream.label = dataFromEvent.id;  // Backwards compatibility.
	stream.active = true;

	// Private attributes.
	stream.audioTracks = {};
	stream.videoTracks = {};

	for (trackId in dataFromEvent.audioTracks) {
		if (dataFromEvent.audioTracks.hasOwnProperty(trackId)) {
			track = new MediaStreamTrack(dataFromEvent.audioTracks[trackId]);

			stream.audioTracks[track.id] = track;

			addListenerForTrackEnded.call(stream, track);
		}
	}

	for (trackId in dataFromEvent.videoTracks) {
		if (dataFromEvent.videoTracks.hasOwnProperty(trackId)) {
			track = new MediaStreamTrack(dataFromEvent.videoTracks[trackId]);

			stream.videoTracks[track.id] = track;

			addListenerForTrackEnded.call(stream, track);
		}
	}

	return stream;
};


// function MediaStream(dataFromEvent) {
// 	debug('new() | [dataFromEvent:%o]', dataFromEvent);

// 	var trackId,
// 		track;

// 	// Make this an EventTarget.
// 	EventTarget.call(this);

// 	// Public atributes.
// 	this.id = dataFromEvent.id;
// 	this.label = dataFromEvent.id;  // Backwards compatibility.
// 	this.active = true;  // TODO: No 'active' property in the RTCMediaStream ObjC class.

// 	// Private attributes.
// 	this.audioTracks = {};
// 	this.videoTracks = {};

// 	for (trackId in dataFromEvent.audioTracks) {
// 		if (dataFromEvent.audioTracks.hasOwnProperty(trackId)) {
// 			track = new MediaStreamTrack(dataFromEvent.audioTracks[trackId]);

// 			this.audioTracks[track.id] = track;
// 		}
// 	}

// 	for (trackId in dataFromEvent.videoTracks) {
// 		if (dataFromEvent.videoTracks.hasOwnProperty(trackId)) {
// 			track = new MediaStreamTrack(dataFromEvent.videoTracks[trackId]);

// 			this.videoTracks[track.id] = track;
// 		}
// 	}
// }


MediaStream.prototype.getAudioTracks = function () {
	debug('getAudioTracks()');

	var tracks = [],
		id;

	for (id in this.audioTracks) {
		if (this.audioTracks.hasOwnProperty(id)) {
			tracks.push(this.audioTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getVideoTracks = function () {
	debug('getVideoTracks()');

	var tracks = [],
		id;

	for (id in this.videoTracks) {
		if (this.videoTracks.hasOwnProperty(id)) {
			tracks.push(this.videoTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getTracks = function () {
	debug('getTracks()');

	var tracks = [],
		id;

	for (id in this.audioTracks) {
		if (this.audioTracks.hasOwnProperty(id)) {
			tracks.push(this.audioTracks[id]);
		}
	}

	for (id in this.videoTracks) {
		if (this.videoTracks.hasOwnProperty(id)) {
			tracks.push(this.videoTracks[id]);
		}
	}

	return tracks;
};


MediaStream.prototype.getTrackById = function (id) {
	debug('getTrackById()');

	return this.audioTracks[id] || this.videoTracks[id] || null;
};


MediaStream.prototype.addTrack = function (track) {
	debug('addTrack() [track:%o]', track);

	if (!(track instanceof MediaStreamTrack)) {
		throw new Error('argument must be an instance of MediaStreamTrack');
	}

	if (this.audioTracks[track.id] || this.videoTracks[track.id]) {
		return;
	}

	if (track.kind === 'audio') {
		this.audioTracks[track.id] = track;
	} else if (track.kind === 'video') {
		this.videoTracks[track.id] = track;
	} else {
		throw new Error('unknown kind attribute: ' + track.kind);
	}

	addListenerForTrackEnded.call(this, track);

	exec(null, null, 'iosrtcPlugin', 'MediaStream_addTrack', [this.id, track.id]);
};


MediaStream.prototype.removeTrack = function (track) {
	debug('removeTrack() [track:%o]', track);

	if (!(track instanceof MediaStreamTrack)) {
		throw new Error('argument must be an instance of MediaStreamTrack');
	}

	if (!this.audioTracks[track.id] && !this.videoTracks[track.id]) {
		return;
	}

	if (track.kind === 'audio') {
		delete this.audioTracks[track.id];
	} else if (track.kind === 'video') {
		delete this.videoTracks[track.id];
	} else {
		throw new Error('unknown kind attribute: ' + track.kind);
	}

	exec(null, null, 'iosrtcPlugin', 'MediaStream_removeTrack', [this.id, track.id]);

	checkActive.call(this);
};


// Backwards compatible API.
MediaStream.prototype.stop = function () {
	debug('stop()');

	var trackId;

	for (trackId in this.audioTracks) {
		if (this.audioTracks.hasOwnProperty(trackId)) {
			this.audioTracks[trackId].stop();
		}
	}

	for (trackId in this.videoTracks) {
		if (this.videoTracks.hasOwnProperty(trackId)) {
			this.videoTracks[trackId].stop();
		}
	}
};


// TODO: API methods and events.


/**
 * Private API.
 */


function addListenerForTrackEnded(track) {
	var self = this;

	// NOTE: Theorically I shouldn't remove ended tracks, but I do.
	track.addEventListener('ended', function () {
		if (track.kind === 'audio' && self.audioTracks[track.id]) {
			delete self.audioTracks[track.id];
		} else if (track.kind === 'video' && self.videoTracks[track.id]) {
			delete self.videoTracks[track.id];
		}

		checkActive.call(self);
	});
}


function checkActive() {
	if (Object.keys(this.audioTracks).length === 0 && Object.keys(this.videoTracks).length === 0) {
		debug('no tracks in the MediaStream, releasing it');

		this.active = false;
		this.dispatchEvent(new Event('inactive'));

		exec(null, null, 'iosrtcPlugin', 'MediaStream_release', [this.id]);
	}
}

},{"./EventTarget":2,"./MediaStreamTrack":6,"cordova/exec":undefined,"debug":15}],5:[function(require,module,exports){
/**
 * Expose the MediaStreamRenderer class.
 */
module.exports = MediaStreamRenderer;


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:MediaStreamRenderer'),
	debugerror = require('debug')('iosrtc:ERROR:MediaStreamRenderer'),
	exec = require('cordova/exec'),
	randomNumber = require('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = require('./EventTarget'),
	MediaStream = require('./MediaStream');


debugerror.log = console.warn.bind(console);


function MediaStreamRenderer(element) {
	debug('new() | [element:"%s"]', element);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	if (!(element instanceof HTMLElement)) {
		throw new Error('a valid HTMLElement is required');
	}

	// Public atributes.
	this.element = element;
	this.stream = undefined;

	// Private attributes.
	this.id = randomNumber();
	this.videoWidth = undefined;
	this.videoHeight = undefined;

	// Set black background.
	this.element.style.backgroundColor = '#000';

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'new_MediaStreamRenderer', [this.id]);

	this.refresh(this);
}


MediaStreamRenderer.prototype.render = function (stream) {
	debug('render() [stream:%o]', stream);

	if (!(stream instanceof MediaStream)) {
		throw new Error('render() requires a MediaStream instance as argument');
	}

	this.stream = stream;

	exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_render', [this.id, stream.id]);
};


MediaStreamRenderer.prototype.refresh = function () {
	debug('refresh()');

	/**
	 * First remove "width" and "height" from the inline style in the element (prebiously added
	 * by this method).
	 */

	this.element.style.width = null;
	this.element.style.height = null;

	var elementPositionAndSize = getElementPositionAndSize.call(this),
		videoRatio,
		elementRatio,
		elementLeft = elementPositionAndSize.left,
		elementTop = elementPositionAndSize.top,
		elementWidth = elementPositionAndSize.width,
		elementHeight = elementPositionAndSize.height,
		videoViewLeft = elementLeft,
		videoViewTop = elementTop,
		videoViewWidth = elementWidth,
		videoViewHeight = elementHeight,
		visible,
		opacity,
		zIndex;

	// visible
	if (window.getComputedStyle(this.element).visibility === 'hidden') {
		visible = false;
	} else {
		visible = !!this.element.offsetHeight;  // Returns 0 if element or any parent is hidden.
	}

	// opacity
	opacity = parseFloat(window.getComputedStyle(this.element).opacity);

	// zIndex
	zIndex = parseFloat(window.getComputedStyle(this.element).zIndex) || parseFloat(this.element.style.zIndex) || 0;

	/**
	 * No video yet, so just update the UIView with the element settings.
	 */

	if (!this.videoWidth || !this.videoHeight) {
		nativeRefresh.call(this);
		return;
	}

	videoRatio = this.videoWidth / this.videoHeight;

	/**
	 * Element has no width and/or no height.
	 */

	if (!elementWidth && !elementHeight) {
		debug('refresh() | no element width nor height');

		elementWidth = this.videoWidth;
		this.element.style.width = elementWidth + 'px';

		elementHeight = this.videoHeight;
		this.element.style.height = elementHeight + 'px';
	} else if (!elementWidth) {
		debug('refresh() | no element width');

		elementWidth = elementHeight * videoRatio;
		this.element.style.width = elementWidth + 'px';
	} else if (!elementHeight) {
		debug('refresh() | no element height');

		elementHeight = elementWidth / videoRatio;
		this.element.style.height = elementHeight + 'px';
	}

	/**
	 * Set video view position and size.
	 */

	elementRatio = elementWidth / elementHeight;

	debug('refresh() | [videoWidth:%s, videoHeight:%s, videoRatio:%s, elementRatio:%s]',
		this.videoWidth, this.videoHeight, videoRatio, elementRatio);

	// The element has higher or equal width/height ratio than the video.
	if (elementRatio >= videoRatio) {
		debug('refresh() | elementRatio:%s >= videoRatio:%s', elementRatio, videoRatio);

		videoViewHeight = elementHeight;
		videoViewWidth = videoViewHeight * videoRatio;
		videoViewLeft = elementLeft + ((elementWidth - videoViewWidth) / 2);
	// The element has lower width/height ratio than the video.
	} else if (elementRatio < videoRatio) {
		debug('refresh() | elementRatio:%s < videoRatio:%s', elementRatio, videoRatio);

		videoViewWidth = elementWidth;
		videoViewHeight = videoViewWidth / videoRatio;
		videoViewTop = elementTop + ((elementHeight - videoViewHeight) / 2);
	}

	nativeRefresh.call(this);

	function nativeRefresh() {
		debug('refresh() | videoView: [left:%d, top:%s, width:%s, height:%s, visible:%s, opacity:%s, zIndex:%s]',
			videoViewLeft, videoViewTop, videoViewWidth, videoViewHeight, visible, opacity, zIndex);

		exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_refresh', [
			this.id, videoViewLeft, videoViewTop, videoViewWidth, videoViewHeight, visible, opacity, zIndex
		]);
	}
};


MediaStreamRenderer.prototype.close = function () {
	debug('close()');

	this.stream = undefined;

	exec(null, null, 'iosrtcPlugin', 'MediaStreamRenderer_close', [this.id]);
};


/**
 * Private API.
 */


function onEvent(data) {
	var type = data.type,
		event;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'videoresize':
			this.videoWidth = data.size.width;
			this.videoHeight = data.size.height;
			this.refresh(this);

			event = new Event(type);
			event.videoWidth = data.size.width;
			event.videoHeight = data.size.height;
			this.dispatchEvent(event);

			break;
	}
}


function getElementPositionAndSize() {
	var rect = this.element.getBoundingClientRect();

	return {
		left:   rect.left + this.element.clientLeft,
		top:    rect.top + this.element.clientTop,
		width:  this.element.clientWidth,
		height: this.element.clientHeight
	};
}

},{"./EventTarget":2,"./MediaStream":4,"cordova/exec":undefined,"debug":15,"random-number":18}],6:[function(require,module,exports){
/**
 * Expose the MediaStreamTrack class.
 */
module.exports = MediaStreamTrack;


/**
 * Spec: http://w3c.github.io/mediacapture-main/#mediastreamtrack
 */


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:MediaStreamTrack'),
	exec = require('cordova/exec'),
	getMediaDevices = require('./getMediaDevices'),
	EventTarget = require('./EventTarget');


function MediaStreamTrack(dataFromEvent) {
	debug('new() | [dataFromEvent:%o]', dataFromEvent);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Public atributes.
	this.id = dataFromEvent.id;  // NOTE: It's a string.
	this.kind = dataFromEvent.kind;
	this.label = dataFromEvent.label;
	this.muted = false;  // TODO: No "muted" property in ObjC API.
	this.readyState = dataFromEvent.readyState;

	// Private attributes.
	this._enabled = dataFromEvent.enabled;
	this._ended = false;

	// Setters.
	Object.defineProperty(this, 'enabled', {
		get: function () {
			return self._enabled;
		},
		set: function (value) {
			self._enabled = !!value;
			exec(null, null, 'iosrtcPlugin', 'MediaStreamTrack_setEnabled', [self.id, self._enabled]);
		}
	});

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'MediaStreamTrack_setListener', [this.id]);
}


MediaStreamTrack.prototype.stop = function () {
	debug('stop()');

	if (this._ended) {
		return;
	}

	exec(null, null, 'iosrtcPlugin', 'MediaStreamTrack_stop', [this.id]);
};


// TODO: API methods and events.


/**
 * Class methods.
 */


MediaStreamTrack.getSources = function () {
	debug('getSources()');

	return getMediaDevices.apply(this, arguments);
};


/**
 * Private API.
 */


function onEvent(data) {
	var type = data.type;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'statechange':
			this.readyState = data.readyState;

			switch (data.readyState) {
				case 'initializing':
					break;
				case 'live':
					break;
				case 'ended':
					this._ended = true;
					this.dispatchEvent(new Event('ended'));
					break;
				case 'failed':
					break;
			}
			break;
	}
}

},{"./EventTarget":2,"./getMediaDevices":11,"cordova/exec":undefined,"debug":15}],7:[function(require,module,exports){
/**
 * Expose the RTCDataChannel class.
 */
module.exports = RTCDataChannel;


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:RTCDataChannel'),
	debugerror = require('debug')('iosrtc:ERROR:RTCDataChannel'),
	exec = require('cordova/exec'),
	randomNumber = require('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = require('./EventTarget');


debugerror.log = console.warn.bind(console);


function RTCDataChannel(peerConnection, label, options, dataFromEvent) {
	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Just 'arraybuffer' binaryType is implemented in Chromium.
	Object.defineProperty(this, 'binaryType', {
		get: function () {
			return 'arraybuffer';
		},
		set: function (type) {
			if (type !== 'arraybuffer') {
				throw new Error('just "arraybuffer" is implemented for binaryType');
			}
		}
	});

	// Created via pc.createDataChannel().
	if (!dataFromEvent) {
		debug('new() | [label:%o, options:%o]', label, options);

		if (!label || typeof label !== 'string') {
			throw new Error('label argument required');
		}

		options = options || {};

		if (options.hasOwnProperty('maxPacketLifeTime') && options.hasOwnProperty('maxRetransmits')) {
			throw new SyntaxError('both maxPacketLifeTime and maxRetransmits can not be present');
		}

		if (options.hasOwnProperty('id')) {
			if (typeof options.id !== 'number' || isNaN(options.id) || options.id < 0) {
				throw new SyntaxError('id must be a number');
			}
			// TODO:
			//   https://code.google.com/p/webrtc/issues/detail?id=4618
			if (options.id > 1023) {
				throw new SyntaxError('id cannot be greater than 1023 (https://code.google.com/p/webrtc/issues/detail?id=4614)');
			}
		}

		// Public atributes.
		this.label = label;
		this.ordered = options.hasOwnProperty('ordered') ? !!options.ordered : true;
		this.maxPacketLifeTime = options.hasOwnProperty('maxPacketLifeTime') ? Number(options.maxPacketLifeTime) : null;
		this.maxRetransmits = options.hasOwnProperty('maxRetransmits') ? Number(options.maxRetransmits) : null;
		this.protocol = options.hasOwnProperty('protocol') ? String(options.protocol) : '';
		this.negotiated = options.hasOwnProperty('negotiated') ? !!options.negotiated : false;
		this.id = options.hasOwnProperty('id') ? Number(options.id) : undefined;
		this.readyState = 'connecting';
		this.bufferedAmount = 0;

		// Private attributes.
		this.peerConnection = peerConnection;
		this.dcId = randomNumber();

		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_createDataChannel', [this.peerConnection.pcId, this.dcId, label, options]);
	// Created via pc.ondatachannel.
	} else {
		debug('new() | [dataFromEvent:%o]', dataFromEvent);

		// Public atributes.
		this.label = dataFromEvent.label;
		this.ordered = dataFromEvent.ordered;
		this.maxPacketLifeTime = dataFromEvent.maxPacketLifeTime;
		this.maxRetransmits = dataFromEvent.maxRetransmits;
		this.protocol = dataFromEvent.protocol || '';
		this.negotiated = dataFromEvent.negotiated;
		this.id = dataFromEvent.id;
		this.readyState = dataFromEvent.readyState;
		this.bufferedAmount = dataFromEvent.bufferedAmount;

		// Private attributes.
		this.peerConnection = peerConnection;
		this.dcId = dataFromEvent.dcId;

		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_setListener', [this.peerConnection.pcId, this.dcId]);
	}

	function onResultOK(data) {
		if (data.type) {
			onEvent.call(self, data);
		// Special handler for received binary mesage.
		} else {
			onEvent.call(self, {
				type: 'message',
				message: data
			});
		}
	}
}


RTCDataChannel.prototype.send = function (data) {
	if (isClosed.call(this) || this.readyState !== 'open') {
		return;
	}

	debug('send() | [data:%o]', data);

	if (!data) {
		return;
	}

	var self = this;

	function onResultOK(data) {
		self.bufferedAmount = data.bufferedAmount;
	}

	if (typeof data === 'string' || data instanceof String) {
		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendString', [this.peerConnection.pcId, this.dcId, data]);
	} else if (window.ArrayBuffer && data instanceof window.ArrayBuffer) {
		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendBinary', [this.peerConnection.pcId, this.dcId, data]);
	} else if (
		(window.Int8Array && data instanceof window.Int8Array) ||
		(window.Uint8Array && data instanceof window.Uint8Array) ||
		(window.Uint8ClampedArray && data instanceof window.Uint8ClampedArray) ||
		(window.Int16Array && data instanceof window.Int16Array) ||
		(window.Uint16Array && data instanceof window.Uint16Array) ||
		(window.Int32Array && data instanceof window.Int32Array) ||
		(window.Uint32Array && data instanceof window.Uint32Array) ||
		(window.Float32Array && data instanceof window.Float32Array) ||
		(window.Float64Array && data instanceof window.Float64Array) ||
		(window.DataView && data instanceof window.DataView)
	) {
		exec(onResultOK, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_sendBinary', [this.peerConnection.pcId, this.dcId, data.buffer]);
	} else {
		throw new Error('invalid data type');
	}
};


RTCDataChannel.prototype.close = function () {
	if (isClosed.call(this)) {
		return;
	}

	debug('close()');

	this.readyState = 'closing';

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_RTCDataChannel_close', [this.peerConnection.pcId, this.dcId]);
};


/**
 * Private API.
 */


function isClosed() {
	return this.readyState === 'closed' || this.readyState === 'closing' || this.peerConnection.signalingState === 'closed';
}


function onEvent(data) {
	var type = data.type,
		event;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'new':
			// Update properties and exit without firing the event.
			this.ordered = data.channel.ordered;
			this.maxPacketLifeTime = data.channel.maxPacketLifeTime;
			this.maxRetransmits = data.channel.maxRetransmits;
			this.negotiated = data.channel.negotiated;
			this.id = data.channel.id;
			this.readyState = data.channel.readyState;
			this.bufferedAmount = data.channel.bufferedAmount;
			break;

		case 'statechange':
			this.readyState = data.readyState;

			switch (data.readyState) {
				case 'connecting':
					break;
				case 'open':
					this.dispatchEvent(new Event('open'));
					break;
				case 'closing':
					break;
				case 'closed':
					this.dispatchEvent(new Event('close'));
					break;
			}
			break;

		case 'message':
			event = new Event('message');
			event.data = data.message;
			this.dispatchEvent(event);
			break;
	}
}

},{"./EventTarget":2,"cordova/exec":undefined,"debug":15,"random-number":18}],8:[function(require,module,exports){
/**
 * Expose the RTCIceCandidate class.
 */
module.exports = RTCIceCandidate;


function RTCIceCandidate(data) {
	data = data || {};

	// Public atributes.
	this.sdpMid = data.sdpMid;
	this.sdpMLineIndex = data.sdpMLineIndex;
	this.candidate = data.candidate;
}

},{}],9:[function(require,module,exports){
(function (global){
/**
 * Expose the RTCPeerConnection class.
 */
module.exports = RTCPeerConnection;


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:RTCPeerConnection'),
	debugerror = require('debug')('iosrtc:ERROR:RTCPeerConnection'),
	exec = require('cordova/exec'),
	randomNumber = require('random-number').generator({min: 10000, max: 99999, integer: true}),
	EventTarget = require('./EventTarget'),
	RTCSessionDescription = require('./RTCSessionDescription'),
	RTCIceCandidate = require('./RTCIceCandidate'),
	RTCDataChannel = require('./RTCDataChannel'),
	MediaStream = require('./MediaStream'),
	Errors = require('./Errors');


debugerror.log = console.warn.bind(console);


function RTCPeerConnection(pcConfig, pcConstraints) {
	debug('new() | [pcConfig:%o, pcConstraints:%o]', pcConfig, pcConstraints);

	var self = this;

	// Make this an EventTarget.
	EventTarget.call(this);

	// Public atributes.
	this.localDescription = null;
	this.remoteDescription = null;
	this.signalingState = 'stable';
	this.iceGatheringState = 'new';
	this.iceConnectionState = 'new';
	this.pcConfig = fixPcConfig(pcConfig);

	// Private attributes.
	this.pcId = randomNumber();
	this.localStreams = {};
	this.remoteStreams = {};

	function onResultOK(data) {
		onEvent.call(self, data);
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'new_RTCPeerConnection', [this.pcId, this.pcConfig, pcConstraints]);
}


RTCPeerConnection.prototype.createOffer = function () {
	var self = this,
		isPromise,
		options,
		callback, errback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
		options = arguments[0];
	} else {
		isPromise = false;
		callback = arguments[0];
		errback = arguments[1];
		options = arguments[2];
	}

	if (isClosed.call(this)) {
		return;
	}

	debug('createOffer() [options:%o]', options);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				var desc = new RTCSessionDescription(data);

				debug('createOffer() | success [desc:%o]', desc);
				resolve(desc);
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('createOffer() | failure: %s', error);
				reject(new global.DOMError(error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createOffer', [self.pcId, options]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		var desc = new RTCSessionDescription(data);

		debug('createOffer() | success [desc:%o]', desc);
		callback(desc);
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('createOffer() | failure: %s', error);
		if (typeof errback === 'function') {
			errback(new global.DOMError(error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createOffer', [this.pcId, options]);
};


RTCPeerConnection.prototype.createAnswer = function () {
	var self = this,
		isPromise,
		options,
		callback, errback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
		options = arguments[0];
	} else {
		isPromise = false;
		callback = arguments[0];
		errback = arguments[1];
		options = arguments[2];
	}

	if (isClosed.call(this)) {
		return;
	}

	debug('createAnswer() [options:%o]', options);

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				var desc = new RTCSessionDescription(data);

				debug('createAnswer() | success [desc:%o]', desc);
				resolve(desc);
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('createAnswer() | failure: %s', error);
				reject(new global.DOMError(error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createAnswer', [self.pcId, options]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		var desc = new RTCSessionDescription(data);

		debug('createAnswer() | success [desc:%o]', desc);
		callback(desc);
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('createAnswer() | failure: %s', error);
		if (typeof errback === 'function') {
			errback(new global.DOMError(error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_createAnswer', [this.pcId, options]);
};



RTCPeerConnection.prototype.setLocalDescription = function (desc) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('setLocalDescription() [desc:%o]', desc);

	if (!(desc instanceof RTCSessionDescription)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidSessionDescriptionError('setLocalDescription() must be called with a RTCSessionDescription instance as first argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.InvalidSessionDescriptionError('setLocalDescription() must be called with a RTCSessionDescription instance as first argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('setLocalDescription() | success');
				// Update localDescription.
				self.localDescription = new RTCSessionDescription(data);
				resolve();
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('setLocalDescription() | failure: %s', error);
				reject(new Errors.InvalidSessionDescriptionError('setLocalDescription() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setLocalDescription', [self.pcId, desc]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('setLocalDescription() | success');
		// Update localDescription.
		self.localDescription = new RTCSessionDescription(data);
		callback();
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('setLocalDescription() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.InvalidSessionDescriptionError('setLocalDescription() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setLocalDescription', [this.pcId, desc]);
};


RTCPeerConnection.prototype.setRemoteDescription = function (desc) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('setRemoteDescription() [desc:%o]', desc);

	if (!(desc instanceof RTCSessionDescription)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidSessionDescriptionError('setRemoteDescription() must be called with a RTCSessionDescription instance as first argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.InvalidSessionDescriptionError('setRemoteDescription() must be called with a RTCSessionDescription instance as first argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('setRemoteDescription() | success');
				// Update remoteDescription.
				self.remoteDescription = new RTCSessionDescription(data);
				resolve();
			}

			function onResultError(error) {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('setRemoteDescription() | failure: %s', error);
				reject(new Errors.InvalidSessionDescriptionError('setRemoteDescription() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setRemoteDescription', [self.pcId, desc]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('setRemoteDescription() | success');
		// Update remoteDescription.
		self.remoteDescription = new RTCSessionDescription(data);
		callback();
	}

	function onResultError(error) {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('setRemoteDescription() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.InvalidSessionDescriptionError('setRemoteDescription() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_setRemoteDescription', [this.pcId, desc]);
};



RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
	var self = this,
		isPromise,
		callback, errback;

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (isClosed.call(this)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.InvalidStateError('peerconnection is closed'));
			});
		} else {
			throw new Errors.InvalidStateError('peerconnection is closed');
		}
	}

	debug('addIceCandidate() | [candidate:%o]', candidate);

	if (!(candidate instanceof RTCIceCandidate)) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new global.DOMError('addIceCandidate() must be called with a RTCIceCandidate instance as first argument'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new global.DOMError('addIceCandidate() must be called with a RTCIceCandidate instance as first argument'));
			}
			return;
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				if (isClosed.call(self)) {
					return;
				}

				debug('addIceCandidate() | success');
				// Update remoteDescription.
				if (self.remoteDescription && data.remoteDescription) {
					self.remoteDescription.type = data.remoteDescription.type;
					self.remoteDescription.sdp = data.remoteDescription.sdp;
				} else if (data.remoteDescription) {
					self.remoteDescription = new RTCSessionDescription(data.remoteDescription);
				}
				resolve();
			}

			function onResultError() {
				if (isClosed.call(self)) {
					return;
				}

				debugerror('addIceCandidate() | failure');
				reject(new global.DOMError('addIceCandidate() failed'));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_addIceCandidate', [self.pcId, candidate]);
		});
	}

	function onResultOK(data) {
		if (isClosed.call(self)) {
			return;
		}

		debug('addIceCandidate() | success');
		// Update remoteDescription.
		if (self.remoteDescription && data.remoteDescription) {
			self.remoteDescription.type = data.remoteDescription.type;
			self.remoteDescription.sdp = data.remoteDescription.sdp;
		} else if (data.remoteDescription) {
			self.remoteDescription = new RTCSessionDescription(data.remoteDescription);
		}
		callback();
	}

	function onResultError() {
		if (isClosed.call(self)) {
			return;
		}

		debugerror('addIceCandidate() | failure');
		if (typeof errback === 'function') {
			errback(new global.DOMError('addIceCandidate() failed'));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'RTCPeerConnection_addIceCandidate', [this.pcId, candidate]);
};


RTCPeerConnection.prototype.getConfiguration = function () {
	debug('getConfiguration()');

	return this.pcConfig;
};


RTCPeerConnection.prototype.getLocalStreams = function () {
	debug('getLocalStreams()');

	var streams = [],
		id;

	for (id in this.localStreams) {
		if (this.localStreams.hasOwnProperty(id)) {
			streams.push(this.localStreams[id]);
		}
	}

	return streams;
};


RTCPeerConnection.prototype.getRemoteStreams = function () {
	debug('getRemoteStreams()');

	var streams = [],
		id;

	for (id in this.remoteStreams) {
		if (this.remoteStreams.hasOwnProperty(id)) {
			streams.push(this.remoteStreams[id]);
		}
	}

	return streams;
};


RTCPeerConnection.prototype.getStreamById = function (id) {
	debug('getStreamById()');

	return this.localStreams[id] || this.remoteStreams[id] || null;
};


RTCPeerConnection.prototype.addStream = function (stream) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('addStream()');

	if (!(stream instanceof MediaStream)) {
		throw new Error('addStream() must be called with a MediaStream instance as argument');
	}

	if (this.localStreams[stream.id]) {
		debugerror('addStream() | given stream already in present in local streams');
		return;
	}

	this.localStreams[stream.id] = stream;

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_addStream', [this.pcId, stream.id]);
};


RTCPeerConnection.prototype.removeStream = function (stream) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('removeStream()');

	if (!(stream instanceof MediaStream)) {
		throw new Error('removeStream() must be called with a MediaStream instance as argument');
	}

	if (!this.localStreams[stream.id]) {
		debugerror('removeStream() | given stream not present in local streams');
		return;
	}

	delete this.localStreams[stream.id];

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_removeStream', [this.pcId, stream.id]);
};


RTCPeerConnection.prototype.createDataChannel = function (label, options) {
	if (isClosed.call(this)) {
		throw new Errors.InvalidStateError('peerconnection is closed');
	}

	debug('createDataChannel() [label:%s, options:%o]', label, options);

	return new RTCDataChannel(this, label, options);
};


RTCPeerConnection.prototype.close = function () {
	if (isClosed.call(this)) {
		return;
	}

	debug('close()');

	exec(null, null, 'iosrtcPlugin', 'RTCPeerConnection_close', [this.pcId]);
};


/**
 * Private API.
 */


function fixPcConfig(pcConfig) {
	if (!pcConfig) {
		return {
			iceServers: []
		};
	}

	var iceServers = pcConfig.iceServers,
		i, len, iceServer;

	if (!Array.isArray(iceServers)) {
		pcConfig.iceServers = [];
		return pcConfig;
	}

	for (i = 0, len = iceServers.length; i < len; i++) {
		iceServer = iceServers[i];

		// THe Objective-C wrapper of WebRTC is old and does not implement .urls.
		if (iceServer.url) {
			continue;
		} else if (Array.isArray(iceServer.urls)) {
			iceServer.url = iceServer.urls[0];
		} else if (typeof iceServer.urls === 'string') {
			iceServer.url = iceServer.urls;
		}
	}

	return pcConfig;
}


function isClosed() {
	return this.signalingState === 'closed';
}


function onEvent(data) {
	var type = data.type,
		event = new Event(type),
		stream,
		dataChannel;

	debug('onEvent() | [type:%s, data:%o]', type, data);

	switch (type) {
		case 'signalingstatechange':
			this.signalingState = data.signalingState;
			break;

		case 'icegatheringstatechange':
			this.iceGatheringState = data.iceGatheringState;
			break;

		case 'iceconnectionstatechange':
			this.iceConnectionState = data.iceConnectionState;
			break;

		case 'icecandidate':
			if (data.candidate) {
				event.candidate = new RTCIceCandidate(data.candidate);
			} else {
				event.candidate = null;
			}
			// Update localDescription.
			if (this.localDescription) {
				this.localDescription.type = data.localDescription.type;
				this.localDescription.sdp = data.localDescription.sdp;
			} else {
				this.localDescription = new RTCSessionDescription(data);
			}
			break;

		case 'negotiationneeded':
			break;

		case 'addstream':
			stream = MediaStream.create(data.stream);
			event.stream = stream;
			// Append to the remote streams.
			this.remoteStreams[stream.id] = stream;
			break;

		case 'removestream':
			stream = this.remoteStreams[data.streamId];
			event.stream = stream;
			// Remove from the remote streams.
			delete this.remoteStreams[stream.id];
			break;

		case 'datachannel':
			dataChannel = new RTCDataChannel(this, null, null, data.channel);
			event.channel = dataChannel;
			break;
	}

	this.dispatchEvent(event);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Errors":1,"./EventTarget":2,"./MediaStream":4,"./RTCDataChannel":7,"./RTCIceCandidate":8,"./RTCSessionDescription":10,"cordova/exec":undefined,"debug":15,"random-number":18}],10:[function(require,module,exports){
/**
 * Expose the RTCSessionDescription class.
 */
module.exports = RTCSessionDescription;


function RTCSessionDescription(data) {
	data = data || {};

	// Public atributes.
	this.type = data.type;
	this.sdp = data.sdp;
}

},{}],11:[function(require,module,exports){
/**
 * Expose the getMediaDevices function.
 */
module.exports = getMediaDevices;


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:getMediaDevices'),
	exec = require('cordova/exec'),
	MediaDeviceInfo = require('./MediaDeviceInfo');


function getMediaDevices() {
	debug('');

	var isPromise,
		callback;

	if (typeof arguments[0] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[0];
	}

	if (isPromise) {
		return new Promise(function (resolve) {
			function onResultOK(data) {
				debug('getMediaDevices() | success');
				resolve(getMediaDeviceInfos(data.devices));
			}

			exec(onResultOK, null, 'iosrtcPlugin', 'getMediaDevices', []);
		});
	}

	function onResultOK(data) {
		debug('getMediaDevices() | success');
		callback(getMediaDeviceInfos(data.devices));
	}

	exec(onResultOK, null, 'iosrtcPlugin', 'getMediaDevices', []);
}


/**
 * Private API.
 */


function getMediaDeviceInfos(devices) {
	debug('getMediaDeviceInfos() | [devices:%o]', devices);

	var id,
		mediaDeviceInfos = [];

	for (id in devices) {
		if (devices.hasOwnProperty(id)) {
			mediaDeviceInfos.push(new MediaDeviceInfo(devices[id]));
		}
	}

	return mediaDeviceInfos;
}

},{"./MediaDeviceInfo":3,"cordova/exec":undefined,"debug":15}],12:[function(require,module,exports){
/**
 * Expose the getUserMedia function.
 */
module.exports = getUserMedia;


/**
 * Dependencies.
 */
var
	debug = require('debug')('iosrtc:getUserMedia'),
	debugerror = require('debug')('iosrtc:ERROR:getUserMedia'),
	exec = require('cordova/exec'),
	MediaStream = require('./MediaStream'),
	Errors = require('./Errors');


debugerror.log = console.warn.bind(console);


function getUserMedia(constraints) {
	debug('[constraints:%o]', constraints);

	var isPromise,
		callback, errback,
		audioRequested = false,
		videoRequested = false,
		videoOptionalConstraints,
		videoMandatoryConstraints,
		videoDeviceId,
		newConstraints = {
			audio: false,
			video: false
		};

	if (typeof arguments[1] !== 'function') {
		isPromise = true;
	} else {
		isPromise = false;
		callback = arguments[1];
		errback = arguments[2];
	}

	if (
		typeof constraints !== 'object' ||
		(!constraints.hasOwnProperty('audio') && !constraints.hasOwnProperty('video'))
	) {
		if (isPromise) {
			return new Promise(function (resolve, reject) {
				reject(new Errors.MediaStreamError('constraints must be an object with at least "audio" or "video" boolean fields'));
			});
		} else {
			if (typeof errback === 'function') {
				errback(new Errors.MediaStreamError('constraints must be an object with at least "audio" or "video" boolean fields'));
			}
			return;
		}
	}

	if (constraints.audio) {
		audioRequested = true;
		newConstraints.audio = true;
	}
	if (constraints.video) {
		videoRequested = true;
		newConstraints.video = true;
	}

	// Example:
	//
	// getUserMedia({
	//  audio: true,
	//  video: {
	//  	optional: [
	//  		{ sourceId: 'qwe-asd-zxc-123' }
	//  	]
	//  }
	// });

	if (videoRequested && Array.isArray(constraints.video.optional)) {
		videoOptionalConstraints = constraints.video.optional;

		if (videoOptionalConstraints[0]) {
			videoDeviceId = videoOptionalConstraints[0].sourceId;

			if (typeof videoDeviceId === 'string') {
				newConstraints.videoDeviceId = videoDeviceId;
			}
		}
	}

	if (videoRequested && Array.isArray(constraints.video.mandatory)) {
		videoMandatoryConstraints = constraints.video.mandatory;

		if (videoMandatoryConstraints[0]) {
			videoDeviceId = videoMandatoryConstraints[0].sourceId;

			if (typeof videoDeviceId === 'string') {
				newConstraints.videoDeviceId = videoDeviceId;
			}
		}
	}

	if (isPromise) {
		return new Promise(function (resolve, reject) {
			function onResultOK(data) {
				debug('getUserMedia() | success');
				resolve(MediaStream.create(data.stream));
			}

			function onResultError(error) {
				debugerror('getUserMedia() | failure: %s', error);
				reject(new Errors.MediaStreamError('getUserMedia() failed: ' + error));
			}

			exec(onResultOK, onResultError, 'iosrtcPlugin', 'getUserMedia', [newConstraints]);
		});
	}

	function onResultOK(data) {
		debug('getUserMedia() | success');
		callback(MediaStream.create(data.stream));
	}

	function onResultError(error) {
		debugerror('getUserMedia() | failure: %s', error);

		if (typeof errback === 'function') {
			errback(new Errors.MediaStreamError('getUserMedia() failed: ' + error));
		}
	}

	exec(onResultOK, onResultError, 'iosrtcPlugin', 'getUserMedia', [newConstraints]);
}

},{"./Errors":1,"./MediaStream":4,"cordova/exec":undefined,"debug":15}],13:[function(require,module,exports){
/**
 * Dependencies.
 */
var exec = require('cordova/exec');


/**
 * Expose the iosrtc object.
 */
module.exports = {
	// Expose WebRTC classes and functions.
	getUserMedia:          require('./getUserMedia'),
	getMediaDevices:       require('./getMediaDevices'),
	RTCPeerConnection:     require('./RTCPeerConnection'),
	RTCSessionDescription: require('./RTCSessionDescription'),
	RTCIceCandidate:       require('./RTCIceCandidate'),
	MediaStreamTrack:      require('./MediaStreamTrack'),
	MediaStreamRenderer:   require('./MediaStreamRenderer'),

	// Expose the rtcninjaPlugin module.
	rtcninjaPlugin:        require('./rtcninjaPlugin'),

	// Expose the debug module.
	debug:                 require('debug'),

	// TMP: Debug function to see what happens internally.
	dump:                  dump
};


function dump() {
	exec(null, null, 'iosrtcPlugin', 'dump', []);
}


},{"./MediaStreamRenderer":5,"./MediaStreamTrack":6,"./RTCIceCandidate":8,"./RTCPeerConnection":9,"./RTCSessionDescription":10,"./getMediaDevices":11,"./getUserMedia":12,"./rtcninjaPlugin":14,"cordova/exec":undefined,"debug":15}],14:[function(require,module,exports){
/**
 * Expose the rtcninjaPlugin object.
 */
module.exports = {
	isRequired: function () {
		return true;
	},

	isInstalled: function () {
		return true;
	},

	interface: {
		RTCPeerConnection: require('./RTCPeerConnection'),
		RTCSessionDescription: require('./RTCSessionDescription'),
		RTCIceCandidate: require('./RTCIceCandidate'),
		canRenegotiate: true,
		getUserMedia: require('./getUserMedia'),
		getMediaDevices: require('./getMediaDevices')
	}
};

},{"./RTCIceCandidate":8,"./RTCPeerConnection":9,"./RTCSessionDescription":10,"./getMediaDevices":11,"./getUserMedia":12}],15:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":16}],16:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":17}],17:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],18:[function(require,module,exports){
void function(root){

  function defaults(options){
    var options = options || {}
    var min = options.min
    var max = options.max
    var integer = options.integer || false
    if ( min == null && max == null ) {
      min = 0
      max = 1
    } else if ( min == null ) {
      min = max - 1
    } else if ( max == null ) {
      max = min + 1
    }
    if ( max < min ) throw new Error('invalid options, max must be >= min')
    return {
      min:     min
    , max:     max
    , integer: integer
    }
  }

  function random(options){
    options = defaults(options)
    if ( options.max === options.min ) return options.min
    var r = Math.random() * (options.max - options.min + Number(!!options.integer)) + options.min
    return options.integer ? Math.floor(r) : r
  }

  function generator(options){
    options = defaults(options)
    return function(min, max, integer){
      options.min     = min     || options.min
      options.max     = max     || options.max
      options.integer = integer != null ? integer : options.integer
      return random(options)
    }
  }

  module.exports =  random
  module.exports.generator = generator
  module.exports.defaults = defaults
}(this)

},{}]},{},[13])(13)
});