var REGEXP_KEYWORDS=/^__(proto|defineGetter|defineSetter|lookupGetter|lookupSetter)__$/;

/* -----[ Scope and mangling ]----- */

function Scope(parent) {
        this.names = {};        // names defined in this scope
        this.mangled = {};      // mangled names (orig.name => mangled)
        this.rev_mangled = {};  // reverse lookup (mangled => orig.name)
        this.cname = -1;        // current mangled name
        this.refs = {};         // names referenced from this scope
        this.uses_with = false; // will become TRUE if with() is detected in this or any subscopes
        this.uses_eval = false; // will become TRUE if eval() is detected in this or any subscopes
        this.parent = parent;   // parent scope
        this.children = [];     // sub-scopes
        if (parent) {
                this.level = parent.level + 1;
                parent.children.push(this);
        } else {
                this.level = 0;
        }
};

var base54 = (function(){
        var DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return function(num) {
                var ret = "",
                    len = DIGITS.length;
                do {
                        ret = DIGITS.charAt(num % len) + ret;
                        num = Math.floor(num / len);
                } while (num > 0);
                return ret;
        };
})();

Scope.prototype = {
        has: function(name) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.names, name))
                                return s;
        },
        has_mangled: function(mname) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.rev_mangled, mname))
                                return s;
        },
        toJSON: function() {
                return {
                        names: this.names,
                        uses_eval: this.uses_eval,
                        uses_with: this.uses_with
                };
        },

        next_mangled: function() {
                // we must be careful that the new mangled name:
                //
                // 1. doesn't shadow a mangled name from a parent
                //    scope, unless we don't reference the original
                //    name from this scope OR from any sub-scopes!
                //    This will get slow.
                //
                // 2. doesn't shadow an original name from a parent
                //    scope, in the event that the name is not mangled
                //    in the parent scope and we reference that name
                //    here OR IN ANY SUBSCOPES!
                //
                // 3. doesn't shadow a name that is referenced but not
                //    defined (possibly global defined elsewhere).
                for (;;) {
                        var m = base54(++this.cname), prior;

                        // case 1.
                        prior = this.has_mangled(m);
                        if (prior && this.refs[prior.rev_mangled[m]] === prior)
                                continue;

                        // case 2.
                        prior = this.has(m);
                        if (prior && prior !== this && this.refs[m] === prior && !prior.has_mangled(m))
                                continue;

                        // case 3.
                        if (HOP(this.refs, m) && this.refs[m] == null)
                                continue;

                        // I got "do" once. :-/
                        if (!is_identifier(m))
                                continue;

                        return m;
                }
        },
        set_mangle: function(name, m) {
                this.rev_mangled[m] = name;
                return this.mangled[name] = m;
        },
        get_mangled: function(name, newMangle) {
                if (this.uses_eval || this.uses_with) return name; // no mangle if eval or with is in use
                var s = this.has(name);
                if (!s) return name; // not in visible scope, no mangle
                if (HOP(s.mangled, name)) return s.mangled[name]; // already mangled in this scope
                if (!newMangle) return name;                      // not found and no mangling requested
                return s.set_mangle(name, s.next_mangled());
        },
        references: function(name) {
                return name && !this.parent || this.uses_with || this.uses_eval || this.refs[name];
        },
        define: function(name, type) {
                if (name != null) {
                        if (type == "var" || !HOP(this.names, name))
                                this.names[name] = type || "var";
                        return name;
                }
        }
};

/**
 * [ast_preprocess description]
 * @param  {[type]} ast     [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function ast_preprocess(ast,options){
    var hash_identifier_map=options.identifier_map||{},//identifier map
        hash_identifier_map_opp={},//identifier map opposite
        hash_confuse_identifier={},//hash for confuse identifier
        list_confuse_identifier=[],//list for confuse identifier(for sort)
        hash_unconfuse_identifier={};//hash for unconfuse identifier
    function count(identifier){
        if(!identifier||REGEXP_KEYWORDS.test(identifier))return;
        var f=identifier[0],s=identifier[1];
        switch(options.obf_level){
            case 1:{
                if((f==='_')&&(s!=='_')&&(s!=='$')){
                    add_to_confuse(identifier);
                }else{
                    add_to_unconfuse(identifier);
                }
                break;
            }
            case 2:{
                if((f==='_')&&(s!=='$')){
                    add_to_confuse(identifier);
                }else{
                    add_to_unconfuse(identifier);
                }
                break;
            }
            case 3:
            default:{
                if(f==='_'){
                    add_to_confuse(identifier);
                }else{
                    add_to_unconfuse(identifier);
                }
            }
        }
    }
    function add_to_confuse(identifier){
        if(!hash_confuse_identifier[identifier]){
            var tmp_obj={count:1,id:identifier,st:''};
            hash_confuse_identifier[identifier]=tmp_obj;
            list_confuse_identifier.push(tmp_obj);
        }else{
            hash_confuse_identifier[identifier].count+=1;
        }
    }
    function add_to_unconfuse(identifier){
        if(!hash_unconfuse_identifier[identifier]){
            hash_unconfuse_identifier[identifier]=1;
        }else{
            hash_unconfuse_identifier[identifier]++;
        }
    }
    function sort(){
        list_confuse_identifier.sort(function(a,b){if(a.count<b.count)return 1;else if(a.count==b.count)return 0;else return -1;})
    }
    function confuse(){
        var scope = new Scope(),new_name;
        for(var i=0;i<list_confuse_identifier.length;i++){
            new_name = hash_identifier_map[list_confuse_identifier[i].id];
            if(!!new_name){//has old
                if(hash_unconfuse_identifier[new_name]){//in unconfuse list,create a new name
                    new_name = scope.next_mangled();
                    while(hash_unconfuse_identifier[new_name]||!!hash_identifier_map_opp[new_name]){
                        new_name = scope.next_mangled();
                    }
                }
            }else{//not has old,create a new name
                new_name = scope.next_mangled();
                while(hash_unconfuse_identifier[new_name]||!!hash_identifier_map_opp[new_name]){
                    new_name = scope.next_mangled();
                }
            }
            list_confuse_identifier[i].st = new_name;
        }
    }
    for(var i = 0; i < ast.length ; i++){
        if(ast[i].type == 'Identifier'){
            var v = ast[i].value;
            count(v);
        }
    }
    sort();
    confuse();
    return {
        hash_confuse_identifier:hash_confuse_identifier,
        list_confuse_identifier:list_confuse_identifier,
        hash_unconfuse_identifier:hash_unconfuse_identifier
    }
};
function array_to_hash(a) {
        var ret = {};
        for (var i = 0; i < a.length; ++i)
                ret[a[i]] = true;
        return ret;
};
var KEYWORDS_ATOM = array_to_hash([
        "false",
        "null",
        "true",
        "undefined"
]);
var RESERVED_WORDS = array_to_hash([
        "abstract",
        "boolean",
        "byte",
        "char",
        "class",
        "double",
        "enum",
        "export",
        "extends",
        "final",
        "float",
        "goto",
        "implements",
        "import",
        "int",
        "interface",
        "long",
        "native",
        "package",
        "private",
        "protected",
        "public",
        "short",
        "static",
        "super",
        "synchronized",
        "throws",
        "transient",
        "volatile"
]);
var KEYWORDS = array_to_hash([
        "break",
        "case",
        "catch",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "else",
        "finally",
        "for",
        "function",
        "if",
        "in",
        "instanceof",
        "new",
        "return",
        "switch",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with"
]);

function is_identifier(name) {
        return /^[a-z_$][a-z0-9_$]*$/i.test(name)
                && name != "this"
                && !HOP(KEYWORDS_ATOM, name)
                && !HOP(RESERVED_WORDS, name)
                && !HOP(KEYWORDS, name);
};
function HOP(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
};

/* -----[ Exports ]----- */
exports.ast_preprocess = ast_preprocess;//count and confuse identifier
