"use strict"

var fs      = require('fs')
var path    = require('path')
var http    = require('http')
var mkdirp  = require('mkdirp')
var bloem   = require('bloem')
var request = require('request')

function Peer(url) {
	this.slots = 3
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

Peer.prototype.get = function(hash, destinations, download_folder, callback) {
	var self = this
	this.workers++
	var r = request({
		url: this.url + '/.well-known/ni/sha-256/' + hash,
		encoding: null
	}, function(error, response) {
		self.workers--
		if(!error && response.statusCode == 200) {
			callback(false)
		} else {
			//fs.unlink()
			callback(true, error)
		}
	})
	r.on('response', function (response) {
		console.log('RXSPON')
	})
	destinations.forEach(function(destination) {
		mkdirp(path.dirname(download_folder + '/' + destination), function(err) {
			if(err) {
				console.log(err)
				return
			}
			var d = fs.createWriteStream(download_folder + '/' + destination)
			r.pipe(d)
		})
	})
	

}

Peer.prototype.has = function(id) {
	return this.filter.has(Buffer(id, 'hex'))
}

module.exports = Peer

