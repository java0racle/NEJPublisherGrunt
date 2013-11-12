/**
 * 皮肤css的合并操作
 * @type {[type]}
 */
var __config,
    _fs      = require('./file.js'),
    _log     = require('./logger.js'),
    _util    = require('./util.js'),
    _path    = require('./path.js')
     fs      = require('fs'),
     path    = require('path');
/**
 * 合并css样式为一行
 * @param  {[type]} _file   文件名
 * @param  {[type]} _list   文件内容
 * @param  {[type]} _result 结果集
 * @return {[type]}         [description]
 */
var __doParseCSContent = function(_file,_list,_result){
    var _content, _reg0 = /\/\*[\w\W]*?\*\//gi;
    _list = _list||[];
    for(var i=0,l=_list.length;i<l;i++)
        _list[i] = _list[i].trim();
    // parse resources in css
    _content = _list.join('').replace(_reg0,'');
    _result.data[_file] = _content;
};
/*
 * 设置配置信息
 * @param  {String} _key   配置标识
 * @param  {String} _value 配置内容
 * @return {Void}
 */
var __setConfig = function(_key,_value){
    __config[_key.trim().toUpperCase()] =
            !_value.trim?_value:_value.trim();
};
/**
 * 删除原始文件
 * @param  {[type]} _list [description]
 * @return {[type]}       [description]
 */
var __delSource = function(_list){
    for(var i = 0; i < _list.length; i++){
        if(_path.exist(_list[i]))
            fs.unlink(_list[i]);
    }
};
/**
 * 合并css
 * @param  {[type]} _file [description]
 * @return {[type]}       [description]
 */
var __doCssMerge = function(_file){
    __config = {};
    var _list = _fs.read(_file);
    for(var i = 0; i < _list.length; i++){
        var _line = _list[i];
        if (_util.blank(_line)||_util.comment(_line))
            continue;
        _line = _line.split('=');
        __setConfig(_line.shift().trim()
                  ,_line.join('=').trim());
    }
    if(!!__config['SKIN_SOURCE_DIRS'] && !!__config['SKIN_OUT']
    && !!__config['SKIN_ROOT_DIR']){
        var _root = __config['SKIN_ROOT_DIR'],
            _outfile = _path.url(__config['SKIN_OUT'],_root),
            _source_list_dirs = __config['SKIN_SOURCE_DIRS'].split(';');
        var _result = {},_outpath;
            _result.data={};
        for(var k = 0 ; k < _source_list_dirs.length; k++){
            _source_list_dirs[k] = _path.url(_source_list_dirs[k],_root);
        }
        for(var j = 0; j < _source_list_dirs.length; j++){
            var _file = _source_list_dirs[j];
            var _cnt = _fs.read(_file,__config['CHARSET']);
            if (!_cnt||!_cnt.length){
                console.log(_file + ' is empty file!');
                continue;
            }
            __doParseCSContent(_file,_cnt,_result);
        }
        if(!!_outfile){
            _outpath = path.dirname(_outfile);
        }else{
            console.log('out path is not exit!');
            return;
        }
        var _cnt = '';
        for(var x = 0; x < _source_list_dirs.length; x++){
            _cnt += _result.data[_source_list_dirs[x]]||'';
        }
        if(_path.exist(_outpath)){
            _fs.write(_outfile,_cnt,__config['CHARSET']);
        }else{
            console.log('out dir is not exit!');
        }
        if(!!__config['DELETE_SOURCE_DIRS']&&__config['DELETE_SOURCE_DIRS']=='true'){
            __delSource(_source_list_dirs);
        }
    }
};
exports.cssmerge = __doCssMerge;