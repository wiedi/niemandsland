"use strict"

var fs   = require('fs')
var mdns = require('mdns')
var sprintf = require('sprintf-js').sprintf
var pretty = require('pretty-byte')
var Peer = require('./peer')

/* returns URL for mdns service */
function mdnsServiceURL(service) {
	return 'http://' + service.host + ':' + service.port
}

function Loader(wishlist, destination, servers) {
	var self = this

	this.wishlist = wishlist
	this.destination = destination
	this.peers = []

	servers.forEach(function(server) {
		self.peers.push(new Peer(server))
	})

	this.processQueue()
	this.queueInterval = setInterval(this.processQueue.bind(this), 5) /* retry often */
	this.statusInterval = setInterval(this.printStatus.bind(this), 1000)


	this.mdns_browser = mdns.createBrowser(mdns.tcp('ni'))
	this.mdns_browser.on('serviceUp', function(service) {
		self.peers.push(new Peer(mdnsServiceURL(service)))
	})
	this.mdns_browser.on('serviceDown', function(service) {
		var url = mdnsServiceURL(service)
		for(var i = 0; i < self.peers.length; i++) {
			if(self.peers[i].url == url) {
				self.peers.splice(i, 1)
				return
			}
		}
	})
	this.mdns_browser.start()
}

Loader.prototype.printStatus = function() {
	var workers = 0
	var speed = 0
	var transferred = 0

	this.peers.forEach(function(p) {
		workers += p.workers
		speed += p.getSpeed()
		transferred += p.getTransferred()
	})

	var status = {
		hashes: this.wishlist.hashes().length,
		peers: this.peers.length,
		workers: workers,
		transferred: pretty(transferred || NaN),
		speed: pretty(speed || NaN),
	}

	console.log(sprintf('[%(hashes)i / %(peers)i] %(workers)i workers busy (transferred: %(transferred)s, speed: %(speed)s/s)', status))
}

Loader.prototype.processQueue = function() {
	var self = this
	var pieces = this.wishlist.hashes()
	var busyWorkers = 0;
	this.peers.forEach(function(p) {
		busyWorkers += p.workers
	})

	if(pieces.length < 1 && busyWorkers < 1) {
		clearInterval(this.queueInterval)
		clearInterval(this.statusInterval)

		this.peers.forEach(function(p) {
			p.stop()
		})

		this.printStatus()
		console.log('Done')

		this.mdns_browser.stop()
		return /* nothing to do */
	}

	peer_selection:
	for(var peer_i = 0; peer_i < this.peers.length; peer_i++) {
		var peer = this.peers[peer_i]
		for(var piece_i = 0; piece_i < pieces.length; piece_i++) {
			var id = pieces[piece_i]
			if(peer.workers > peer.slots) {
				continue peer_selection /* peer has enough work.. next */
			}
			if(peer.has(id)) {
				var destinations = this.wishlist.byHash(id)
				self.wishlist.removeHash(id)
				peer.get(id, destinations, self.destination, function(err, id, destinations) {

					//setTimeout(self.processQueue.bind(self), 1)
					if(err) {
						console.log('error', err, id, destinations)
						destinations.forEach(function(destination) {
							self.wishlist.add(destination, id)
						})
						return
					}
					destinations.forEach(function(d) {
						//console.log('[' + pieces.length + '/' + self.peers.length + '] ' + id, d)
					})
				})
			}
		}
	}
}

module.exports = Loader
