"use strict"

var fs = require('fs')
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

exports.parseIndex = parseIndex
