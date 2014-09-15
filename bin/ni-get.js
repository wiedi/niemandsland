#!/usr/bin/env node
"use strict"

var program = require('commander')
var Loader  = require('../lib/loader')
var HMap    = require('../lib/hmap')
var util    = require('../lib/util')

program
	.usage('<index>')
	.option('-d, --destination [path]', 'save files to this folder [./download/]', './download/')
	.option('-s, --server [server]', 'add static server(s)')
	.option('-m, --no-mdns', 'disable server lookup via multicast dns')
	.parse(process.argv)

if(program.args < 1) {
	console.error('index required')
	program.outputHelp()
	process.exit(1);
}

function loadIndex(filename, cb) {
	var wishlist = new HMap()
	
	util.parseIndex(filename, function(path, hash) {
		wishlist.add(path, hash.toString('hex'))
	}, function() {
		cb(wishlist)
	})
}

function main(options) {
	loadIndex(program.args[0], function(wishlist) {
		var l = new Loader(wishlist, options.destination, options.server.split(','))
	})
}

main(program)