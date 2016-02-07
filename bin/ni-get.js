#!/usr/bin/env node
"use strict"

var fs      = require('fs')
var crypto  = require('crypto')
var async   = require('async')
var program = require('commander')
var Loader  = require('../lib/loader')
var HMap    = require('../lib/hmap')
var util    = require('../lib/util')

program
	.usage('<index>')
	.option('-d, --destination [path]', 'save files to this folder [./download/]', './download/')
	.option('-s, --server [server]', 'add static server(s)', '')
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

function checkExistingFiles(wishlist, destination, callback) {
	async.eachLimit(wishlist.paths(), 1, function(item, cb) {
		var hash = crypto.createHash('sha256')
		var file = fs.createReadStream(destination + '/' + item)

		file.on("error", function() {
			cb()
		})
		file.pipe(hash, { end: false })
		file.on('end', function () {
			hash.end()

			var local_hash = hash.read().toString('hex')
			var index_hash = wishlist.byPath(item)

			if(local_hash === index_hash) {
				wishlist.removePath(item)
			}

			cb()
		})
	}, function(err){
		if(err) {
			console.log(err)
		}

		callback(wishlist)
	})
}

function main(options) {
	var servers = []
	if(options.server) {
		servers = options.server.split(',')
	}
	loadIndex(program.args[0], function(wishlist) {
		checkExistingFiles(wishlist, options.destination, function(bla) {
			var l = new Loader(bla, options.destination, servers)
		})
	})
}

main(program)
