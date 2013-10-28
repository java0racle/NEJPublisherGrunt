/**
 * 皮肤css的合并操作
 * @type {[type]}
 */
var _fs      = require('./file.js'),
    _log     = require('./logger.js'),
     fs      = require('fs'),
     path    = require('path');
/**
 * 合并css样式为一行
 * @param  {[type]} _file   [description]
 * @param  {[type]} _list   [description]
 * @param  {[type]} _result [description]
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
/**
 * 读取css样式
 * @param  {[type]} _dir    [description]
 * @param  {[type]} _result [description]
 * @return {[type]}         [description]
 */
var __doListCSSFile = function(_dir,_outname,_result){
    var _list = fs.readdirSync(_dir);
    if (!_list&&!_list.length){
        _log.warn('no file to parse! %s',_dir);
    }else{
        if (!_result.files) _result.files = {};
        if (!_result.data) _result.data = {};
        for(var i=0,l=_list.length,_file,_data,_reg = new RegExp('\\.(?:css)$','i');i<l;i++){
            _file = _list[i];
            if(_file === 'index.css')
                continue;
            _file = _dir+_file;
            if (_fs.isdir(_file)){
                __doListCSSFile(_file+'/',_outname,_result);
                continue;
            }
            if (!!_reg&&!_reg.test(_file))
                continue;
            var _outfile = path.dirname(_file)+'/'+_outname+'.css';
            _result.files[_outfile] = _outfile;
            _log.info('parse %s',_file);
            var _cnt = _fs.read(_file,'utf-8');
            if (!_cnt||!_cnt.length){
                _log.warn('empty file %s',_file);
                return null;
            }
            __doParseCSContent(_file,_cnt,_result);
            if(!!_result.files){
                _fs.write(_result.files[_outfile],_result.data[_file]);
            }
        }
    }
}
exports.cs = __doListCSSFile;