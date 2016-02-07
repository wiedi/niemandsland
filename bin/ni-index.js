#!/usr/bin/env node
"use strict"

var async   = require('async')
var findit  = require('findit')
var niuri   = require('niuri')
var util    = require('../lib/util')


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
	async.eachLimit(files, 1, function(item, callback) {
		util.hashFile(item, function(err, hash) {
			var h = new niuri.NI('sha-256', hash).format('ni')
			console.log(h + ' ' + item)
			callback()
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
