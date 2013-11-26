/**
 * 皮肤css的合并操作
 * @type {[type]}
 */
var _fs      = require('./file.js'),
    _log     = require('./logger.js'),
    _util    = require('./util.js'),
    _path    = require('./path.js')
     fs      = require('fs'),
     path    = require('path');
 var __config,__result,__public;
/**
 * 合并css样式为一行
 * @param  {[type]} _file   文件名
 * @param  {[type]} _list   文件内容
 * @return {[type]}         [description]
 */
var __doParseCSContent = function(_file,_list){
    var _content, _reg0 = /\/\*[\w\W]*?\*\//gi;
    _list = _list||[];
    for(var i=0,l=_list.length;i<l;i++)
        _list[i] = _list[i].trim();
    // parse resources in css
    _content = _list.join('').replace(_reg0,'');
    __result.data[_file] = _content;
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
 * 读取配置文件
 * @param  {[type]} _list [description]
 * @return {[type]}       [description]
 */
var __readConf = function(_list){
    for(var i = 0; i < _list.length; i++){
        var _line = _list[i];
        if (_util.blank(_line)||_util.comment(_line))
            continue;
        _line = _line.split('=');
        __setConfig(_line.shift().trim(),_line.join('=').trim());
    }
};
var __createDIR = function(_dir,_name){
    return  (_dir[_dir.length-1] == '/') ?  (_dir + _name) : (_dir + '/' + _name);
};
/**
 * 清楚掉以前的输出
 * @param  {[type]} _out [description]
 * @return {[type]}      [description]
 */
var __clearOut = function(_out){
    if(_path.exist(_out)){
        var _list = fs.readdirSync(_out);
        for(var i = 0; i < _list.length; i++){
            var _file = __createDIR(_out,_list[i]);
            if(_fs.isdir(_file)){
                __clearOut(_file)
            }else{
                fs.unlinkSync(_file);
            }
        }
        fs.rmdirSync(_out);
    }
};
/**
 * 合并css
 * @param  {[type]} _file [description]
 * @return {[type]}       [description]
 */
var __doCssMerge = function(_file){
    var _list = _fs.read(_file);
    __config = {};
    __readConf(_list);
    if(!!__config['SKIN_SOURCE_DIR'] && !!__config['SKIN_OUT_DIR']
    && !!__config['SKIN_ROOT_DIR']){
        var _root   = __config['SKIN_ROOT_DIR'],
            _source = _path.url(__config['SKIN_SOURCE_DIR'],_root),
            _ignore = __config['IGNORE'],
            _ignore_copy = __config['IGNORE_COPY'];
            __public = _path.url(__config['SKIN_PUBLIC'],_root);
        var _list = fs.readdirSync(_source);
        if(!_list||_list.length==0){
            console.log('no source file!');
            return;
        }
        var _list0 = __filter(_list,_ignore);
        var _list1 = __filter(_list,_ignore_copy);
        __doMerge(_list0,_source);
        __doMove(_list1,_source);
    }
};

var __doMove = function(_list,_source){
    var _root   = __config['SKIN_ROOT_DIR'],
        _out    = _path.url(__config['SKIN_OUT_DIR'],_root);
    if(_path.exist(_out)){
        __clearOut(_out);
    }
    for(var i = 0; i < _list.length; i++){
        var _file = _list[i];
        __moveFile(_file,_source,_out);
    }
}

var __moveFile = function(_file,_from,_to){
    var _path = __createDIR(_from,_file);
    var _out = __createDIR(_to,_file);
    if(_fs.isdir(_path)){
        var _list = fs.readdirSync(_path);
        for(var i = 0; i < _list.length; i++){
            var _file = _list[i];
            __moveFile(_file,_path,_out);
        }
    }else{
        __copyFile(_path,_out);
    }
};

var __mergeFile = function(_from,_to){
    __result = {};
    __result.data = {};
    var _str = '';
    var _charset= __config['CHARSET'] || 'utf-8';
    var _fromcnt = _fs.read(_from,_charset);
    var _tocnt = _fs.read(_to,_charset);
    __doParseCSContent(_to,_tocnt);
    _str += __result.data[_to];
    __doParseCSContent(_from,_fromcnt);
    _str += __result.data[_from];
    _fs.write(_to,_str,_charset);
};

var __copyFile = function(_from,_to){
    var _list = _to.split('/');
        _list.pop();
    var _outdir = _list.join('/');
    if(!_path.exist(_outdir)){
        _fs.mkdir(_outdir);
    }
    var _buffer = fs.readFileSync(_from);
    fs.writeFileSync(_to,_buffer);
};

var __merge = function(_list,_pdir,_to){
    for(var i = 0; i < _list.length; i++){
        var _from = __createDIR(_pdir,_list[i]);
        if(_fs.isdir(_from)){
            var _arr  = fs.readdirSync(_from);
            __merge(_arr,_from,_to);
        }else{
            var _tofilename = _to + '/'+_from.replace(__public,'');
            if(_path.exist(_tofilename)){
                __mergeFile(_from,_tofilename);
            }else{
                __copyFile(_from,_tofilename);
            }
        }
    }
};

var __doMerge = function(_list,_source){
    var _arr = fs.readdirSync(__public);
    for(var i = 0; i < _list.length; i++){
        var _todir = _path.url(_list[i],_source);
        __merge(_arr,__public,_todir);
    }
};

var __filter = function(_list,_ignore){
    var _arr = [];
    for(var i = 0; i < _list.length; i++){
        var _file = _list[i];
        if(_ignore.search(_file)<0){
            _arr.push(_file)
        }
    }
    return _arr;
};
exports.cssmerge = __doCssMerge;