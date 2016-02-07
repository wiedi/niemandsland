"use strict"

var fs = require('fs')
var crypto  = require('crypto')
var byline = require('byline')
var niuri  = require('niuri')

function parseIndex(filename, iterator, cb) {
	var stream = byline(fs.createReadStream(filename, { encoding: 'utf8' }))
	stream.on('data', function(line) {
		var l = line.split(' ')
		if(l.length < 2) return

		var ni = niuri.parse(l.shift())
		if(ni.algorithm != 'sha-256') return
		iterator(l.join(' '), ni.hashvalue)
	})
	stream.on('end', cb)
}

function hashFile(filename, cb) {
	var hash = crypto.createHash('sha256')
	var file = fs.createReadStream(filename)

	file.on("error", function() {
		cb(true)
	})
	file.pipe(hash, { end: false })
	file.on('end', function () {
		hash.end()
		cb(false, hash.read().toString('hex'))
	})
}

exports.parseIndex = parseIndex
exports.hashFile = hashFile
