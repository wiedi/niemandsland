#!/usr/bin/env node
"use strict"

var fs      = require('fs')
var crypto  = require('crypto')
var async   = require('async')
var findit  = require('findit')
var niuri   = require('niuri')


function listFiles(folder, cb) {
	var finder = findit(folder)
	var files = []
	finder.on('file', function (file, stat) {
		files.push(file)
	})
	finder.on('end', function() {
		cb(null, files)
	})
}

function iterate(files, cb) {
	async.eachLimit(files, 1, function(item, cb) {
		var hash = crypto.createHash('sha256')
		var file = fs.createReadStream(item)

		//hash.setEncoding('hex')
		
		file.pipe(hash, { end: false })
		file.on('end', function () {
			hash.end()
			var h = new niuri.NI('sha-256', hash.read()).format('ni')
			console.log(h + ' ' + item)
			cb()
		})
		
	}, function(err){
		if(err) {
			console.log(err)
		}
	})
}

function createIndex(folder) {
	listFiles(folder, function(err, files) {
		if(err) {
			cb(err)
			return
		}
		
		iterate(files)
	})
}

function main() {
	if(process.argv.length != 3) {
		console.log('Usage:')
		console.log('\t ' + process.argv[1] + ' <folder>')
		return
	}
	createIndex(process.argv[2])
}

main()