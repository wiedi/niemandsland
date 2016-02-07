"use strict"

var fs      = require('fs')
var path    = require('path')
var http    = require('http')
var mkdirp  = require('mkdirp')
var bloem   = require('bloem')
var request = require('request')
var progress = require('request-progress')
var async   = require('async')
var TimeFilter = require('./timefilter')


function Peer(url) {
	this.slots = 8
	this.workers = 0
	this.url   = url
	this.progress = {}
	this.transferred = 0
	this.filter = new bloem.Bloem(1, 1) // preset with simple empty filter
	this.negative_filter = new TimeFilter(5 * 60 * 1000)
	this.updateFilter()
}

Peer.prototype.updateFilter = function() {
	var self = this
	request(this.url + '/filter', function(error, response, body) {
		if(!error && response.statusCode == 200) {
			// todo: check if data is a sane filter configuration
			try {
				self.filter = bloem.ScalingBloem.destringify(JSON.parse(body))
			} catch(e) {
				console.log(e)
			}
		} else {
			console.log(error)
		}
	})
}

Peer.prototype.get = function(hash, destinations_, download_folder, callback) {
	var self = this
	this.workers++
	var destinations = destinations_.slice()
	var r = request({
		url: this.url + '/.well-known/ni/sha-256/' + Buffer(hash, 'hex').toString('base64').replace(/=/g, ''),
		encoding: null
	}, function(error, response) {
		self.workers--

		var errorCode = false
		if(error || response.statusCode !== 200) {
			self.negative_filter.add(hash)

			errorCode = -1
			if(response && response.statusCode)
				errorCode = response.statusCode
		} else {
			self.transferred += parseInt(response.headers['content-length'], 10)
		}

		delete self.progress[hash]

		callback(errorCode, hash, destinations)
	})

	progress(r, {throttle: 500}).on('progress', function(state) {
		self.progress[hash] = state
	})

	r.pause()
	r.setMaxListeners(100)

	async.each(destinations, function(destination, cb) {
		mkdirp(path.dirname(download_folder + '/' + destination), function(err) {
			if(err) {
				console.log(download_folder + '/' + destination, err)
				return
			}
			var d = fs.createWriteStream(download_folder + '/' + destination)
			r.pipe(d)
			cb()
		})
	}, function(err) {
		r.resume()
	})
}

Peer.prototype.getSpeed = function() {
	var speed = 0;

	Object.keys(this.progress).forEach(function(key) {
		speed += this.progress[key].speed
	}.bind(this))

	return speed;
}

Peer.prototype.getTransferred = function () {
	var transferred = this.transferred

	Object.keys(this.progress).forEach(function(key) {
		transferred += this.progress[key].size.transferred
	}.bind(this))

	return transferred
}

Peer.prototype.has = function(id) {
	if(this.negative_filter.has(id)) return false

	return this.filter.has(Buffer(id, 'hex'))
}

Peer.prototype.stop = function () {
	this.negative_filter.stop()
}

module.exports = Peer
