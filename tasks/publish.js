/*
 * https://github.com/Administrator/grunt-contrib-hello
 *
 * Copyright (c) 2013 sean
 * Licensed under the MIT license.
 */

'use strict';
var system = require('../release/src/system.js');
module.exports = function(grunt) {
  grunt.registerTask('publish','publish task',function(){
  	var done = this.async();
	system.release({root:grunt.option('root'),onreleasedone:done});
  });
};