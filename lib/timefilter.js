"use strict"

function TimeFilter(lifetime) {
	this.filter = {}
	this.lifetime = lifetime

	this.interval = setInterval(this.checkLifeTime.bind(this), lifetime)
}

TimeFilter.prototype.checkLifeTime = function() {
	Object.keys(this.filter).forEach(function(key) {
		if(((new Date()).getTime() - this.filter[key]) < this.lifetime) {
			delete this.filter[key]
		}
	}.bind(this))
}

TimeFilter.prototype.add = function(key) {
	this.filter[key] = (new Date()).getTime()
}

TimeFilter.prototype.remove = function(key) {
	delete this.filter[key]
}

TimeFilter.prototype.has = function(key) {
	return (key in this.filter)
}

module.exports = TimeFilter
