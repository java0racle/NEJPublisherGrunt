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
    // console.log('root config by command: ' + root);
    var done = this.async();
    if(!grunt.option('root')){
      console.log('no root');
      return;
    }
    system.release({root:grunt.option('root'),onreleasedone:done});
  });
};