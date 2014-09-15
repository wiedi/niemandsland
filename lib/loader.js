"use strict"
var fs     = require('fs')

var Peer = require('./peer')

function Loader(wishlist, destination, servers) {
	var self = this

	this.wishlist = wishlist
	this.destination = destination
	this.peers = []

	servers.forEach(function(server) {
		self.peers.push(new Peer(server))
	})

	this.processQueue()
	this.queueInterval = setInterval(this.processQueue.bind(this), 5000) /* retry every 5 seconds */
}


Loader.prototype.processQueue = function() {
	var self = this
	var pieces = this.wishlist.hashes()
	console.log(this.peers, pieces.length)
	if(pieces.length < 1) {
		console.log('DONEX')
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
			console.log(peer_i,id,peer.has(id))
			if(peer.has(id)) {
				var destinations = this.wishlist.byHash(id)
				self.wishlist.removeHash(id)
				peer.get(id, destinations, self.destination, function(err, msg) {
					if(err) {
						destinations.forEach(function(destination) {
							self.wishlist.add(destination, id)
						})
						console.log(msg)
						return
					}
					console.log('+OK ', id, destinations)
				})
			}
		}
	}
}

module.exports = Loader
