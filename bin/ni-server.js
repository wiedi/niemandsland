#!/usr/bin/env node
"use strict"

var fs = require('fs')
var program = require('commander')
var bloem   = require('bloem')
var niuri   = require('niuri')
var express = require('express')
var byline  = require('byline')
var util    = require('../lib/util')
    
var index = {}
var filter = new bloem.ScalingBloem(0.1)

program
	.usage('<index>')
	.option('-p, --port [port]', 'listen on port [3000]', '3000')
	.option('-r, --root [path]', 'serve files from this folder [/srv]', '/srv')
	.option('-m, --no-mdns', 'disable announcement via multicast dns')
	.parse(process.argv)

if(program.args < 1) {
	console.error('index required')
	program.outputHelp()
	process.exit(1);
}


function loadIndex(filename, cb) {
	index = {}
	
	/* try to estimate the number of files
	 * assume average line length of 100 bytes
	 * set initial_capacity to the next bigger power of 2
	 */
	var stat = fs.statSync(filename)
	var initial_capacity = Math.pow(2, (Math.ceil(Math.log(stat.size / 100)/Math.log(2))))	
	filter = new bloem.ScalingBloem(0.001, {initial_capacity: initial_capacity})
	
	util.parseIndex(filename, function(path, hash) {
		index[hash.toString('base64').replace(/=/g, '')] = path
		filter.add(hash)
	}, cb)
}


function main(options) {
	var app = express()
	app.get('/filter', function(req, res) {
		res.json(filter)
	})
	
	app.get('/.well-known/ni/sha-256/*', function(req, res) {
		var hash = req.params[0]
		if(!(hash in index)) {
			res.status(404).send('not found')
			return
		}
		res.sendFile(index[hash], {root: options.root})
	})
	
	loadIndex(options.args[0], function() {
		console.log('Index loaded')
	})
	app.listen(options.port)
}

main(program)