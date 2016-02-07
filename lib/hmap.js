"use strict"

function HMap() {
	this.by_path = {}
	this.by_hash = {}
}

HMap.prototype.add = function(path, hash) {
	this.by_path[path] = hash
	if(!(hash in this.by_hash)) {
		this.by_hash[hash] = {}
	}
	this.by_hash[hash][path] = true
}

HMap.prototype.byHash = function(hash) {
	return Object.keys(this.by_hash[hash] || {})
}

HMap.prototype.byPath = function(path) {
	return this.by_path[path]
}

HMap.prototype.hashes = function() {
	return Object.keys(this.by_hash)
}

HMap.prototype.paths = function() {
	return Object.keys(this.by_path)
}

HMap.prototype.removeHash = function(hash) {
	var self = this
	this.byHash(hash).forEach(function(path) {
		delete self.byPath[path]
	})
	delete this.by_hash[hash]
}

HMap.prototype.removePath = function(path) {
	delete this.by_hash[this.by_path[path]][path]
	
	if(Object.keys(this.by_hash[this.by_path[path]]).length < 1) {
		delete this.by_hash[this.by_path[path]]
	}

	delete this.by_path[path]
}

module.exports = HMap
