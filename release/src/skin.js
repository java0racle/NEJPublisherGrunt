/**
 * 皮肤css的合并操作
 * @type {[type]}
 */
var __config,__result,__out,
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
/**
 * 获取输出文件的名称
 * @param  {[type]} _pdir [description]
 * @return {[type]}       [description]
 */
var __getOutName = function(_pdir){
    var _list = _pdir.split('/');
    if(_pdir[_pdir.length-1] == '/'){
         return _list[_list.length-2];
    }else{
         return _list[_list.length-1];
    }
};
/**
 * 获取输出目录的子目录名
 * @param  {[type]} _pdir [description]
 * @return {[type]}       [description]
 */
var __getOutPath = function(_pdir){
    var _root   = __config['SKIN_ROOT_DIR'],
        _source = _path.url(__config['SKIN_SOURCE_DIR'],_root);
    if(_pdir == _source) return '';
    return _pdir.replace(_source,'');
};
/**
 * 拷贝css相关图片
 * @return {[type]} [description]
 */
var __copyImg = function(_cssindir,_cssoutdir){
    var _img_in_dir  = _cssindir + __config['IMG_DIR'],
        _img_out_dir = _cssoutdir + __config['IMG_DIR'];
    if(_path.exist(_img_in_dir)){
        var _list = fs.readdirSync(_img_in_dir);
        if(!_list||_list.length==0){
            console.log('no source file!');
            return;
        }
        __doCopyImg(_img_in_dir,_img_out_dir,_list);
    }
};
var __createDIR = function(_dir,_name){
    return  (_dir[_dir.length-1] == '/') ?  (_dir + _name) : (_dir + '/' + _name);
};
/**
 * 拷贝图片
 * @param  {[type]} _list [description]
 * @return {[type]}       [description]
 */
var __doCopyImg = function(_indir,_outdir,_list){
    if(!_path.exist(_outdir)){
        _fs.mkdir(_outdir);
    }
    for(var i = 0; i < _list.length; i++){
        var _absindir = __createDIR(_indir,_list[i]);
        if(_fs.isdir(_absindir)){
            var _paths = fs.readdirSync(_absindir);
            if(!_paths||_paths.length==0){
                continue;
            }
            var _absoutdir = (_outdir[_outdir.length-1] == '/') ?  (_outdir + _list[i]) : (_outdir + '/' + _list[i]);
            __doCopyImg(_absindir,_absoutdir,_paths);
        }else{
            var _buffer = fs.readFileSync(_absindir),
                _imgname=  _absindir.split('/').pop();
            fs.writeFileSync(_outdir + '/' + _imgname,_buffer);
        }
    }
};
/**
 * 合并文件
 * @param  {[type]} _list [description]
 * @param  {[type]} _pdir [description]
 * @return {[type]}       [description]
 */
var __mergeWalk = function(_list,_pdir,_outdir){
    var _str    = '',
        _charset= __config['CHARSET'] || 'utf-8',
        _name   = __config['OUT_NAME']|| 'index.css',
        _outpath= __getOutPath(_pdir),
        _outname= _outdir + (_outpath == '' ? '' : _outpath + '/') + 
                  __getOutName(_pdir) + '_' + _name;
        __result = {};
        __result.data = {};
    for(var i = 0; i < _list.length; i++){
        var _absdir = __createDIR(_pdir,_list[i]);
        if(_fs.isdir(_absdir)){
            var _paths = fs.readdirSync(_absdir);
            if(!_paths||_paths.length==0){
                continue;
            }
            __mergeWalk(_paths,_absdir,_outdir);
        }else{
            var _cnts = _fs.read(_absdir,_charset);
            if (!_cnts||!_cnts.length||_absdir.search('css')<0){
                continue;
            }
            __doParseCSContent(_absdir,_cnts);
            _str += __result.data[_absdir];
        }
    }
    if(_str == '') return;
    var _list = _outname.split('/');
        _list.pop();
        _outdir = _list.join('/');
    if(!_path.exist(_outdir)){
        _fs.mkdir(_outdir);
    }
    _fs.write(_outname,_str,_charset);
    __copyImg(_pdir,_outdir);
    if(!!__config['DELETE_SOURCE_DIRS'] && 
         __config['DELETE_SOURCE_DIRS'] == 'true')
         __delSource(__result.data);
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
            var _dir = __createDIR(_out,_list[i]);
            if(_fs.isdir(_dir)){
                __clearOut(_dir)
            }else{
                fs.unlinkSync(_dir);
            }
        }
        if(_out != __out)
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
            _source = _path.url(__config['SKIN_SOURCE_DIR'],_root);
            __out   = _path.url(__config['SKIN_OUT_DIR'],_root);
        if(_path.exist(__out)){
            __clearOut(__out);
        }
        var _list = fs.readdirSync(_source);
        if(!_list||_list.length==0){
            console.log('no source file!');
            return;
        }
        __mergeWalk(_list,_source,__out);
    }
};
exports.cssmerge = __doCssMerge;