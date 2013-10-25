//convienence function(src, [options]);
var fs = require("fs"),
	path = require("path"),
	esprima = require("esprima"),
    escodegen = require("escodegen")
/**
 * [uglify_main description]
 * @param  {[type]} hash_code_orgin   [description]
 * @param  {[type]} hash_group_config [description]
 * @param  {[type]} options           [description]
 * @return {[type]}                   [description]
 */
function uglify_main(hash_code_orgin,hash_group_config,options){
	options||(options={});
	var	pro = esprocess.process,
		hash_code_ast={},//语法树hash表
		list_code_ast=[],//语法树列表
		hash_group_result={},//返回混淆后结果分组
		list_code_result=[],//分组代码列表
		hash_identifier_map={},//混淆结果对照表
		code_ast,//语法树
		code_orgin,//源代码
		count_identifiers,//标识符统计结果
		regexp_null = /^\s*;?$/,//处理空文件
		regexp_function = /^\s*\(\s*function\s*\(\s*\)\s*{\s*}\s*\)\s*\(\s*\)\s*;?$/;//处理空函数
	//处理空内容或者空函数
	for(var key in hash_code_orgin){
		code_orgin = hash_code_orgin[key];
		if((regexp_null.test(code_orgin))||(regexp_function.test(code_orgin))){
			delete hash_code_orgin[key];
			for(var group in hash_group_config){
				for(var i=hash_group_config[group].length-1;i>=0;i--){
					if(hash_group_config[group][i]===key){
						hash_group_config[group].splice(i,1);
					}
				}
			}
			
		}
	}
	time_it('parsing js',function(){
		for(var key in hash_code_orgin){
			try{
                code_ast_esprima = esprima.parse(hash_code_orgin[key],{ tokens: true }).tokens;
                syntax = esprima.parse(hash_code_orgin[key]);
			}catch(e){
				console.log('[ESPRIMA] '+hash_code_orgin[key].split('\n')[e.line-1]);
				console.log('[ESPRIMA] PARSE ERROR: '+e.message +' AT LINE:'+e.line+' COL:'+e.col);
			}
			list_code_ast.push(code_ast_esprima);
			hash_code_ast[key]=syntax;
		}
	});
	var MAP = function(a, f, o) {
        var i;
        function doit() {
            f.call(o, a[i], i);
        };
        if (a instanceof Array) for (i = 0; i < a.length; ++i) doit();
        return;
    };
 	function _vardefs(defs) {
 		[this['type'],MAP(this['declarations'],walk)];
    };
    function _block(statements) {
    	[this['type'],MAP(this['body'],walk)];
    };
    var walkers = {
        "Literal": function(){
                [ this['type'], this['value'] ];
        },
        "Identifier": function() {
        	var skey = this['name'];
        	if(!!count_identifiers.hash_confuse_identifier[skey]&&typeof(count_identifiers.hash_confuse_identifier[skey])!='function'&&skey!='__proto__'){
        		this['name'] = count_identifiers.hash_confuse_identifier[skey].st;
        	}
            [ this['type'], this['name'] ];
        },
        "Program": function() {
                [ this['type'], MAP(this['body'], walk) ];
        },
        "BlockStatement": _block,
        "VariableDeclaration": _vardefs,
        "VariableDeclarator": function(){
            [this['type'],walk(this['id']),walk(this['init'])];
        },
        "EmptyStatement": function(){
                [this['type'],'empty'];
        },
        "ThisExpression": function(){
                [this['type'],'thisexpression'];
        },
        "AssignmentExpression": function() {
                [ this['type'], this['operator'], walk(this['left']), walk(this['right']) ];
        },
        "MemberExpression": function() {
                [ this['type'], walk(this['object']), walk(this['property']) ];
        },
        "CallExpression": function() {
                [ this['type'], walk(this['callee']), MAP(this['arguments'], walk) ];
        },
        "FunctionDeclaration": function(){
                [ this['type'], walk(this['id']), 
                    MAP(this['params'], walk), 
                    MAP(this['defaults'], walk),
                    walk(this['body']) ];
        },
        "FunctionExpression": function() {
                [ this['type'], this['id'], MAP(this['params'], walk), MAP(this['body']['body'], walk) ];
        },
        "IfStatement": function() {
                [ this['type'], walk(this['consequent']), walk(this['test']), walk(this['alternate']) ];
        },
        "ConditionalExpression": function(){
                [ this['type'], walk(this['test']), walk(this['consequent']), walk(this['alternate']) ];
        },
        "ForStatement": function() {
                [ this['type'], walk(this['init']), walk(this['test']), walk(this['update']), walk(this['body']) ];
        },
        "ForInStatement": function() {
                [ this['type'], walk(this['left']), walk(this['right']), walk(this['body']) ];
        },
        "ReturnStatement": function() {
                [ this['type'], walk(this['argument']) ];
        },
        "BinaryExpression": function(){
                 [ this['type'], this['operator'], walk(this['left']), walk(this['right']) ];
        },
        "LogicalExpression": function() {
                [ this['type'], this['operator'], walk(this['left']), walk(this['right']) ];
        },
        "UpdateExpression":function(){
            [ this['type'], this['operator'], walk(this['argument']) ];
        },
        "UnaryExpression": function(){
                [ this['type'], this['operator'], walk(this['argument']) ];
        },
        "ObjectExpression": function(props) {
                [ this['type'], MAP(this['properties'], function(p){
                        [ walk(p['key']), walk(p['value']) ]
                }) ];
        },
        "ArrayExpression": function() {
                [ this['type'], MAP(this['elements'], walk) ];
        },
        "ExpressionStatement": function() {
                [ this['type'], walk(this['expression']) ];
        },
        "SequenceExpression": function() {
                [ this['type'] ].concat(MAP(this['expressions'], walk));
        },
        "NewExpression": function() {
                [ this['type'], walk(this['callee'],MAP(this['arguments'],walk)) ];
        },
        "BreakStatement": function() {
                [ this['type'], this['label'] ];
        },
        "ContinueStatement": function() {
                [ this['type'], this['label'] ];
        },
        "TryStatement": function() {
                [
                        this['type'],
                        walk(this['block']),
                        MAP(this['guardedHandlers'],walk),
                        MAP(this['handlers'],walk)
                ];
        },
        "CatchClause": function(){
                [
                        this['type'],
                        walk(this['param']),
                        walk(this['body']),
                ];
        },
        "WhileStatement": function(){
                [
                        this['type'],
                        walk(this['test']),
                        walk(this['body']),
                ];
        },
        "SwitchStatement": function(){
                [
                        this['type'],
                        walk(this['discriminant']),
                        MAP(this['cases'],walk)
                ];
        },
        "SwitchCase": function(){
                [
                        this['type'],
                        walk(this['test']),
                        MAP(this['consequent'],walk)
                ];
        },
        "ThrowStatement": function(){
                [
                        this['type'],
                        walk(this['argument'])
                ];
        }
    };
	function walk(ast) {
        if (ast == null)
                return null;
        try {
            var type = ast['type'];
            var gen = walkers[type];
            if(!gen){
            	debugger;
            }
            return gen.apply(ast);
    	}catch(e){
    		console.log('walk error');
    	}
	};
	if(options.obf_level===0){
		for(var key in hash_group_config){
			list_code_result=[];
			for(var i=0;i<hash_group_config[key].length;i++){
				var code_ast = hash_code_ast[hash_group_config[key][i]];
				var option = {
			        format: {
			            indent: {
			                style: ' '
			            },
		                compact:true,
			            quotes: 'auto'
			        }
			    };
		        code = escodegen.generate(code_ast, option);
				list_code_result.push(code);
			}
			hash_group_result[key]=list_code_result;
		}
	}else{
		time_it('counting variable',function(){
			count_identifiers = pro.ast_preprocess(combine_ast(list_code_ast),options);
		});
		time_it('confusing variable and generating code',function(){
			for(var key in hash_group_config){
				list_code_result=[];
				for(var i=0;i<hash_group_config[key].length;i++){
					var code_ast = hash_code_ast[hash_group_config[key][i]];
					walk(code_ast);
					var option = {
				        format: {
				            indent: {
				                style: ' '
				            },
			                compact:true,
				            quotes: 'auto'
				        }
				    };
			        code = escodegen.generate(code_ast, option);
					list_code_result.push(code);
				}
				hash_group_result[key]=list_code_result;
			}
		});
		for(var i=0,identifier;i<count_identifiers.list_confuse_identifier.length;i++){
			identifier=count_identifiers.list_confuse_identifier[i];
			hash_identifier_map[identifier.id]=identifier.st;
		}
	}
	return {code:hash_group_result,map:hash_identifier_map};
}
//generate by group output code
function generate_by_group_outcode(group_config,options){
	var map_config=options.code_map||{},//代码分组查找表 
		hash_code_orgin={},//源码列表
		hash_group_config={},//打包分组列表
		hash_code_map={},//新旧键值对照表
		code_orgin,//js代码
		start_key=100000,//开始标示 
		next_key,//下一个标示
		uglify_result;//压缩混淆结果
	options.identifier_map = options.bags;
	for(var key in group_config){
		hash_group_config[key]=[];
		for(var i=0;i<group_config[key].length;i++){
			if(!!hash_code_map[group_config[key][i]]){
				hash_group_config[key][i] = hash_code_map[group_config[key][i]];
			}else{
				next_key = (start_key++)+'';
				hash_group_config[key][i] = next_key;
				hash_code_map[group_config[key][i]]=next_key;
				if(map_config[group_config[key][i]]!=null){
					code_orgin=map_config[group_config[key][i]];
				}else{
					code_orgin=fs.readFileSync(group_config[key][i],"utf8");
				}
				hash_code_orgin[next_key]=code_orgin;
			}
		}
	}
	uglify_result = uglify_main(hash_code_orgin,hash_group_config,options);
	for(var file in uglify_result.code){
		uglify_result.code[file]=uglify_result.code[file].join(options.obf_line_mode===1?'\n':'')
	}
	console.log('[UGLIFYJS] success');
	return {files:uglify_result.code,bags:uglify_result.map};	
}
function combine_ast(ast_list){
	var result_ast = [];
	for(var i = 0 ;i <ast_list.length ;i++){
		result_ast = result_ast.concat(ast_list[i])
	}
	return result_ast;
}
//time it
function time_it(name, cont) {
    var t1 = new Date().getTime();
    try{return cont();}
    finally{ console.log('[UGLIFYJS] '+name + " done in: " + ((new Date().getTime() - t1) / 1000).toFixed(3) + " sec."); }
};
var esprocess = {};
esprocess.process = require("./process");
esprocess.generate_by_group_outcode = generate_by_group_outcode;
module.exports = esprocess