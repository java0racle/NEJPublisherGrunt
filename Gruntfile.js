'use strict';

/*
 * https://github.com/Administrator/grunt-contrib-hello
 *
 * Copyright (c) 2013 sean
 * Licensed under the MIT license.
 */

'use strict';
var system = require('./release/src/system.js');

module.exports = function(grunt) {
  grunt.registerTask('dopublish', 'dopublish', function(root){
    var done = this.async();
    if(!grunt.option('root')){
      console.log('nedd root option!');
      return;
    }
    system.release({root:grunt.option('root'),onreleasedone:done});
  });
  grunt.registerTask('doskinmerge', 'doskinmerge', function(root){
    var done = this.async();
    if(!grunt.option('dir')){
      console.log('need dir option!');
      return;
    }
    system.releaseSkin({dir:grunt.option('dir'),outname:grunt.option('outname'),onreleasedone:done});
  });
};