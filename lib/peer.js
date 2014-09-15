"use strict"

var fs      = require('fs')
var path    = require('path')
var http    = require('http')
var mkdirp  = require('mkdirp')
var bloem   = require('bloem')
var request = require('request')
var async   = require('async')


function Peer(url) {
	this.slots = 8
	this.workers = 0
	this.url   = url
	this.filter = new bloem.Bloem(1, 1) // preset with simple empty filter
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
		if(!error && response.statusCode == 200) {
			callback(false, hash, destinations)
		} else {
			//fs.unlink()
			callback(true, hash, destinations)
		}
	})
	r.pause()
	r.setMaxListeners(100)
	/*
	r.on('response', function (response) {
		console.log('RXSPON', response.statusCode)
	})
	*/
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

Peer.prototype.has = function(id) {
	return this.filter.has(Buffer(id, 'hex'))
}

module.exports = Peer

