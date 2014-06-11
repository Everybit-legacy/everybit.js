/* Copyright 2007-2012 Richard Jones
 This work is licensed under the Creative Commons Attribution-Noncommercial-No Derivative Works License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-nd/2.5/au/
 */
Gettext=function(_1){
    this.domain="messages";
    this.locale_data=undefined;
    var _2=["domain","locale_data"];
    if(this.isValidObject(_1)){
        for(var i in _1){
            for(var j=0;j<_2.length;j++){
                if(i==_2[j]){
                    if(this.isValidObject(_1[i])){
                        this[i]=_1[i];
                    }
                }
            }
        }
    }
    this.try_load_lang();
    return this;
};
Gettext.context_glue="\x04";
Gettext._locale_data={};
Gettext.prototype.try_load_lang=function(){
    if(typeof (this.locale_data)!="undefined"){
        var _5=this.locale_data;
        this.locale_data=undefined;
        this.parse_locale_data(_5);
        if(typeof (Gettext._locale_data[this.domain])=="undefined"){
            throw new Error("Error: Gettext 'locale_data' does not contain the domain '"+this.domain+"'");
        }
    }
    var _6=this.get_lang_refs();
    if(typeof (_6)=="object"&&_6.length>0){
        for(var i=0;i<_6.length;i++){
            var _8=_6[i];
            if(_8.type=="application/json"){
                if(!this.try_load_lang_json(_8.href)){
                    throw new Error("Error: Gettext 'try_load_lang_json' failed. Unable to exec xmlhttprequest for link ["+_8.href+"]");
                }
            }else{
                if(_8.type=="application/x-po"){
                    if(!this.try_load_lang_po(_8.href)){
                        throw new Error("Error: Gettext 'try_load_lang_po' failed. Unable to exec xmlhttprequest for link ["+_8.href+"]");
                    }
                }else{
                    throw new Error("TODO: link type ["+_8.type+"] found, and support is planned, but not implemented at this time.");
                }
            }
        }
    }
};
Gettext.prototype.parse_locale_data=function(_9){
    if(typeof (Gettext._locale_data)=="undefined"){
        Gettext._locale_data={};
    }
    for(var _a in _9){
        if((!_9.hasOwnProperty(_a))||(!this.isValidObject(_9[_a]))){
            continue;
        }
        var _b=false;
        for(var _c in _9[_a]){
            _b=true;
            break;
        }
        if(!_b){
            continue;
        }
        var _d=_9[_a];
        if(_a==""){
            _a="messages";
        }
        if(!this.isValidObject(Gettext._locale_data[_a])){
            Gettext._locale_data[_a]={};
        }
        if(!this.isValidObject(Gettext._locale_data[_a].head)){
            Gettext._locale_data[_a].head={};
        }
        if(!this.isValidObject(Gettext._locale_data[_a].msgs)){
            Gettext._locale_data[_a].msgs={};
        }
        for(var _e in _d){
            if(_e==""){
                var _f=_d[_e];
                for(var _10 in _f){
                    var h=_10.toLowerCase();
                    Gettext._locale_data[_a].head[h]=_f[_10];
                }
            }else{
                Gettext._locale_data[_a].msgs[_e]=_d[_e];
            }
        }
    }
    for(var _a in Gettext._locale_data){
        if(this.isValidObject(Gettext._locale_data[_a].head["plural-forms"])&&typeof (Gettext._locale_data[_a].head.plural_func)=="undefined"){
            var _12=Gettext._locale_data[_a].head["plural-forms"];
            var _13=new RegExp("^(\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_()])+)","m");
            if(_13.test(_12)){
                var pf=Gettext._locale_data[_a].head["plural-forms"];
                if(!/;\s*$/.test(pf)){
                    pf=pf.concat(";");
                }
                var _15="var plural; var nplurals; "+pf+" return { \"nplural\" : nplurals, \"plural\" : (plural === true ? 1 : plural ? plural : 0) };";
                Gettext._locale_data[_a].head.plural_func=new Function("n",_15);
            }else{
                throw new Error("Syntax error in language file. Plural-Forms header is invalid ["+_12+"]");
            }
        }else{
            if(typeof (Gettext._locale_data[_a].head.plural_func)=="undefined"){
                Gettext._locale_data[_a].head.plural_func=function(n){
                    var p=(n!=1)?1:0;
                    return {"nplural":2,"plural":p};
                };
            }
        }
    }
    return;
};
Gettext.prototype.try_load_lang_po=function(uri){
    var _19=this.sjax(uri);
    if(!_19){
        return;
    }
    var _1a=this.uri_basename(uri);
    var _1b=this.parse_po(_19);
    var rv={};
    if(_1b){
        if(!_1b[""]){
            _1b[""]={};
        }
        if(!_1b[""]["domain"]){
            _1b[""]["domain"]=_1a;
        }
        _1a=_1b[""]["domain"];
        rv[_1a]=_1b;
        this.parse_locale_data(rv);
    }
    return 1;
};
Gettext.prototype.uri_basename=function(uri){
    var rv;
    if(rv=uri.match(/^(.*\/)?(.*)/)){
        var _1f;
        if(_1f=rv[2].match(/^(.*)\..+$/)){
            return _1f[1];
        }else{
            return rv[2];
        }
    }else{
        return "";
    }
};
Gettext.prototype.parse_po=function(_20){
    var rv={};
    var _22={};
    var _23="";
    var _24=[];
    var _25=_20.split("\n");
    for(var i=0;i<_25.length;i++){
        _25[i]=_25[i].replace(/(\n|\r)+$/,"");
        var _27;
        if(/^$/.test(_25[i])){
            if(typeof (_22["msgid"])!="undefined"){
                var _28=(typeof (_22["msgctxt"])!="undefined"&&_22["msgctxt"].length)?_22["msgctxt"]+Gettext.context_glue+_22["msgid"]:_22["msgid"];
                var _29=(typeof (_22["msgid_plural"])!="undefined"&&_22["msgid_plural"].length)?_22["msgid_plural"]:null;
                var _2a=[];
                for(var str in _22){
                    var _27;
                    if(_27=str.match(/^msgstr_(\d+)/)){
                        _2a[parseInt(_27[1])]=_22[str];
                    }
                }
                _2a.unshift(_29);
                if(_2a.length>1){
                    rv[_28]=_2a;
                }
                _22={};
                _23="";
            }
        }else{
            if(/^#/.test(_25[i])){
                continue;
            }else{
                if(_27=_25[i].match(/^msgctxt\s+(.*)/)){
                    _23="msgctxt";
                    _22[_23]=this.parse_po_dequote(_27[1]);
                }else{
                    if(_27=_25[i].match(/^msgid\s+(.*)/)){
                        _23="msgid";
                        _22[_23]=this.parse_po_dequote(_27[1]);
                    }else{
                        if(_27=_25[i].match(/^msgid_plural\s+(.*)/)){
                            _23="msgid_plural";
                            _22[_23]=this.parse_po_dequote(_27[1]);
                        }else{
                            if(_27=_25[i].match(/^msgstr\s+(.*)/)){
                                _23="msgstr_0";
                                _22[_23]=this.parse_po_dequote(_27[1]);
                            }else{
                                if(_27=_25[i].match(/^msgstr\[0\]\s+(.*)/)){
                                    _23="msgstr_0";
                                    _22[_23]=this.parse_po_dequote(_27[1]);
                                }else{
                                    if(_27=_25[i].match(/^msgstr\[(\d+)\]\s+(.*)/)){
                                        _23="msgstr_"+_27[1];
                                        _22[_23]=this.parse_po_dequote(_27[2]);
                                    }else{
                                        if(/^"/.test(_25[i])){
                                            _22[_23]+=this.parse_po_dequote(_25[i]);
                                        }else{
                                            _24.push("Strange line ["+i+"] : "+_25[i]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if(typeof (_22["msgid"])!="undefined"){
        var _28=(typeof (_22["msgctxt"])!="undefined"&&_22["msgctxt"].length)?_22["msgctxt"]+Gettext.context_glue+_22["msgid"]:_22["msgid"];
        var _29=(typeof (_22["msgid_plural"])!="undefined"&&_22["msgid_plural"].length)?_22["msgid_plural"]:null;
        var _2a=[];
        for(var str in _22){
            var _27;
            if(_27=str.match(/^msgstr_(\d+)/)){
                _2a[parseInt(_27[1])]=_22[str];
            }
        }
        _2a.unshift(_29);
        if(_2a.length>1){
            rv[_28]=_2a;
        }
        _22={};
        _23="";
    }
    if(rv[""]&&rv[""][1]){
        var cur={};
        var _2d=rv[""][1].split(/\\n/);
        for(var i=0;i<_2d.length;i++){
            if(!_2d.length){
                continue;
            }
            var pos=_2d[i].indexOf(":",0);
            if(pos!=-1){
                var key=_2d[i].substring(0,pos);
                var val=_2d[i].substring(pos+1);
                var _31=key.toLowerCase();
                if(cur[_31]&&cur[_31].length){
                    _24.push("SKIPPING DUPLICATE HEADER LINE: "+_2d[i]);
                }else{
                    if(/#-#-#-#-#/.test(_31)){
                        _24.push("SKIPPING ERROR MARKER IN HEADER: "+_2d[i]);
                    }else{
                        val=val.replace(/^\s+/,"");
                        cur[_31]=val;
                    }
                }
            }else{
                _24.push("PROBLEM LINE IN HEADER: "+_2d[i]);
                cur[_2d[i]]="";
            }
        }
        rv[""]=cur;
    }else{
        rv[""]={};
    }
    return rv;
};
Gettext.prototype.parse_po_dequote=function(str){
    var _33;
    if(_33=str.match(/^"(.*)"/)){
        str=_33[1];
    }
    str=str.replace(/\\"/,"");
    return str;
};
Gettext.prototype.try_load_lang_json=function(uri){
    var _35=this.sjax(uri);
    if(!_35){
        return;
    }
    var rv=this.JSON(_35);
    this.parse_locale_data(rv);
    return 1;
};
Gettext.prototype.get_lang_refs=function(){
    var _37=new Array();
    var _38=document.getElementsByTagName("link");
    for(var i=0;i<_38.length;i++){
        if(_38[i].rel=="gettext"&&_38[i].href){
            if(typeof (_38[i].type)=="undefined"||_38[i].type==""){
                if(/\.json$/i.test(_38[i].href)){
                    _38[i].type="application/json";
                }else{
                    if(/\.js$/i.test(_38[i].href)){
                        _38[i].type="application/json";
                    }else{
                        if(/\.po$/i.test(_38[i].href)){
                            _38[i].type="application/x-po";
                        }else{
                            if(/\.mo$/i.test(_38[i].href)){
                                _38[i].type="application/x-mo";
                            }else{
                                throw new Error("LINK tag with rel=gettext found, but the type and extension are unrecognized.");
                            }
                        }
                    }
                }
            }
            _38[i].type=_38[i].type.toLowerCase();
            if(_38[i].type=="application/json"){
                _38[i].type="application/json";
            }else{
                if(_38[i].type=="text/javascript"){
                    _38[i].type="application/json";
                }else{
                    if(_38[i].type=="application/x-po"){
                        _38[i].type="application/x-po";
                    }else{
                        if(_38[i].type=="application/x-mo"){
                            _38[i].type="application/x-mo";
                        }else{
                            throw new Error("LINK tag with rel=gettext found, but the type attribute ["+_38[i].type+"] is unrecognized.");
                        }
                    }
                }
            }
            _37.push(_38[i]);
        }
    }
    return _37;
};
Gettext.prototype.textdomain=function(_3a){
    if(_3a&&_3a.length){
        this.domain=_3a;
    }
    return this.domain;
};
Gettext.prototype.gettext=function(_3b){
    var _3c;
    var _3d;
    var n;
    var _3f;
    return this.dcnpgettext(null,_3c,_3b,_3d,n,_3f);
};
Gettext.prototype.dgettext=function(_40,_41){
    var _42;
    var _43;
    var n;
    var _45;
    return this.dcnpgettext(_40,_42,_41,_43,n,_45);
};
Gettext.prototype.dcgettext=function(_46,_47,_48){
    var _49;
    var _4a;
    var n;
    return this.dcnpgettext(_46,_49,_47,_4a,n,_48);
};
Gettext.prototype.ngettext=function(_4c,_4d,n){
    var _4f;
    var _50;
    return this.dcnpgettext(null,_4f,_4c,_4d,n,_50);
};
Gettext.prototype.dngettext=function(_51,_52,_53,n){
    var _55;
    var _56;
    return this.dcnpgettext(_51,_55,_52,_53,n,_56);
};
Gettext.prototype.dcngettext=function(_57,_58,_59,n,_5b){
    var _5c;
    return this.dcnpgettext(_57,_5c,_58,_59,n,_5b,_5b);
};
Gettext.prototype.pgettext=function(_5d,_5e){
    var _5f;
    var n;
    var _61;
    return this.dcnpgettext(null,_5d,_5e,_5f,n,_61);
};
Gettext.prototype.dpgettext=function(_62,_63,_64){
    var _65;
    var n;
    var _67;
    return this.dcnpgettext(_62,_63,_64,_65,n,_67);
};
Gettext.prototype.dcpgettext=function(_68,_69,_6a,_6b){
    var _6c;
    var n;
    return this.dcnpgettext(_68,_69,_6a,_6c,n,_6b);
};
Gettext.prototype.npgettext=function(_6e,_6f,_70,n){
    var _72;
    return this.dcnpgettext(null,_6e,_6f,_70,n,_72);
};
Gettext.prototype.dnpgettext=function(_73,_74,_75,_76,n){
    var _78;
    return this.dcnpgettext(_73,_74,_75,_76,n,_78);
};
Gettext.prototype.dcnpgettext=function(_79,_7a,_7b,_7c,n,_7e){
    if(!this.isValidObject(_7b)){
        return "";
    }
    var _7f=this.isValidObject(_7c);
    var _80=this.isValidObject(_7a)?_7a+Gettext.context_glue+_7b:_7b;
    var _81=this.isValidObject(_79)?_79:this.isValidObject(this.domain)?this.domain:"messages";
    var _82="LC_MESSAGES";
    var _7e=5;
    var _83=new Array();
    if(typeof (Gettext._locale_data)!="undefined"&&this.isValidObject(Gettext._locale_data[_81])){
        _83.push(Gettext._locale_data[_81]);
    }else{
        if(typeof (Gettext._locale_data)!="undefined"){
            for(var dom in Gettext._locale_data){
                _83.push(Gettext._locale_data[dom]);
            }
        }
    }
    var _85=[];
    var _86=false;
    var _87;
    if(_83.length){
        for(var i=0;i<_83.length;i++){
            var _89=_83[i];
            if(this.isValidObject(_89.msgs[_80])){
                for(var j=0;j<_89.msgs[_80].length;j++){
                    _85[j]=_89.msgs[_80][j];
                }
                _85.shift();
                _87=_89;
                _86=true;
                if(_85.length>0&&_85[0].length!=0){
                    break;
                }
            }
        }
    }
    if(_85.length==0||_85[0].length==0){
        _85=[_7b,_7c];
    }
    var _8b=_85[0];
    if(_7f){
        var p;
        if(_86&&this.isValidObject(_87.head.plural_func)){
            var rv=_87.head.plural_func(n);
            if(!rv.plural){
                rv.plural=0;
            }
            if(!rv.nplural){
                rv.nplural=0;
            }
            if(rv.nplural<=rv.plural){
                rv.plural=0;
            }
            p=rv.plural;
        }else{
            p=(n!=1)?1:0;
        }
        if(this.isValidObject(_85[p])){
            _8b=_85[p];
        }
    }
    return _8b;
};
Gettext.strargs=function(str,_8f){
    if(null==_8f||"undefined"==typeof (_8f)){
        _8f=[];
    }else{
        if(_8f.constructor!=Array){
            _8f=[_8f];
        }
    }
    var _90="";
    while(true){
        var i=str.indexOf("%");
        var _92;
        if(i==-1){
            _90+=str;
            break;
        }
        _90+=str.substr(0,i);
        if(str.substr(i,2)=="%%"){
            _90+="%";
            str=str.substr((i+2));
        }else{
            if(_92=str.substr(i).match(/^%(\d+)/)){
                var _93=parseInt(_92[1]);
                var _94=_92[1].length;
                if(_93>0&&_8f[_93-1]!=null&&typeof (_8f[_93-1])!="undefined"){
                    _90+=_8f[_93-1];
                }
                str=str.substr((i+1+_94));
            }else{
                _90+="%";
                str=str.substr((i+1));
            }
        }
    }
    return _90;
};
Gettext.prototype.strargs=function(str,_96){
    return Gettext.strargs(str,_96);
};
Gettext.prototype.isArray=function(_97){
    return this.isValidObject(_97)&&_97.constructor==Array;
};
Gettext.prototype.isValidObject=function(_98){
    if(null==_98){
        return false;
    }else{
        if("undefined"==typeof (_98)){
            return false;
        }else{
            return true;
        }
    }
};
Gettext.prototype.sjax=function(uri){
    var _9a;
    if(window.XMLHttpRequest){
        _9a=new XMLHttpRequest();
    }else{
        if(navigator.userAgent.toLowerCase().indexOf("msie 5")!=-1){
            _9a=new ActiveXObject("Microsoft.XMLHTTP");
        }else{
            _9a=new ActiveXObject("Msxml2.XMLHTTP");
        }
    }
    if(!_9a){
        throw new Error("Your browser doesn't do Ajax. Unable to support external language files.");
    }
    _9a.open("GET",uri,false);
    try{
        _9a.send(null);
    }
    catch(e){
        return;
    }
    var _9b=_9a.status;
    if(_9b==200||_9b==0){
        return _9a.responseText;
    }else{
        var _9c=_9a.statusText+" (Error "+_9a.status+")";
        if(_9a.responseText.length){
            _9c+="\n"+_9a.responseText;
        }
        alert(_9c);
        return;
    }
};
Gettext.prototype.JSON=function(_9d){
    return eval("("+_9d+")");
};

CTSound=function(_1){
    this.sounds=[];
    this.soundPath=_1.soundPath;
    var _2=!!((myAudioTag=document.createElement("audio")).canPlayType);
    var _3=null;
    if(typeof Audio!="undefined"){
        _3=new Audio("");
    }
    this.haveAudio=_3&&!!(_3.canPlayType);
    if(this.haveAudio){
        this.canPlayOgg=(("no"!=_3.canPlayType("audio/ogg"))&&(""!=_3.canPlayType("audio/ogg")));
        this.canPlayMp3=(("no"!=_3.canPlayType("audio/mpeg"))&&(""!=_3.canPlayType("audio/mpeg")));
        this.canPlayWav=(("no"!=_3.canPlayType("audio/wav"))&&(""!=_3.canPlayType("audio/wav")));
    }
};
CTSound.prototype.createSound=function(_4,_5){
    if(!this.haveAudio){
        return;
    }
    var _6=null;
    var _7="";
    if(this.canPlayMp3){
        _7=this.soundPath+"/"+_4+".mp3";
    }else{
        if(this.canPlayOgg){
            _7=this.soundPath+"/"+_4+".ogg";
        }else{
            if(this.canPlayWav){
                _7=this.soundPath+"/"+_4+".wav";
            }
        }
    }
    if(_7){
        _6=new Audio(_7);
    }
    if(_6){
        _6.id=_5+"-"+_4;
        this.sounds[_4]=_6;
        if(_5){
            this.sounds[_5]=_6;
        }
    }
};
CTSound.prototype.playSound=function(_8){
    var _9=this.sounds[_8];
    if(_9){
        _9.play();
    }
};

function getLocale(){
    if(navigator){
        if(navigator.language){
            return navigator.language;
        }else{
            if(navigator.browserLanguage){
                return navigator.browserLanguage;
            }else{
                if(navigator.systemLanguage){
                    return navigator.systemLanguage;
                }else{
                    if(navigator.userLanguage){
                        return navigator.userLanguage;
                    }
                }
            }
        }
    }
}
var gt=null;
function init_gettext(){
    if(typeof json_locale_data!=="undefined"){
        var _1={"domain":"js-messages","locale_data":json_locale_data};
        gt=new Gettext(_1);
    }
}
init_gettext();
function _js(_2){
    if(gt){
        return gt.gettext(_2);
    }else{
        return _2;
    }
}
function __js(_3,a){
    var _3=_js(_3);
    for(var i=0;i<a.length;i++){
        var re=new RegExp("{"+a[i][0]+"}","g");
        _3=_3.replace(re,a[i][1]);
    }
    return _3;
}
function _jn(_7,_8,_9){
    var _a;
    if(gt){
        _a=gt.ngettext(_7,_8,_9);
    }else{
        if(_9==0||_9>1){
            _a=_8;
        }else{
            _a=_7;
        }
    }
    return _a;
}
function __jn(_b,_c,_d,a){
    var _f=_jn(_b,_c,_d);
    return __gt_expand(_f,a);
    return _f;
}
function __gt_expand(msg,a){
    for(var i=0;i<a.length;i++){
        var re=new RegExp("{"+a[i][0]+"}","g");
        msg=msg.replace(re,a[i][1]);
    }
    return msg;
}

PgnViewer=function(_1,_2){
    var _3=new BoardConfig();
    if(_1){
        _3.applyConfig(_1);
    }
    if(!window._pvObject){
        window._pvObject=new Array();
    }
    window._pvObject[_3.boardName]=this;
    _1=_3;
    _1.pgnMode=true;
    _1.scrollVariations=true;
    this.chessapp=new ChessApp(_1);
    this.finishedCallback=_2;
    if(_1.loadImmediately){
        this.chessapp.init(null,null,null,this,true);
        this.board=this.chessapp.board;
    }else{
        YAHOO.util.Event.onDOMReady(this.setup,this,true);
    }
};
PgnViewer.prototype.setup=function(){
    this.chessapp.init(null,null,null,this,true);
    this.board=this.chessapp.board;
};
PgnViewer.prototype.updatePieceCallback=function(_4,_5,_6,_7,_8,_9,_a,_b,_c,_d,_e,_f){
    var _10=new Object();
    var _11=_e;
    var _12=false;
    var _13=Board.getVarMove(_11,_7,_6,_5,_4);
    if(_11.fromColumn==_5.column&&_11.fromRow==_5.row&&_11.toRow==_7&&_11.toColumn==_6&&(_4==""||(_4==_11.promotion))){
        _12=true;
    }else{
        if(_13){
            _11=_13;
            _12=true;
        }
    }
    _10.move=_11;
    _10.allowMove=_12;
    _10.dontMakeOpponentMove=false;
    return _10;
};
PgnViewer.prototype.setupFromPgn=function(pgn,_15){
    this.chessapp.pgn.setupFromPGN(pgn,_15);
};
PgnViewer.prototype.setupFromFen=function(fen,_17,_18,_19){
    this.chessapp.pgn.board.setupFromFen(fen,_17,_18,_19);
};
PGNGame=function(_1a,_1b,_1c,_1d,_1e,_1f,_20,_21,_22,_23,_24,_25,eco){
    this.movesseq=_1a;
    this.startFen=_1b;
    this.blackPlayer=_1c;
    this.whitePlayer=_1d;
    this.pgn_result=_1e;
    this.event=_1f;
    this.site=_20;
    this.date=_21;
    this.round=_22;
    this.start_movenum=_23;
    this.whitePlayerElo=_24;
    this.blackPlayerElo=_25;
    this.eco=eco;
};
PGN=function(_27){
    this.board=_27;
    this.pgnGames=new Array();
    this.lastShownGame=0;
};
PGN.prototype.pollPGNFromURL=function(url,_29,_2a){
    var _2b=this;
    this.getPGNFromURL(url,_29);
    if(this.foundResult){
        _2a=this.board.pollPGNMillisecondsPostResult;
        this.foundResultPolls++;
    }
    if(this.foundResultPolls>=this.board.numberPollsAfterResult){
        this.finishedPolling=true;
        return;
    }
    this.pollTime=_2a;
    this.lastPoll=new Date().getTime();
    setTimeout(function(){
        _2b.pollPGNFromURL(url,_29,_2a);
    },_2a);
};
PGN.prototype.getPGNFromURL=function(url,_2d){
    var _2e=(new Date()).getTime()+"-"+parseInt(Math.random()*99999);
    YAHOO.util.Connect.asyncRequest("GET",url+"?rs="+_2e,{success:function(o){
        var _30="";
        var _31="";
        var _32="";
        var re=eval("/\\n[^[]/");
        if(o.responseText.indexOf("\r")>=0){
            eval("/\\r[^[]/");
        }
        var ind=o.responseText.search(re);
        if(ind>=0){
            _32=o.responseText.substring(ind);
        }
        re=eval("/\\[Result /");
        ind=o.responseText.search(re);
        if(ind>=0){
            var _35=o.responseText.indexOf("\n",ind);
            if(_35<0){
                _35=o.responseText.indexOf("\r",ind);
            }
            if(_35>=0){
                _30=o.responseText.substring(ind,_35);
            }
        }
        re=eval("/\\[Site /");
        ind=o.responseText.search(re);
        if(ind>=0){
            var _35=o.responseText.indexOf("]",ind);
            if(_35>=0){
                _31=o.responseText.substring(ind+6,_35-1);
            }
        }
        if(_31){
            if(this.board.fideClock){
                var _36=YAHOO.util.Dom.get(this.board.boardName+"-whitePlayerClock");
                var _37=YAHOO.util.Dom.get(this.board.boardName+"-blackPlayerClock");
                var ss=_31.split("-");
                var _39=ss[0];
                var _3a="0";
                if(_39.charAt(0)=="\""){
                    _39=_39.substr(1);
                }
                if(ss.length>1){
                    _3a=ss[1];
                }
                if(_36){
                    _36.innerHTML=_39;
                }
                if(_37){
                    _37.innerHTML=_3a;
                }
            }else{
                var _3b=YAHOO.util.Dom.get(this.board.boardName+"-site");
                if(_3b){
                    _3b.innerHTML=_31;
                }
            }
        }
        if(this.currentMoveText==_32&&this.currentResultTag==_30){
            return;
        }
        this.currentMoveText=_32;
        this.currentResultTag=_30;
        this.setupFromPGN(o.responseText,_2d);
    },failure:function(o){
        if(!this.board.hidePGNErrors){
            alert("pgn load failed:"+o.statusText+" for file:"+url);
        }
    },scope:this},"rs2="+_2e);
};
PGN.prototype.getMoveFromPGNMove=function(_3d,_3e,_3f){
    var _40=false;
    var _41=false;
    var _42=false;
    var _43;
    var _44=null;
    var _45=false;
    var _46=null;
    if(_3d.charAt(_3d.length-1)=="#"){
        _41=true;
        _40=true;
        _3d=_3d.substr(0,_3d.length-1);
    }else{
        if(_3d.charAt(_3d.length-1)=="+"){
            _41=true;
            if(_3d.length>1&&_3d.charAt(_3d.length-2)=="+"){
                _40=true;
                _3d=_3d.substr(0,_3d.length-2);
            }else{
                _3d=_3d.substr(0,_3d.length-1);
            }
        }
    }
    if(_3d=="O-O-O"){
        if(_3e=="w"){
            return this.board.createMoveFromString("e1c1");
        }else{
            return this.board.createMoveFromString("e8c8");
        }
    }else{
        if(_3d=="O-O"){
            if(_3e=="w"){
                return this.board.createMoveFromString("e1g1");
            }else{
                return this.board.createMoveFromString("e8g8");
            }
        }
    }
    var _47=_3d.indexOf("=");
    if(_47>=0){
        var _48;
        _44=_3d.substr(_47+1,1);
        _48=_44.charAt(0);
        _43=this.board.pieceCharToPieceNum(_48);
        _42=true;
        _3d=_3d.substr(0,_47);
    }
    var _49=_3d.charAt(_3d.length-1);
    if(_49=="Q"||_49=="R"||_49=="N"||_49=="B"){
        _44=_49+"";
        _43=this.board.pieceCharToPieceNum(_44);
        _42=true;
        _3d=_3d.substr(0,_3d.length-1);
    }
    var _4a=_3d.substr(_3d.length-2,2);
    var _4b=_4a.charCodeAt(0)-"a".charCodeAt(0);
    var _4c=_4a.charCodeAt(1)-"1".charCodeAt(0);
    if(_4b>7||_4b<0||_4c>7||_4c<0){
        this.lastMoveFromError=__js("Error processing to Square:{TO_SQUARE} on move:{MOVE}",[["TO_SQUARE",_4a],["MOVE",_3d]]);
        return null;
    }
    if(_3d.length>2){
        if(_3d.charAt(_3d.length-3)=="x"){
            _45=true;
            _46=_3d.substr(0,_3d.length-3);
        }else{
            _46=_3d.substr(0,_3d.length-2);
        }
    }
    var _4d=new Array();
    var _4e=0;
    var _4f=null;
    var _50=(_3e=="w")?ChessPiece.WHITE:ChessPiece.BLACK;
    switch(_3d.charAt(0)){
        case "K":
        case "k":
            _4f=ChessPiece.KING;
            break;
        case "Q":
        case "q":
            _4f=ChessPiece.QUEEN;
            break;
        case "R":
        case "r":
            _4f=ChessPiece.ROOK;
            break;
        case "B":
            _4f=ChessPiece.BISHOP;
            break;
        case "N":
        case "n":
            _4f=ChessPiece.KNIGHT;
            break;
        case "P":
        case "p":
            _4f=ChessPiece.PAWN;
            break;
        default:
            _4f=ChessPiece.PAWN;
    }
    var _51=null;
    var _52=null;
    if(_46){
        var _53=_46.toLowerCase().charAt(0);
        if(_53==_46.charAt(0)&&_53>="a"&&_53<="h"){
            _52=_53;
            if(_46.length==2){
                _51=_46.charAt(1);
            }
        }else{
            if(_46.length>1){
                if(_46.length==2){
                    var c=_46.charAt(1);
                    if(c>="1"&&c<="8"){
                        _51=c;
                    }else{
                        _52=c;
                    }
                }else{
                    if(_46.length==3){
                        _52=_46.charAt(1);
                        _51=_46.charAt(2);
                        if(_52>="1"&&_52<="9"){
                            var tmp=_52;
                            _52=_51;
                            _51=tmp;
                        }
                    }else{
                        this.lastMoveFromError=__js("Error: unhandled fromChars:{FROM_CHARS}",[["FROM_CHARS",_46]]);
                        return null;
                    }
                }
            }
        }
    }
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var bp=this.board.boardPieces[i][j];
            if(bp!=null&&bp.colour==_50&&bp.piece==_4f){
                if(this.board.canMove(bp,_4b,_4c,_3f,true)){
                    var _59=String.fromCharCode("a".charCodeAt(0)+i).charAt(0);
                    var _5a=String.fromCharCode("1".charCodeAt(0)+j).charAt(0);
                    if((_52==null||_52==_59)&&(_51==null||_51==_5a)){
                        _4d[_4e++]=bp;
                    }else{
                    }
                }
            }
        }
    }
    if(_4e==0){
        this.lastMoveFromError=__js("no candidate pieces for:{MOVE}",[["MOVE",_3d]]);
        return null;
    }
    if(_4e>1){
        this.lastMoveFromError=__js("Ambiguous:{MOVE} with fromChars:{FROM_CHARS} disambigRow:{DISAMBIG_ROW} disambigCol:{DISAMBIG_COL}",[["MOVE",_3d],["FROM_CHARS",_46],["DISAMBIG_ROW",_51],["DISAMBIG_COL",_52]]);
        return null;
    }
    var _5b=_4d[0];
    var _5c="";
    _5c+=String.fromCharCode("a".charCodeAt(0)+_5b.column);
    _5c+=String.fromCharCode("1".charCodeAt(0)+_5b.row);
    if(_45){
        _5c+="x";
    }
    _5c+=_4a;
    if(_44){
        _5c+=_44;
    }
    var _5d=this.board.createMoveFromString(_5c);
    return _5d;
};
PGN.prototype.parseTag=function(_5e,pgn,_60){
    if(pgn.substr(_60,_5e.length+3)=="["+_5e+" \""){
        var _61=pgn.indexOf("\"",_60+_5e.length+3);
        if(_61>=0){
            return pgn.substring(_60+_5e.length+3,_61);
        }
    }
    return null;
};
PGN.prototype.parsePGN=function(pgn,_63,_64){
    if(ctime){
        console.time("parsePGN");
    }
    pgn=pgn.replace(/&nbsp;/g," ");
    pgn=pgn.replace(/^\s+|\s+$/g,"");
    var _65=0;
    this.pgn=pgn;
    var _66=new Array();
    var _67=1;
    var _68=0;
    this.pgnGames=new Array();
    this.finishedParseCallback=_63;
    this.startParseTime=new Date().getTime();
    var ret=this.parsePGN_cont(_66,_67,_68,_65,_64);
    var _6a=new Object();
    if(!ret){
        _6a.parsedOk=true;
        _6a.pgnGames=this.pgnGames;
    }else{
        _6a.parsedOk=false;
        _6a.errorString=ret;
        _6a.pgnGames=null;
    }
    if(ctime){
        console.timeEnd("parsePGN");
    }
    return _6a;
};
PGN.prototype.parsePGN_cont=function(_6b,_6c,_6d,_6e,_6f){
    var pgn=this.pgn;
    var _71=this.board.boardName+"-progress";
    var _72=YAHOO.util.Dom.get(_71);
    while(_6e<pgn.length){
        var _73="";
        var _74="";
        var _75="";
        var _76="";
        var _77="";
        var _78="?";
        var _79="";
        var _7a="?";
        var _7b="?";
        var eco="";
        var _7d="w";
        var _7e=0;
        var _7f=0;
        var _80=new Array();
        var _81=0;
        var _82="";
        var _83=null;
        var _84=null;
        var _85=new Array();
        var _86=new Array();
        var _87=new Array();
        var _88=new Array();
        var _89=new Array();
        this.board.pieceMoveDisabled=true;
        if(this.board.initialFen){
            this.board.startFen=this.board.initialFen;
        }else{
            this.board.startFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        }
        var i=0;
        for(i=_6e;i<pgn.length;i++){
            var tag=this.parseTag("FEN",pgn,i);
            if(tag&&tag!="?"){
                this.board.startFen=tag;
            }else{
                tag=this.parseTag("White",pgn,i);
                if(tag&&tag!="?"){
                    _79=tag;
                }else{
                    tag=this.parseTag("Black",pgn,i);
                    if(tag&&tag!="?"){
                        _74=tag;
                    }else{
                        tag=this.parseTag("Result",pgn,i);
                        if(tag&&tag!="?"){
                            _73=tag;
                        }else{
                            tag=this.parseTag("Event",pgn,i);
                            if(tag&&tag!="?"){
                                _75=tag;
                            }else{
                                tag=this.parseTag("Site",pgn,i);
                                if(tag&&tag!="?"){
                                    _76=tag;
                                }else{
                                    tag=this.parseTag("Date",pgn,i);
                                    if(tag&&tag!="?"){
                                        _77=tag;
                                    }else{
                                        tag=this.parseTag("Round",pgn,i);
                                        if(tag&&tag!="?"){
                                            _78=tag;
                                        }else{
                                            tag=this.parseTag("WhiteElo",pgn,i);
                                            if(tag&&tag!="?"){
                                                _7a=tag;
                                            }else{
                                                tag=this.parseTag("BlackElo",pgn,i);
                                                if(tag&&tag!="?"){
                                                    _7b=tag;
                                                }else{
                                                    tag=this.parseTag("ECO",pgn,i);
                                                    if(tag&&tag!="?"){
                                                        eco=tag;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if(pgn.charAt(i)=="["){
                var j=pgn.indexOf;
                for(j=i+1;j<pgn.length&&pgn.charAt(j)!="]";j++){
                }
                if(j==pgn.length){
                    var err=_js("PgnViewer: Error parsing PGN. Found unclosed [");
                    if(this.finishedParseCallback){
                        this.finishedParseCallback(_6f,err);
                    }
                    return err;
                }
                i=j-1;
                continue;
            }
            if(pgn.charAt(i)=="{"){
                var _8e=pgn.indexOf("}",i+1);
                if(_8e>=0){
                    var _8f=pgn.substring(i+1,_8e);
                    i=_8e;
                    _82+="{ "+_8f+" } ";
                }else{
                    var err=_js("PgnViewer: Error parsing PGN. Found unclosed {");
                    if(this.finishedParseCallback){
                        this.finishedParseCallback(_6f,err);
                    }
                    return err;
                }
                continue;
            }
            if(pgn.substr(i,1)=="."){
                var j=i-1;
                while(j>=0&&pgn.charAt(j)>="0"&&pgn.charAt(j)<="9"){
                    j--;
                }
                j++;
                if(pgn.charAt(j)>="0"&&pgn.charAt(j)<="9"){
                    _6c=parseInt(pgn.substring(j,i));
                }
                break;
            }
        }
        if(pgn.substr(i,1)!="."){
        }
        this.board.prev_move=null;
        this.board.setupFromFen(this.board.startFen,false,false,true,true);
        _83=this.board.prev_move;
        var _90=i;
        var _91=null;
        for(i=i;i<pgn.length;i++){
            var _92=-1;
            if(pgn.substr(i,3)=="1-0"||pgn.substr(i,3)=="0-1"){
                _92=3;
            }else{
                if(pgn.substr(i,7)=="1/2-1/2"){
                    _92=7;
                }else{
                    if(pgn.substr(i,1)=="*"){
                        _92=1;
                    }
                }
            }
            if(_92>0){
                _91=pgn.substr(i,_92);
                _6e=i+_92;
                break;
            }
            if(pgn.charAt(i)=="["){
                _6e=i;
                break;
            }
            if(pgn.charAt(i)==" "||pgn.charAt(i)=="\t"||pgn.charAt(i)=="\n"||pgn.charAt(i)=="\r"){
                _90=i+1;
                continue;
            }
            if(pgn.charAt(i)>="0"&&pgn.charAt(i)<="9"){
                continue;
            }
            if(pgn.charAt(i)=="."){
                var _93=pgn.substring(_90,i).replace(/^\s+|\s+$/g,"");
                _90=i;
                while(i+1<pgn.length&&pgn.charAt(i+1)=="."){
                    i++;
                }
                if(_90!=i){
                    _7d="b";
                }else{
                    _7d="w";
                }
                _90=i+1;
            }else{
                if(pgn.charAt(i)=="{"){
                    var _8e=pgn.indexOf("}",i+1);
                    if(_8e>=0){
                        var _8f=pgn.substring(i+1,_8e);
                        i=_8e;
                        _82+="{ "+_8f+" } ";
                    }
                    _90=i+1;
                }else{
                    if(pgn.charAt(i)=="("){
                        _85[_7e]=this.board.boardPieces;
                        _86[_7e]=_7d;
                        _88[_7e]=_83;
                        _89[_7e]=_84;
                        this.board.boardPieces=_87[_7e];
                        this.board.boardPieces=this.board.copyBoardPieces(false);
                        _83=_84;
                        _7e++;
                        _90=i+1;
                        _82+="( ";
                    }else{
                        if(pgn.charAt(i)==")"){
                            boardPool.putObject(_85[_7e]);
                            _7e--;
                            this.board.boardPieces=_85[_7e];
                            _7d=_86[_7e];
                            _83=_88[_7e];
                            _84=_89[_7e];
                            _90=i+1;
                            _82+=") ";
                        }else{
                            if(pgn.charAt(i)=="$"){
                                var j;
                                for(j=i+1;j<pgn.length&&pgn.charAt(j)>="0"&&pgn.charAt(j)<="9";j++){
                                }
                                j--;
                                if(j>i){
                                    var _94=parseInt(pgn.substr(i+1,j+1));
                                    if(_94<=9){
                                        switch(_94){
                                            case 1:
                                                _82=_82.substr(0,_82.length-1)+"! ";
                                                break;
                                            case 2:
                                                _82=_82.substr(0,_82.length-1)+"? ";
                                                break;
                                            case 3:
                                                _82=_82.substr(0,_82.length-1)+"!! ";
                                                break;
                                            case 4:
                                                _82=_82.substr(0,_82.length-1)+"?? ";
                                                break;
                                            case 5:
                                                _82=_82.substr(0,_82.length-1)+"!? ";
                                                break;
                                            case 6:
                                                _82=_82.substr(0,_82.length-1)+"?! ";
                                                break;
                                            case 7:
                                            case 8:
                                            case 9:
                                            case 0:
                                            default:
                                        }
                                    }else{
                                        _82+=pgn.substring(i,j+1)+" ";
                                    }
                                    i=j;
                                }
                                continue;
                            }else{
                                var _95=-1;
                                for(var j=i+1;j<pgn.length;j++){
                                    if(pgn.charAt(j)==")"||pgn.charAt(j)=="("||pgn.charAt(j)=="{"||pgn.charAt(j)=="}"||pgn.charAt(j)==" "||pgn.charAt(j)=="\t"||pgn.charAt(j)=="\n"||pgn.charAt(j)=="\r"){
                                        _95=j;
                                        break;
                                    }
                                }
                                if(_95==-1){
                                    _95=pgn.length;
                                }
                                var _96=_90;
                                var _97=pgn.substring(_90,_95).replace(/^\s+|\s+$/g,"");
                                _90=_95;
                                i=_90-1;
                                if(_97.length>=4&&_97.substring(0,4)=="e.p."){
                                    continue;
                                }
                                if(_97.length==0){
                                    var err=__js("PgnViewer: Error: got empty move endMoveInd:{ENDMOVE_INDEX} upto:{UPTO} from:{FROM}",[["ENDMOVE_INDEX",_95],["UPTO",_96],["FROM",pgn.substr(_96)]]);
                                    if(this.finishedParseCallback){
                                        this.finishedParseCallback(_6f,err);
                                    }
                                    return err;
                                }
                                var _98=_97.length-1;
                                while(_98>=0){
                                    if(_97.charAt(_98)=="?"){
                                        _98--;
                                    }else{
                                        if(_97.charAt(_98)=="!"){
                                            _98--;
                                        }else{
                                            break;
                                        }
                                    }
                                }
                                var _99=_97.substring(0,_98+1);
                                var _9a=this.getMoveFromPGNMove(_99,_7d,_83);
                                if(_9a==null){
                                    _82+="unknown ";
                                    var err=__js("PgnViewer: Error parsing:{MOVE}, {ERROR_REASON}",[["MOVE",_97],["ERROR_REASON",this.lastMoveFromError]]);
                                    if(this.finishedParseCallback){
                                        this.finishedParseCallback(_6f,err);
                                    }
                                    return err;
                                }
                                _84=_83;
                                _83=_9a;
                                var _9b=this.board.boardPieces[_9a.fromColumn][_9a.fromRow];
                                boardPool.putObject(_87[_7e]);
                                _87[_7e]=this.board.copyBoardPieces(false);
                                if(_9b){
                                    this.board.makeMove(_9a,_9b,false,0.5,false,false);
                                }
                                _7f=_7e;
                                _81++;
                                _7d=this.board.flipToMove(_7d);
                                _82+=_9a.moveString+"|"+_97+" ";
                            }
                        }
                    }
                }
            }
        }
        if(_6e<i){
            _6e=i;
        }
        var _9c=pgn.indexOf("{",_6e);
        var _9d=pgn.indexOf("[",_6e);
        if(_9c>=0){
            if(_9d==-1||_9c<_9d){
                var _9e=pgn.indexOf("}",_9c+1);
                if(_9e>=0){
                    var _8f=pgn.substring(_9c+1,_9e);
                    _6e=_9e+1;
                    _82+="{ "+_8f+" } ";
                }else{
                    var err=_js("PgnViewer: Error: Unclosed {");
                    if(this.finishedParseCallback){
                        this.finishedParseCallback(_6f,err);
                    }
                    return err;
                }
            }
        }
        _82=_82.replace(/^\s+|\s+$/g,"");
        this.board.pieceMoveDisabled=false;
        if(_91!=null){
            if(_73.length==0||_73=="?"){
                _73=_91;
            }
        }
        if(this.board.ignoreMultipleGames){
            if(_91&&_73&&_73=="*"&&_91!="*"&&_91!="?"&&_91!=""){
                _73=_91;
            }
        }
        this.pgnGames[_6d++]=new PGNGame(_82,this.board.startFen,_74,_79,_73,_75,_76,_77,_78,_6c,_7a,_7b,eco);
        if(_72){
            _72.innerHTML="Loaded "+_6d+" games";
        }
        if(this.board.ignoreMultipleGames){
            break;
        }
        if(this.finishedParseCallback&&new Date().getTime()-this.startParseTime>500){
            this.startParseTime=new Date().getTime();
            setTimeout("window._pvObject[\""+this.board.boardName+"\"].chessapp.pgn.parsePGN_cont(\""+_6b+"\",\""+_6c+"\",\""+_6d+"\",\""+_6e+"\","+_6f+");",0);
            return;
        }
    }
    if(this.finishedParseCallback){
        this.finishedParseCallback(_6f);
    }
    return false;
};
PGN.prototype.setupFromPGN=function(pgn,_a0){
    this.parsePGN(pgn,this.setupFromPGNCallback,_a0);
};
PGN.prototype.setupFromPGNCallback=function(_a1,err){
    var _a3=this.board.boardName+"-progress";
    var _a4=YAHOO.util.Dom.get(_a3);
    if(err){
        if(!this.board.hidePGNErrors){
            var _a5=YAHOO.util.Dom.get(this.board.boardName+"-pgnError");
            if(_a5){
                _a5.innerHTML=err;
            }else{
                alert(err);
            }
        }
        return false;
    }
    if(this.pgnGames.length==0){
        if(!this.board.hidePGNErrors){
            alert("PgnViewer: Error: Unable to find any pgn games in:"+pgn);
        }
        return false;
    }
    if(this.pgnGames.length==1||this.board.ignoreMultipleGames){
        var _a6=0;
        if(_a1){
            _a6=-1;
        }
        this.showGame(0,_a6);
    }else{
        var _a7=this.board.boardName+"-container";
        var _a8=YAHOO.util.Dom.get(_a7);
        var _a9=YAHOO.util.Dom.get(this.board.boardName+"-problemSelector");
        var _aa=document.createElement("div");
        var _ab="<form id=\""+this.board.boardName+"-problemSelectorForm\" action=\"\" method=\"\">";
        var _ac="<select id=\""+this.board.boardName+"-problemSelector\" name=\""+this.board.boardName+"-problemSelector\" style=\"width: "+this.board.pieceSize*8+"px;\">";
        var _ad="";
        for(i=0;i<this.pgnGames.length;i++){
            var _ae=this.pgnGames[i];
            var _af=this.board.boardName+"-game-"+i;
            var _b0=(i+1)+". "+_ae.whitePlayer+" vs "+_ae.blackPlayer;
            if(_ae.pgn_result.length>0&&_ae.pgn_result!="?"&&this.board.showResult==1){
                _b0+=" "+_ae.pgn_result;
            }
            if(_ae.event.length>0&&_ae.event!="?"&&this.board.showEvent==1){
                _b0+=" "+_ae.event;
            }
            if(_ae.round.length>0&&_ae.round!="?"&&this.board.showRound==1){
                _b0+=" Rnd:"+_ae.round;
            }
            if(_ae.site.length>0&&_ae.site!="?"&&this.board.showSite==1){
                _b0+=" "+_ae.site;
            }
            if(_ae.date.length>0&&_ae.date!="?"&&this.board.showDate==1){
                _b0+=" "+_ae.date;
            }
            var sel="";
            if(i==this.lastShownGame){
                sel="selected=\"\"";
            }
            _ad+="<option "+sel+" id=\""+_af+"\" value=\""+i+"\">"+_b0+"</option>";
        }
        if(_a9){
            if(this.board.selectorBody!=_ad){
                _a9.innerHTML=_ad;
                this.board.selectorBody=_ad;
            }
        }else{
            _ab+=_ac+_ad+"</select></form>";
            _aa.innerHTML=_ab;
            _a8.insertBefore(_aa,_a8.firstChild);
            this.board.selectorBody=_ad;
        }
        var _a9=YAHOO.util.Dom.get(this.board.boardName+"-problemSelector");
        YAHOO.util.Event.addListener(_a9,"change",this.selectGame,this,true);
        var _a6=0;
        var _b2=0;
        if(_a1){
            _a6=-1;
            _b2=this.lastShownGame;
        }
        this.showGame(_b2,_a6);
    }
    if(_a4){
        YAHOO.util.Dom.setStyle(_a4,"visibility","hidden");
    }
    if(window._pvObject[this.board.boardName].finishedCallback){
        window._pvObject[this.board.boardName].finishedCallback();
    }
    return;
};
PGN.prototype.selectGame=function(e){
    var _b4=YAHOO.util.Event.getTarget(e).selectedIndex;
    var _b5=0;
    if(this.board.gotoEndOnRefresh){
        _b5=-1;
    }
    this.showGame(_b4,_b5);
    var _b6=this.board.boardName+"-piecestaken";
    var _b7=YAHOO.util.Dom.get(_b6);
    if(_b7){
        _b7.innerHTML="";
    }
    this.board.resetMoveListScrollPosition();
};
PGN.prototype.showGame=function(_b8,_b9){
    _b9=(typeof _b9=="undefined")?0:_b9;
    var _ba=this.lastShownGame;
    this.lastShownGame=_b8;
    var _bb=this.board.moveArray;
    var _bc=this.board.currentMove;
    var _bd=false;
    if(_bc&&_bc.atEnd){
        _bd=true;
    }
    var _be=this.pgnGames[_b8];
    var _bf=_be.pgn_result;
    if(_bf&&(_bf=="1/2-1/2"||_bf=="0-1"||_bf=="1-0")){
        this.foundResult=true;
    }else{
        this.foundResult=false;
        this.foundResultPolls=0;
    }
    this.board.startFen=_be.startFen;
    this.board.setupFromFen(_be.startFen,false,false,false);
    this.board.setMoveSequence(_be.movesseq,"NA",_be.start_movenum,_be.pgn_result);
    var _c0=true;
    var _c1=-1;
    if(_b8==_ba&&_bd){
        _c1=this.board.moveArray.length-1;
    }
    if(!Move.moveArraysEqual(_bb,this.board.moveArray)){
        _c0=false;
    }else{
        var _c2=Move.findMoveInNewArray(_bb,this.board.moveArray,_bc);
        if(_c2&&_c2.prev){
            _c1=_c2.prev.index;
        }
    }
    this.board.displayPendingMoveList();
    if(this.board.moveArray.length>0){
        this.board.setCurrentMove(this.board.moveArray[0]);
    }
    if(_c0){
        if(_c1>0&&_c1<this.board.moveArray.length){
            if(clog){
                console.log("going to currMoveIndex:"+_c1);
            }
            this.board.gotoMoveIndex(_c1,false,true);
        }else{
        }
    }else{
        if(_b9==-1){
            var _c3=this.board.moveArray.length-1;
            if(_c3>=0){
                this.board.gotoMoveIndex(_c3,false,true);
            }
        }else{
            if(_b9!=0){
                this.board.gotoMoveIndex(_b9);
            }
        }
        if(_b9!=-1&&this.board.autoplayFirst){
            this.board.forwardMove();
        }
    }
    this.board.displayMode=true;
    var _c4=this.board.boardName;
    var _c5=YAHOO.util.Dom.get(_c4+"-whitePlayer");
    if(_c5){
        _c5.innerHTML=_be.whitePlayer;
    }
    var _c6=YAHOO.util.Dom.get(_c4+"-blackPlayer");
    if(_c6){
        _c6.innerHTML=_be.blackPlayer;
    }
    var _c7=YAHOO.util.Dom.get(_c4+"-event");
    if(_c7){
        _c7.innerHTML=_be.event;
    }
    var _c8=YAHOO.util.Dom.get(_c4+"-site");
    if(_c8){
        _c8.innerHTML=_be.site;
    }
    var _c9=YAHOO.util.Dom.get(_c4+"-date");
    if(_c9){
        _c9.innerHTML=_be.date;
    }
    var _ca=YAHOO.util.Dom.get(_c4+"-round");
    if(_ca){
        _ca.innerHTML=_be.round;
    }
    var _cb=YAHOO.util.Dom.get(_c4+"-whiteElo");
    if(_cb){
        _cb.innerHTML=_be.whitePlayerElo;
    }
    var _cc=YAHOO.util.Dom.get(_c4+"-blackElo");
    if(_cc){
        _cc.innerHTML=_be.blackPlayerElo;
    }
    var _cd=YAHOO.util.Dom.get(_c4+"-result");
    if(_cd){
        _cd.innerHTML=_be.pgn_result;
    }
    if(clog){
        if(this.board.currentMove){
            console.log("after show game currentMove:"+this.board.currentMove.output());
        }else{
            console.log("after show game currentMove is null");
        }
    }
};

var SITE_VERSION=1;
var clog=false;
var ctime=false;
var cprof=false;
var move_obj_id_counter=0;
var activeBoard=null;
var boardSounds=new CTSound({soundPath:"/sounds"});
YAHOO.util.Event.onDOMReady(function(){
    boardSounds.createSound("takesounds/78263__SuGu14__Metall01","takePiece1");
    boardSounds.createSound("movesounds/77971__SuGu14__Fusta_0_05","movePiece3");
    boardSounds.createSound("movesounds/10537__batchku__Hit_knuckle_15_004","movePiece7");
    boardSounds.createSound("analysis/76426__spazzo_1493__Finished","finished");
});
function isMouseOver(_1,e){
    var el=YAHOO.util.Dom.get(_1);
    if(!el){
        return false;
    }
    var _4=YAHOO.util.Dom.getRegion(el);
    if(!_4){
        return false;
    }
    var _5=_4.top;
    var _6=_4.left;
    var _7=_4.bottom;
    var _8=_4.right;
    var _9=YAHOO.util.Event.getXY(e);
    var mX=_9[0];
    var mY=_9[1];
    var _c=(mX>_6&&mX<_8&&mY>_5&&mY<_7);
}
function trimStr(_d){
    if(!_d){
        return "";
    }
    var _d=_d.replace(/^\s\s*/,"");
    var ws=/\s/;
    var i=_d.length;
    while(ws.test(_d.charAt(--i))){
    }
    return _d.slice(0,i+1);
}
BoardConfig=function(){
    this.boardName="board";
    this.puzzle=false;
    this.showToMoveIndicators=false;
    this.scrollVariations=false;
    this.pgnString=null;
    this.pgnDiv=null;
    this.pgnFile=null;
    this.scrollOffsetCorrection=0;
    this.handleCommentClicks=false;
    this.pollPGNMilliseconds=0;
    this.pollPGNMillisecondsPostResult=30000;
    this.numberPollsAfterResult=5;
    this.gotoEndOnRefresh=false;
    this.allowPreMoveSelection=false;
    this.pieceSet="merida";
    this.pieceSize=46;
    this.isEndgame=false;
    this.tr=false;
    this.ie6FixCoordsOffsetSize=4;
    this.allIeFixCoordsOffsetSize=0;
    this.addVersion=true;
    this.ignoreMultipleGames=false;
    this.ml=9999;
    this.r=false;
    this.g=false;
    this.g2=false;
    this.canPasteFen=false;
    this.makeActive=false;
    this.showSolutionButton=false;
    this.avoidMouseoverActive=false;
    this.autoScrollMoves=false;
    this.moveAnimationLength=0.5;
    this.showBracketsOnVariation=true;
    this.hideBracketsOnTopLevelVariation=false;
    this.variationStartString=" ( ";
    this.variationEndString=" ) ";
    this.ignoreCommentRegex=null;
    this.newlineForEachMainMove=true;
    this.useDivClearForNewline=false;
    this.showNPS=false;
    this.squareColorClass="";
    this.analysisWindowName="analysis_window";
    this.pieceTakenSize=this.pieceSize;
    this.pauseBetweenMoves=800;
    this.pgnMode=false;
    this.hidePGNErrors=false;
    this.previewMode=false;
    this.movesFormat="default";
    this.boardImagePath="http://chesstempo.com";
    this.showCoordinates=false;
    this.highlightFromTo=true;
    this.highlightValidSquares=false;
    this.fideClock=false;
    this.disableFlipper=false;
    this.showResult=1;
    this.showEvent=1;
    this.showRound=1;
    this.showSite=1;
    this.showDate=1;
    this.ignoreFlipping=false;
    this.reverseFlip=false;
    this.autoplayFirst=false;
    this.dontOutputNavButtons=false;
    this.dontCheckLeavingPage=false;
    this.clickAndClick=false;
    this.clickAndClickDisabled=false;
    this.whiteMoveSoundName="movePiece3";
    this.blackMoveSoundName="movePiece7";
    this.whiteTakeSoundName="takePiece1";
    this.blackTakeSoundName="takePiece1";
    this.finishedSoundName="finished";
    this.soundEnabled=false;
    this.gamedb=false;
};
BoardConfig.prototype.applyConfig=function(_10){
    for(var _11 in _10){
        this[_11]=_10[_11];
    }
};
ChessApp=function(_12){
    this.displayMode=false;
    this.config=_12;
    this.board=null;
};
ChessApp.prototype.setDisplayMode=function(_13){
    this.displayMode=_13;
};
ChessApp.prototype.setProblemNumber=function(_14,_15){
    this.problemNumber=_14;
    this.attId=_15;
};
ChessApp.prototype.init=function(e,_17,_18,us,_1a){
    ChessPiece.init();
    this.board=new Board(this.config.boardName);
    if(_1a){
        this.board.addUpdatePieceListener(us);
    }
    this.board.moveArray=new Array();
    if(!this.hideOnInit){
        YAHOO.util.Dom.setStyle(this.config.boardName+"-container","display","block");
        YAHOO.util.Dom.setStyle("toPlaySpan","display","inline");
    }
    this.tactics=(this.displayMode||this.config.pgnMode||this.config.previewMode||this.config.fenBoard)?null:new TacticsUI(this.board);
    this.problem=(this.config.pgnMode||this.config.previewMode||this.config.fenBoard)?null:new ProblemUI(this.board,this.tactics);
    this.board.tactics=this.tactics;
    this.board.problem=this.problem;
    this.board.puzzle=this.config.puzzle;
    if(this.problem){
        this.problem.autoPlayOpponent=1;
    }
    this.pgn=(this.config.pgnMode)?new PGN(this.board):null;
    var _1b=MovesDisplay.DEFAULT_DISPLAY_TYPE;
    if(this.config.movesFormat=="main_on_own_line"){
        _1b=MovesDisplay.MAIN_ON_OWN_LINE;
    }
    this.movesDisplay=new MovesDisplay(this.board,_1b);
    this.movesDisplay.variationOnOwnLine=this.config.variationOnOwnLine;
    this.board.movesDisplay=this.movesDisplay;
    this.board.boardImagePath=this.config.boardImagePath;
    this.board.showNPS=this.config.showNPS;
    this.board.showSolutionButton=this.config.showSolutionButton;
    this.board.analysisWindowName=this.config.analysisWindowName;
    this.board.squareColorClass=this.config.squareColorClass;
    this.board.tr=this.config.tr;
    this.board.scrollToBoardTop=this.config.scrollToBoardTop;
    this.board.ml=this.config.ml;
    this.board.r=this.config.r;
    this.board.g=this.config.g;
    this.board.g2=this.config.g2;
    this.board.canPasteFen=this.config.canPasteFen;
    this.board.addVersion=this.config.addVersion;
    this.board.ignoreMultipleGames=this.config.ignoreMultipleGames;
    this.board.ie6FixCoordsOffsetSize=this.config.ie6FixCoordsOffsetSize;
    this.board.allIeFixCoordsOffsetSize=this.config.allIeFixCoordsOffsetSize;
    this.board.allowingFreeMovement=this.config.allowingFreeMovement;
    this.board.autoScrollMoves=this.config.autoScrollMoves;
    this.board.moveAnimationLength=this.config.moveAnimationLength;
    this.board.showBracketsOnVariation=this.config.showBracketsOnVariation;
    this.board.hideBracketsOnTopLevelVariation=this.config.hideBracketsOnTopLevelVariation;
    this.board.variationStartString=this.config.variationStartString;
    this.board.variationEndString=this.config.variationEndString;
    this.board.ignoreCommentRegex=this.config.ignoreCommentRegex;
    this.board.newlineForEachMainMove=this.config.newlineForEachMainMove;
    this.board.useDivClearForNewline=this.config.useDivClearForNewline;
    this.board.pieceSize=this.config.pieceSize;
    this.board.showToMoveIndicators=this.config.showToMoveIndicators;
    this.board.handleCommentClicks=this.config.handleCommentClicks;
    this.board.scrollOffsetCorrection=this.config.scrollOffsetCorrection;
    this.board.pollPGNMilliseconds=this.config.pollPGNMilliseconds;
    this.board.pollPGNMillisecondsPostResult=this.config.pollPGNMillisecondsPostResult;
    this.board.numberPollsAfterResult=this.config.numberPollsAfterResult;
    this.board.gotoEndOnRefresh=this.config.gotoEndOnRefresh;
    this.board.allowPreMoveSelection=this.config.allowPreMoveSelection;
    this.board.pieceTakenSize=this.config.pieceTakenSize;
    this.board.pieceSet=this.config.pieceSet;
    this.board.pauseBetweenMoves=this.config.pauseBetweenMoves;
    this.board.showCoordinates=this.config.showCoordinates;
    this.board.highlightFromTo=this.config.highlightFromTo;
    this.board.highlightValidSquares=this.config.highlightValidSquares;
    this.board.fideClock=this.config.fideClock;
    this.board.disableFlipper=this.config.disableFlipper;
    this.board.showDate=this.config.showDate;
    this.board.showEvent=this.config.showEvent;
    this.board.showGame=this.config.showGame;
    this.board.showResult=this.config.showResult;
    this.board.showRound=this.config.showRound;
    this.board.showSite=this.config.showSite;
    this.board.ignoreFlipping=this.config.ignoreFlipping;
    this.board.reverseFlip=this.config.reverseFlip;
    this.board.autoplayFirst=this.config.autoplayFirst;
    this.board.scrollVariations=this.config.scrollVariations;
    this.board.dontOutputNavButtons=this.config.dontOutputNavButtons;
    this.board.clickAndClick=this.config.clickAndClick;
    this.board.clickAndClickDisabled=this.config.clickAndClickDisabled;
    this.board.avoidMouseoverActive=this.config.avoidMouseoverActive;
    this.board.dontCheckLeavingPage=this.config.dontCheckLeavingPage;
    this.board.whiteMoveSoundName=this.config.whiteMoveSoundName;
    this.board.whiteTakeSoundName=this.config.whiteTakeSoundName;
    this.board.blackMoveSoundName=this.config.blackMoveSoundName;
    this.board.blackTakeSoundName=this.config.blackTakeSoundName;
    this.board.soundEnabled=this.config.soundEnabled;
    this.board.hidePGNErrors=this.config.hidePGNErrors;
    this.board.gamedb=this.config.gamedb;
    if(this.config.makeActive){
        activeBoard=this.board;
    }
    if(this.problem){
        this.problem.isEndgame=this.config.isEndgame;
    }
    if(!this.board.puzzle&&typeof loginManager!="undefined"){
        if(this.tactics){
            loginManager.setLoginCallback(this.tactics.loginCallback,this.tactics);
            loginManager.setLogoutCallback(this.tactics.logoutCallback,this.tactics);
        }
        if(this.problem){
            loginManager.setSessionCallback(this.problem.sessionCallback,this.problem);
        }
    }
    YAHOO.util.DragDropMgr.clickTimeThresh=50;
    YAHOO.util.DragDropMgr.clickPixelThresh=1;
    this.board.createBoardUI();
    if(!this.board.puzzle){
        if(this.problem){
            this.problem.createProblemUI();
        }
        if(this.tactics){
            this.tactics.initProblemCompleteOverlay();
        }
        if(this.problem){
            this.problem.initLoadingOverlay();
        }
        if(this.config.pgnMode){
            if(this.config.pgnFile){
                if(this.config.pollPGNMilliseconds){
                    this.pgn.foundResult=false;
                    this.pgn.foundResultPolls=0;
                    var _1c=this;
                    function timeToNextPollDisplay(){
                        var _1d=YAHOO.util.Dom.get(_1c.config.boardName+"-nextUpdate");
                        if(_1d){
                            if(_1c.pgn.finishedPolling||_1c.pgn.foundResult){
                                var _1e="00";
                                var _1f="00";
                                _1d.innerHTML="<span id=\"minutes\">"+_1e+"</span>:<span id=\"seconds\">"+_1f+"</span>";
                            }else{
                                var _20=new Date().getTime();
                                var _21=(_1c.pgn.lastPoll+_1c.pgn.pollTime-_20)/1000;
                                if(_21<0){
                                    _21=0;
                                }
                                var _22=_21;
                                var _23=parseInt(_22/60);
                                var _24=parseInt(_22%60);
                                if(_23<10){
                                    _1e="0"+_23;
                                }else{
                                    _1e=_23;
                                }
                                if(_24<10){
                                    _1f="0"+_24;
                                }else{
                                    _1f=_24;
                                }
                                _1d.innerHTML="<span id=\"minutes\">"+_1e+"</span>:<span id=\"seconds\">"+_1f+"</span>";
                                setTimeout(timeToNextPollDisplay,1000);
                            }
                        }
                    }
                    this.pgn.pollTime=this.config.pollPGNMilliseconds;
                    this.pgn.pollPGNFromURL(this.config.pgnFile,this.config.gotoEndOnRefresh,this.config.pollPGNMilliseconds);
                    setTimeout(timeToNextPollDisplay,1000);
                }else{
                    this.pgn.getPGNFromURL(this.config.pgnFile,this.config.gotoEndOnRefresh);
                }
            }else{
                if(this.config.pgnString){
                    this.pgn.setupFromPGN(this.config.pgnString);
                }else{
                    if(this.config.pgnDiv){
                        var _25=YAHOO.util.Dom.get(this.config.pgnDiv);
                        if(_25){
                            this.pgn.setupFromPGN(_25.innerHTML);
                        }
                    }
                }
            }
        }else{
            if(!this.board.dontCheckLeavingPage&&this.tactics){
                YAHOO.util.Event.addListener(window,"beforeunload",this.tactics.checkLeavingPage,this.tactics,true);
                YAHOO.util.Event.addListener(window,"unload",this.tactics.leavingPage,this.tactics,true);
                this.tactics.updateSessionDisplay(0,0);
                if(typeof showingStart!="undefined"&&showingStart){
                    var _1c=this;
                    var _26="";
                    if(loggedIn){
                        if(this.config.isEndgame){
                            _26=_js("Endgame Problem Set")+": <span id=\"startProblemSetStr\">"+_js(startEndgameSetName)+"</span>";
                        }else{
                            _26=_js("Tactics Problem Set")+": <span id=\"startProblemSetStr\">"+_js(startTacticsSetName)+"</span>";
                        }
                    }
                    this.board.preloadPieces();
                    var _27=new YAHOO.widget.SimpleDialog("starttacticdialog1",{width:"300px",fixedcenter:true,modal:false,visible:true,draggable:true,close:false,text:"<div style=\"color:black\">"+_26+"</div><br/>"+"<div style=\"color:black\">"+_js("Click start to begin solving problems")+"</div>",icon:YAHOO.widget.SimpleDialog.ICON_INFO,constraintoviewport:true,buttons:[{text:_js("Start"),handler:function(){
                        if(_1c.board.imagesLoaded){
                            this.hide();
                            _1c.problem.getProblem();
                        }else{
                            var _28=_js("Still trying to load piece images.\n If you keep receiving this message you may need to reload the page.\n If you continue to get this message, you can disable it by going into your preferences and turning 'show problem start dialog' (available under the other tab) off.");
                            alert(_28);
                        }
                    },isDefault:true}]});
                    var _29=YAHOO.util.Dom.get("ctb-"+this.board.boardName);
                    _27.render(document.body);
                }else{
                    this.problem.getProblem();
                }
            }else{
                if(this.problem){
                    if(this.problemNumber!=""){
                        YAHOO.util.Dom.setStyle("boardandmoves","display","block");
                        this.problem.getProblem(this.problemNumber,this.attId);
                    }
                }
            }
        }
    }
    this.board.setupEventHandlers();
    if(this.problem){
        this.problem.setupEventHandlers();
    }
    if(this.tactics){
        this.tactics.setupEventHandlers();
    }
    if(isIpad||isIphone){
    }
    if(this.board.scrollToBoardTop){
        var xy=YAHOO.util.Dom.getXY(this.board.boardName+"-boardBorder");
        window.scrollTo(xy[0],xy[1]);
    }
    if(this.config.flipListener){
        this.board.addFlipListener(this.config.flipListener);
    }
};
function clearClone(o){
    if(o==null){
        return;
    }
    for(prop in o){
        if(typeof (o[prop])=="object"&&o[prop]!=null&&o[prop].alreadyCloned){
            o[prop].alreadyCloned=false;
            clearClone(o[prop]);
        }
    }
}
function cloneWork(o){
    if(o==null){
        return null;
    }
    var _2d=new Object();
    for(prop in o){
        if(typeof (o[prop])=="object"){
            _2d[prop]=o[prop];
        }else{
            _2d[prop]=o[prop];
        }
    }
    return _2d;
}
function clone(o){
    return cloneWork(o);
}
get_image_str=function(_2f,_30,_31,_32,_33){
    var _34=".vers"+SITE_VERSION;
    if(!_33){
        _34="";
    }
    if(check_bad_msie()){
        return _30+"/images/"+_31+"/"+_2f+_32+_34+".png";
    }else{
        return _30+"/images/"+_31+"/"+_2f+_32+_34+".png";
    }
};
check_bad_msie=function(){
    var _35=(window.ActiveXObject&&(typeof document.body.style.maxHeight=="undefined"));
    return _35;
};
fix_ie_png=function(img){
    if(!check_bad_msie()){
        return;
    }
    var _37=(img.id)?"id='"+img.id+"' ":"";
    var _38=(img.className)?"class='"+img.className+"' ":"";
    var _39=(img.title)?"title='"+img.title+"' ":"title='"+img.alt+"' ";
    var _3a="display:inline-block;"+img.style.cssText;
    if(img.align=="left"){
        _3a="float:left;"+_3a;
    }
    if(img.align=="right"){
        _3a="float:right;"+_3a;
    }
    if(img.parentElement.href){
        _3a="cursor:hand;"+_3a;
    }
    var _3b="<span "+_37+_38+_39+" style=\""+"width:"+img.width+"px; height:"+img.height+"px;"+_3a+";"+"filter:progid:DXImageTransform.Microsoft.AlphaImageLoader"+"(src='"+img.src+"', sizingMethod='image');\"></span>";
    img.outerHTML=_3b;
};
Move=function(_3c,_3d,_3e,_3f,_40,_41,_42){
    this.fromColumn=_3c;
    this.fromRow=_3d;
    this.toColumn=_3e;
    this.toRow=_3f;
    this.take=_40;
    this.promotion=_41;
    this.moveString=_42;
    this.prev=null;
    this.next=null;
    this.numVars=0;
    this.prevMoveEnpassant=false;
    this.ravLevel=0;
    this.atEnd=false;
    this.obj_id=move_obj_id_counter++;
    this.beforeComment="";
    this.afterComment="";
};
Move.prototype.freeMove=function(){
    if(this.taken){
        this.taken=null;
    }
    if(this.vars&&this.vars.length>0){
        var i=0;
        for(var i=0;i<this.vars.length;i++){
            this.vars[i].freeMove();
        }
    }
};
Move.prototype.clone=function(_44){
    var _45=this.take;
    if(_44&&_45){
        _45=_45.makeLightWeight();
    }
    var _46=new Move(this.fromColumn,this.fromRow,this.toColumn,this.toRow,_45,this.promotion,this.moveString);
    _46.moveNum=this.moveNum;
    _46.atEnd=this.atEnd;
    _46.beforeComment=this.beforeComment;
    _46.afterComment=this.afterComment;
    _46.prevMoveEnpassant=this.prevMoveEnpassant;
    _46.index=this.index;
    if(this.vars){
        _46.vars=[];
        var cnt=0;
        for(var i=0;i<this.vars.length;i++){
            _46.vars[i]=this.vars[i].clone(_44);
            cnt++;
        }
        _46.numVars=cnt;
    }
    return _46;
};
Move.columnToChar=function(col){
    var a=String.fromCharCode("a".charCodeAt(0)+col);
    return a;
};
Move.prototype.output=function(){
    return Move.columnToChar(this.fromColumn)+""+(this.fromRow+1)+":"+Move.columnToChar(this.toColumn)+""+(this.toRow+1)+" prom:"+this.promotion+" objid:"+this.obj_id+" dummy:"+this.dummy+" endNode:"+this.endNode+" index:"+this.index+" moveNum:"+this.moveNum+" atEnd:"+this.atEnd+" beforeCom:"+this.beforeComment+" afterCom:"+this.afterComment;
};
Move.prototype.equals=function(m){
    return (m&&(this.fromColumn==m.fromColumn&&this.fromRow==m.fromRow&&this.promotion==m.promotion&&this.toColumn==m.toColumn&&this.toRow==m.toRow));
};
Move.moveArraysEqual=function(a1,a2){
    if(a1==a2){
        return true;
    }
    if(a1==null||a2==null){
        return false;
    }
    if(a1.length!=a2.length){
        return false;
    }
    for(var i=0;i<a1.length;i++){
        if(!a1[i].equals(a2[i])){
            return false;
        }
        if(!Move.moveArraysEqual(a1[i].vars,a2[i].vars)){
            return false;
        }
    }
    return true;
};
Move.findMoveInNewArray=function(a1,a2,_51){
    if(a1==a2){
        return _51;
    }
    if(a1==null||a2==null){
        return null;
    }
    if(a1.length!=a2.length){
        return null;
    }
    for(var i=0;i<a1.length;i++){
        if(!a1[i].equals(a2[i])){
            return null;
        }
        if(!Move.moveArraysEqual(a1[i].vars,a2[i].vars)){
            return null;
        }
        if(a1[i]==_51){
            return a2[i];
        }
    }
    return null;
};
Move.prototype.toMoveString=function(){
    var _53="";
    if(this.promotion){
        _53=this.promotion;
    }
    return Move.columnToChar(this.fromColumn)+""+(this.fromRow+1)+Move.columnToChar(this.toColumn)+""+(this.toRow+1)+_53;
};
function getTagValue(_54,_55){
    var _56=_54.getElementsByTagName(_55);
    if(_56==null){
        YAHOO.log("got null node for tag:"+_55);
        return null;
    }
    if(_56.length==0){
        YAHOO.log("got empty array node for tag:"+_55);
        return null;
    }
    if(_56[0].firstChild==null){
        YAHOO.log("firstChild is null for tag:"+_55);
        return null;
    }
    if(_56[0].firstChild.nodeValue==null){
        YAHOO.log("firstChild.nodeValue is null for tag:"+_55);
        return null;
    }
    if(typeof (_56[0].textContent)!="undefined"){
        return _56[0].textContent;
    }
    return _56[0].firstChild.nodeValue;
}
var ua=navigator.userAgent.toLowerCase();
var isOpera=(ua.indexOf("opera")>-1);
var isIphone=(navigator.userAgent.match(/iPhone/i))||(navigator.userAgent.match(/iPod/i));
var isIpad=(navigator.userAgent.match(/iPad/i));
var isSafari=(ua.indexOf("safari")>-1);
var isGecko=(!isOpera&&!isSafari&&ua.indexOf("gecko")>-1);
var isIE=(!isOpera&&ua.indexOf("msie")>-1);
function unescapeHtml(s){
    var n=document.createElement("div");
    n.innerHTML=s;
    if(n.innerText){
        return n.innerText;
    }else{
        return n.textContent;
    }
}
ChessPiece=function(div,_5a,_5b,_5c){
    var id=div.id;
    this.board=_5c;
    this.icon=get_image_str(ChessPiece.pieceIconNames[_5a][_5b],this.board.boardImagePath,this.board.pieceSet,this.board.pieceSize,this.board.addVersion);
    this.colour=_5a;
    this.piece=_5b;
    this.id=id;
    this.div=div;
    var _5e=_5c.getPieceDragDiv();
    var _5f=false;
    var _60="";
    if(_5e==null){
        _5e=document.createElement("div");
        _5e.id="pieceDragDiv";
        _5f=true;
        YAHOO.util.Dom.setStyle(_5e,"visibility","hidden");
        YAHOO.util.Dom.setStyle(_5e,"border","0px");
        YAHOO.util.Dom.setStyle(_5e,"position","absolute");
    }
    this.pieceDragEl=_5e;
    this.pieceDragElId="pieceDragDiv";
    if(_5f){
        var _61=this.board.getDocBody();
        if(_61){
            _61.appendChild(_5e);
        }
    }
    if(YAHOO.util.Event.isIE||isOpera){
        var _62=this.div;
        _62.innerHTML="<img src=\""+this.icon+"\"/>";
        var img=_62.firstChild;
        fix_ie_png(img);
    }else{
        YAHOO.util.Dom.setStyle([this.div],"backgroundImage","url("+this.icon+")");
    }
    YAHOO.util.Dom.setStyle([this.div],"height",this.board.pieceSize+"px");
    YAHOO.util.Dom.setStyle([this.div],"width",this.board.pieceSize+"px");
    YAHOO.util.Dom.setStyle([this.div],"position","relative");
    if(!this.board.clickAndClick){
        this.init(id,"ct-"+this.board.boardName+"-boardandpieces",{dragElId:this.pieceDragElId,resizeFrame:true,centerFrame:false,isTarget:false});
        this.initFrame();
    }
    if(isIphone||isIpad){
        if(this.board.clickAndClickDisabled){
            var _64=this.div;
            var _65=this;
            this.div.addEventListener("DOMNodeInserted",function(ev){
                if(!_65.touchAttached){
                    initIphone(_64);
                }
                _65.touchAttached=true;
            },false);
        }
    }
};
ChessPiece.prototype=new YAHOO.util.DDProxy();
ChessPiece.PAWN=0;
ChessPiece.BISHOP=1;
ChessPiece.KNIGHT=2;
ChessPiece.ROOK=3;
ChessPiece.KING=4;
ChessPiece.QUEEN=5;
ChessPiece.WHITE=0;
ChessPiece.BLACK=1;
ChessPiece.init=function(){
    ChessPiece.pieceIconNames=new Array(2);
    ChessPiece.pieceIconNames[0]=new Array(6);
    ChessPiece.pieceIconNames[1]=new Array(6);
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.PAWN]="whitepawn";
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.BISHOP]="whitebishop";
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.KNIGHT]="whiteknight";
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.ROOK]="whiterook";
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.KING]="whiteking";
    ChessPiece.pieceIconNames[ChessPiece.WHITE][ChessPiece.QUEEN]="whitequeen";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.PAWN]="blackpawn";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.BISHOP]="blackbishop";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.KNIGHT]="blackknight";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.ROOK]="blackrook";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.KING]="blackking";
    ChessPiece.pieceIconNames[ChessPiece.BLACK][ChessPiece.QUEEN]="blackqueen";
};
ChessPiece.materialValue=function(_67){
    switch(_67){
        case ChessPiece.PAWN:
            return 1;
            break;
        case ChessPiece.BISHOP:
            return 3;
            break;
        case ChessPiece.KNIGHT:
            return 3;
            break;
        case ChessPiece.ROOK:
            return 5;
            break;
        case ChessPiece.KING:
            return 0;
            break;
        case ChessPiece.QUEEN:
            return 9;
            break;
    }
    return 0;
};
ChessPiece.prototype.free=function(){
    if(!this.board.clickAndClick){
        this.unreg();
    }
};
ChessPiece.prototype.clickValidator=function(e){
    if(this.board.dragDisabled){
        return false;
    }
    if(!this.board.allowPreMoveSelection&&(this.board.toMove!=this.colour)){
        return false;
    }
    if(this.board.restrictedColourMovement!=-1&&this.colour!=this.board.restrictedColourMovement){
        return;
    }
    if(false&&this.board.clickAndClick){
        return false;
    }
    var _69=YAHOO.util.Event.getTarget(e);
    var _6a=(this.isValidHandleChild(_69)&&(this.id==this.handleElId||this.DDM.handleWasClicked(_69,this.id)));
    this.board.selectDestSquare(e);
    if(true||!_6a){
        YAHOO.util.Event.preventDefault(e);
    }
    return _6a;
};
ChessPiece.prototype.onDragOut=function(e,id){
    this.insideBoard=false;
};
ChessPiece.prototype.onDragEnter=function(e,id){
    this.insideBoard=true;
};
ChessPiece.prototype.endDrag=function(e){
    if(this.board.lastOverSquare){
        YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-valid-square");
        YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-invalid-square");
    }
    this.board.lastOverSquare=null;
    if(!this.insideBoard){
        this.board.board_xy=null;
        this.setPosition(this.column,this.row,false,null,this.board.moveAnimationLength);
    }
    if(!this.hideAfterDragEnd){
        YAHOO.util.Dom.setStyle(this.getEl(),"visibility","visible");
    }else{
        this.hideAfterDragEnd=false;
    }
};
ChessPiece.prototype.startDrag=function(x,y){
    this.insideBoard=true;
    var _72=null;
    if(this.board.currentMove){
        if(this.board.currentMove.prev){
            _72=this.board.currentMove.prev;
        }else{
            _72=this.board.prev_move;
        }
    }else{
        _72=this.board.prev_move;
    }
    if(this.board.highlightValidSquares){
        this.candidates=null;
        this.candidates=new Array(8);
        for(var i=0;i<8;i++){
            this.candidates[i]=new Array(8);
            for(var j=0;j<8;j++){
                this.candidates[i][j]=false;
            }
        }
    }
    this.pieceDragEl.innerHTML="<img src=\""+this.icon+"\"/>";
    var img=this.pieceDragEl.firstChild;
    fix_ie_png(img);
    YAHOO.util.Dom.setStyle(this.pieceDragEl,"zIndex",1000);
    YAHOO.util.Dom.setStyle(this.pieceDragEl,"height",this.board.pieceSize+"px");
    YAHOO.util.Dom.setStyle(this.pieceDragEl,"width",this.board.pieceSize+"px");
    YAHOO.util.Dom.setStyle(this.getEl(),"visibility","hidden");
    if(this.board.highlightValidSquares){
        for(var i=0;i<8;i++){
            for(var j=0;j<8;j++){
                var _76=7-i;
                var _77=j;
                if(this.board.isFlipped){
                    _76=7-_76;
                    _77=7-_77;
                }
                if((_76==this.row&&_77==this.column)||this.board.canMove(this.makeLightWeight(),_77,_76,_72,true)){
                    this.candidates[j][i]=true;
                }
            }
        }
    }
};
ChessPiece.prototype.onDragOver=function(e,id){
    var x=YAHOO.util.Event.getPageX(e);
    var y=YAHOO.util.Event.getPageY(e);
    var _7c=YAHOO.util.Dom.getX("ctb-"+this.board.boardName);
    var _7d=YAHOO.util.Dom.getY("ctb-"+this.board.boardName);
    var c=parseInt((x-_7c)/this.board.pieceSize);
    var r=parseInt((y-_7d)/this.board.pieceSize);
    var _80=this.board.boardName+"-s"+c+""+(7-r);
    var _81=YAHOO.util.Dom.get(_80);
    if(this.board.highlightValidSquares){
        if(this.board.lastOverSquare){
            if(this.board.lastOverSquare!=_81){
                YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-valid-square");
                YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-invalid-square");
                this.board.lastOverSquare=null;
                if(this.candidates&&c<8&&c>=0&&r<8&&r>=0&&this.candidates[c][r]){
                    YAHOO.util.Dom.addClass(_81,"ct-over-valid-square");
                }else{
                    YAHOO.util.Dom.addClass(_81,"ct-over-invalid-square");
                }
            }
        }
        this.board.lastOverSquare=_81;
    }
};
ChessPiece.prototype.onDragDrop=function(e,id){
    if(this.board.blockFowardBack||this.board.deferredBlockForwardBack){
        return false;
    }
    if(this.board.allowPreMoveSelection&&this.board.toMove!=this.colour){
        return false;
    }
    if(this.board.lastOverSquare){
        YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-valid-square");
        YAHOO.util.Dom.removeClass(this.board.lastOverSquare,"ct-over-invalid-square");
    }
    var x=YAHOO.util.Event.getPageX(e);
    var y=YAHOO.util.Event.getPageY(e);
    var _86=YAHOO.util.Dom.getX("ctb-"+this.board.boardName);
    var _87=YAHOO.util.Dom.getY("ctb-"+this.board.boardName);
    var c=parseInt((x-_86)/this.board.pieceSize);
    var r=parseInt((y-_87)/this.board.pieceSize);
    if(this.board.isFlipped){
        r=7-r;
        c=7-c;
    }
    if(this.board.allowPreMoveSelection&&(this.board.boardPieces[this.column][this.row]!=this)){
        this.setVisible(false);
        this.hideAfterDragEnd=true;
        return false;
    }
    var _8a=false;
    if(!this.board.currentMove||this.board.currentMove.atEnd){
        _8a=true;
    }
    this.board.updatePiece(this,c,7-r,false,false,true);
    if(!_8a&&this.board.currentMove&&!this.board.allowingFreeMovement&&this.board.currentMove.atEnd){
        this.board.toggleToMove();
        this.board.updateToPlay();
    }
};
ChessPiece.prototype.makeLightWeight=function(){
    var cp=this.board.createPiece(this.colour,this.piece,true);
    cp.column=this.column;
    cp.row=this.row;
    cp.enPassant=this.enPassant;
    cp.castled=this.castled;
    return cp;
};
ChessPiece.prototype.removeFromParent=function(){
    var _8c=this.div;
    if(_8c.parentNode){
        _8c.parentNode.removeChild(_8c);
    }
};
ChessPiece.prototype.setVisible=function(_8d){
    var _8e;
    var _8f;
    if(_8d){
        _8f="block";
        _8e="visible";
    }else{
        _8f="none";
        _8e="hidden";
    }
    YAHOO.util.Dom.setStyle(this.id,"visibility",_8e);
};
ChessPiece.prototype.moveResponse=function(o){
};
ChessPiece.prototype.getIcon=function(){
    return this.icon;
};
ChessPiece.prototype.makeHeavyWeight=function(){
    return this.copyPiece();
};
ChessPiece.prototype.copyPiece=function(){
    var cp=new ChessPiece(this.div,this.colour,this.piece,this.board);
    cp.column=this.column;
    cp.row=this.row;
    cp.enPassant=this.enPassant;
    cp.castled=this.castled;
    return cp;
};
ChessPiece.prototype.changePieceKeepImage=function(_92){
    var _93=(_92+"").toLowerCase().charAt(0);
    switch(_93){
        case "k":
            this.piece=ChessPiece.KING;
            break;
        case "q":
            this.piece=ChessPiece.QUEEN;
            break;
        case "r":
            this.piece=ChessPiece.ROOK;
            break;
        case "b":
            this.piece=ChessPiece.BISHOP;
            break;
        case "n":
            this.piece=ChessPiece.KNIGHT;
            break;
        case "p":
            this.piece=ChessPiece.PAWN;
            break;
        default:
    }
};
ChessPiece.prototype.changePiece=function(_94){
    this.changePieceKeepImage(_94);
    this.icon=get_image_str(ChessPiece.pieceIconNames[this.colour][this.piece],this.board.boardImagePath,this.board.pieceSet,this.board.pieceSize,this.board.addVersion);
    if(YAHOO.util.Event.isIE||isOpera){
        var _95=this.div;
        _95.innerHTML="<img src=\""+this.icon+"\"/>";
        var img=_95.firstChild;
        if(!isOpera){
            fix_ie_png(img);
        }
    }else{
        YAHOO.util.Dom.setStyle(this.div,"backgroundImage","url("+this.icon+")");
        YAHOO.util.Dom.setStyle(this.div,"background-repeat","no-repeat");
    }
};
ChessPiece.prototype.getNewXYPosition=function(_97,row){
    var _99=this.board.getBoardDiv();
    var _9a=this.board.getXY();
    var _9b=_9a[0];
    var _9c=_9a[1];
    var _9d=[0,0];
    if(this.board.isFlipped){
        _9d[0]=_9b+((7-_97)*this.board.pieceSize);
        _9d[1]=_9c+((row)*this.board.pieceSize);
    }else{
        _9d[0]=_9b+((_97)*this.board.pieceSize);
        _9d[1]=_9c+((7-row)*this.board.pieceSize);
    }
    return _9d;
};
ChessPiece.prototype.setPosition=function(_9e,row,_a0,_a1,_a2,_a3,_a4){
    this.column=_9e;
    this.row=row;
    if(this.board.pieceMoveDisabled){
        return;
    }
    var _a5=this.div;
    var _a6=null;
    if(this.board.isFlipped){
        _a6=this.board.boardName+"-s"+(7-this.column)+""+(7-this.row);
    }else{
        _a6=this.board.boardName+"-s"+(this.column)+""+(this.row);
    }
    var _a7=this.board.getBoardDivFromId(_a6);
    var _a8=null;
    if(!_a3){
        _a8=(this.colour==ChessPiece.WHITE)?this.board.whiteMoveSoundName:this.board.blackMoveSoundName;
    }else{
        _a8=(this.colour==ChessPiece.WHITE)?this.board.whiteTakeSoundName:this.board.blackTakeSoundName;
    }
    if(!_a0){
        if(!this.board.settingUpPosition){
            var _a9=this.getNewXYPosition(_9e,row);
            YAHOO.util.Dom.setXY(_a5,_a9,false);
        }else{
            if(_a5.parentNode){
                _a5.parentNode.removeChild(_a5);
            }
            _a7.appendChild(_a5);
        }
        this.setVisible(true);
        if(_a4&&this.board.soundEnabled){
            boardSounds.playSound(_a8);
        }
        if(_a1){
            _a1();
        }
    }else{
        var _a9=this.getNewXYPosition(_9e,row);
        if(this.board.oldAnim&&this.board.oldAnim.isAnimated()){
            this.board.oldAnim.stop();
            YAHOO.util.Dom.setXY(this.board.oldAnimPieceDiv,this.board.old_new_xy,false);
        }
        var _aa=new YAHOO.util.Motion(_a5,{points:{to:_a9}});
        this.board.oldAnim=_aa;
        this.board.oldAnimPieceDiv=_a5;
        this.board.old_new_xy=_a9;
        _aa.duration=_a2;
        var _ab=this;
        _aa.onComplete.subscribe(function(){
            if(_ab.board.soundEnabled){
                boardSounds.playSound(_a8);
            }
        });
        if(_a1){
            _aa.onComplete.subscribe(_a1);
        }
        _aa.animate();
    }
};
ChessPiece.prototype.getFenLetter=function(){
    var _ac=ChessPiece.pieceTypeToChar(this.piece)+"";
    if(this.colour!=ChessPiece.WHITE){
        _ac=_ac.toLowerCase();
    }
    return _ac;
};
ChessPiece.pieceTypeToChar=function(_ad){
    switch(_ad){
        case ChessPiece.KING:
            return "K";
        case ChessPiece.QUEEN:
            return "Q";
        case ChessPiece.ROOK:
            return "R";
        case ChessPiece.BISHOP:
            return "B";
        case ChessPiece.KNIGHT:
            return "N";
        case ChessPiece.PAWN:
            return "P";
    }
    return "?";
};
LightweightChessPiece=function(div,_af,_b0,_b1){
    this.board=_b1;
    this.colour=_af;
    this.piece=_b0;
    this.div=div;
};
LightweightChessPiece.prototype.getFenLetter=ChessPiece.prototype.getFenLetter;
LightweightChessPiece.prototype.makeLightWeight=function(){
    return this.copyPiece();
};
LightweightChessPiece.prototype.makeHeavyWeight=function(){
    var cp=this.board.createPiece(this.colour,this.piece,false);
    cp.column=this.column;
    cp.row=this.row;
    cp.enPassant=this.enPassant;
    cp.castled=this.castled;
    return cp;
};
LightweightChessPiece.prototype.setVisible=function(_b3){
};
LightweightChessPiece.prototype.free=function(){
};
LightweightChessPiece.prototype.setPosition=function(_b4,row,_b6,_b7,_b8){
    this.column=_b4;
    this.row=row;
};
LightweightChessPiece.prototype.copyPiece=function(){
    var cp=new LightweightChessPiece(this.id,this.colour,this.piece,this.board);
    cp.column=this.column;
    cp.row=this.row;
    return cp;
};
LightweightChessPiece.prototype.changePiece=function(_ba){
    this.changePieceKeepImage(_ba);
};
LightweightChessPiece.prototype.changePieceKeepImage=function(_bb){
    var _bc=(_bb+"").toLowerCase().charAt(0);
    switch(_bc){
        case "k":
            this.piece=ChessPiece.KING;
            break;
        case "q":
            this.piece=ChessPiece.QUEEN;
            break;
        case "r":
            this.piece=ChessPiece.ROOK;
            break;
        case "b":
            this.piece=ChessPiece.BISHOP;
            break;
        case "n":
            this.piece=ChessPiece.KNIGHT;
            break;
        case "p":
            this.piece=ChessPiece.PAWN;
            break;
        default:
    }
};
MovesDisplay=function(_bd,_be){
    this.board=_bd;
    this.displayType=_be;
};
MovesDisplay.DEFAULT_DISPLAY_TYPE=0;
MovesDisplay.MAIN_ON_OWN_LINE=1;
Board=function(_bf){
    this.boardName=_bf;
    if(_bf){
        this.initTarget("ctb-"+_bf,"ct-"+this.boardName+"-boardandpieces");
        this.boardPieces=Board.createBoardArray();
    }
    this.imagesLoaded=false;
    this.disableNavigation=false;
    this.currentMove=null;
    this.outputWithoutDisplay=false;
    this.moveIndex=-1;
    this.dontUpdatePositionReachedTable=false;
    this.restrictedColourMovement=-1;
    this.settingUpPosition=false;
    this.pendingLevelZeroCommentaryClose=false;
    this.isUserFlipped=false;
    this.registeredFlipListeners=[];
    this.registeredSpaceListeners=[];
    this.registeredForwardAtEndListeners=[];
    this.registeredPasteFenClickedListeners=[];
    this.registeredGotoMoveIndexListeners=[];
    this.registeredBackMovePreCurrentListeners=[];
    this.registeredForwardMovePostUpdateListeners=[];
    this.registeredUpdateListeners=[];
    this.registeredUpdatePieceFinishedListeners=[];
    this.registeredUpdateEndOfMovesListeners=[];
    this.registeredUpdateHaveAltListeners=[];
    this.registeredUpdateWrongMoveListeners=[];
    this.registeredUpdateAllowMoveListeners=[];
    this.registeredMakeMoveListeners=[];
    this.moveNumber=1;
    this.halfMoveNumber=0;
};
Board.prototype=new YAHOO.util.DDTarget();
Board.invertToMove=function(_c0){
    if(_c0==ChessPiece.WHITE){
        return ChessPiece.BLACK;
    }else{
        return ChessPiece.WHITE;
    }
};
Board.boardStyleToClassName=function(_c1){
    var _c2="";
    switch(_c1){
        case 0:
            _c2="-lightgrey";
            break;
        case 1:
            _c2="-grey";
            break;
        case 2:
            _c2="-brown";
            break;
        case 3:
            _c2="-green";
            break;
        case 4:
            _c2="-woodlight";
            break;
        case 5:
            _c2="-wooddark";
            break;
        case 6:
            _c2="-metal";
            break;
        case 7:
            _c2="-marblebrown";
            break;
        case 8:
            _c2="-stucco";
            break;
        case 9:
            _c2="-goldsilver";
            break;
        case 10:
            _c2="-sandsnow";
            break;
        case 11:
            _c2="-crackedstone";
            break;
        case 12:
            _c2="-granite";
            break;
        case 13:
            _c2="-marblegreen";
            break;
        case 14:
            _c2="-greenwhite";
            break;
        default:
    }
    return _c2;
};
Board.createBoardArray=function(){
    var _c3=boardPool.getObject();
    if(_c3==null){
        _c3=new Array(8);
        for(var i=0;i<8;i++){
            _c3[i]=new Array(8);
        }
    }
    return _c3;
};
Board.prototype.preloadPieces=function(){
    var _c5=[];
    for(var i=0;i<ChessPiece.QUEEN;i++){
        for(var j=0;j<2;j++){
            var _c8=get_image_str(ChessPiece.pieceIconNames[j][i],this.boardImagePath,this.pieceSet,this.pieceSize,true);
            _c5.push(_c8);
        }
    }
    var _c9=this;
    function checkImages(){
        var _ca=true;
        for(var i=0;i<_c5.length;i++){
            var img=document.createElement("img");
            img.src=_c5[i];
            if(!img.complete||(typeof img.naturalWidth!="undefined"&&img.naturalWidth==0)){
                _ca=false;
            }
        }
        if(!_ca){
            setTimeout(checkImages,1000);
        }else{
            _c9.imagesLoaded=true;
        }
    }
    checkImages();
};
Board.prototype.selectDestSquare=function(e){
    if(this.clickAndClickDisabled){
        return true;
    }
    var _ce=(new Date()).getTime();
    var _cf=false;
    if(_ce-this.lastDestClick<100){
        _cf=true;
    }
    this.lastDestClick=_ce;
    var x=YAHOO.util.Event.getPageX(e);
    var y=YAHOO.util.Event.getPageY(e);
    var _d2=YAHOO.util.Dom.getX("ctb-"+this.boardName);
    var _d3=YAHOO.util.Dom.getY("ctb-"+this.boardName);
    var c=parseInt((x-_d2)/this.pieceSize);
    var r=parseInt((y-_d3)/this.pieceSize);
    var _d6=this.boardName+"-s"+c+""+(7-r);
    var _d7=YAHOO.util.Dom.get(_d6);
    if(_d7==this.oldSelectedSquare){
        if(!_cf){
            YAHOO.util.Dom.removeClass(_d7,"ct-source-square");
            this.oldSelectedSquare=null;
            this.oldSelectedPiece=null;
            if(this.oldDestSquare){
                YAHOO.util.Dom.removeClass(this.oldDestSquare,"ct-dest-square");
                this.oldDestSquare=null;
            }
        }
        return true;
    }
    if(this.isFlipped){
        c=7-c;
        r=7-r;
    }
    r=7-r;
    var _d8=this.boardPieces[c][r];
    if(_d8&&(_d8.colour==this.toMove||this.allowPreMoveSelection)&&(this.restrictedColourMovement==-1||(_d8.colour==this.restrictedColourMovement))){
        if(this.oldSelectedSquare){
            YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
        }
        if(this.oldDestSquare){
            YAHOO.util.Dom.removeClass(this.oldDestSquare,"ct-dest-square");
            this.oldDestSquare=null;
        }
        YAHOO.util.Dom.addClass(_d7,"ct-source-square");
        this.oldSelectedSquare=_d7;
        this.oldSelectedPiece=_d8;
    }else{
        if(this.oldSelectedSquare){
            if(this.oldSelectedPiece&&this.oldSelectedPiece.colour!=this.toMove){
                return false;
            }
            var _d9=null;
            if(this.currentMove){
                if(this.currentMove.prev){
                    _d9=this.currentMove.prev;
                }else{
                    _d9=this.prev_move;
                }
            }else{
                _d9=this.prev_move;
            }
            if(this.canMove(this.oldSelectedPiece.makeLightWeight(),c,r,_d9,true)){
                this.lastDestSquare=_d7;
                this.lastDestRow=r;
                this.lastDestColumn=c;
                YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
                var _da=false;
                if(!this.currentMove||this.currentMove.atEnd){
                    _da=true;
                }
                this.updatePiece(this.oldSelectedPiece,c,r,false,false,true);
                this.oldSelectedPiece=null;
                this.oldSelectedSquare=null;
                if(!_da&&this.currentMove&&!this.allowingFreeMovement&&this.currentMove.atEnd){
                    this.toggleToMove();
                    this.updateToPlay();
                }
            }else{
            }
        }else{
            return true;
        }
    }
};
Board.prototype.selectSourcePiece=function(_db){
    if(this.lastSourceSquare){
        YAHOO.util.Dom.removeClass(_dc,"ct-source-square");
    }
    var r=_db.row;
    var c=_db.column;
    if(this.isFlipped){
        r=7-r;
        c=7-c;
    }
    var _df=this.boardName+"-s"+c+""+r;
    var _dc=YAHOO.util.Dom.get(_df);
    YAHOO.util.Dom.addClass(_dc,"ct-source-square");
    this.lastSourceSquare=_dc;
    this.lastSourcePiece=_db;
    this.lastSourceRow=_db.row;
    this.lastSourceColumn=_db.column;
};
Board.prototype.toggleToMove=function(){
    if(this.toMove==ChessPiece.WHITE){
        this.toMove=ChessPiece.BLACK;
    }else{
        this.toMove=ChessPiece.WHITE;
    }
};
Board.prototype.setupPieceDivs=function(){
    var _e0=this.getBoardDiv();
    if(this.pieces){
        for(var i=0;i<32;i++){
            if(this.pieces[i]){
                this.pieces[i].setVisible(false);
                this.pieces[i].free();
                this.pieces[i]=null;
            }
        }
    }
    if(this.availPieceDivs){
        for(var i=0;i<32;i++){
            if(this.availPieceDivs[i]){
                if(this.availPieceDivs[i].parentNode){
                    this.availPieceDivs[i].parentNode.removeChild(this.availPieceDivs[i]);
                }
            }
        }
    }
    this.availids=null;
    this.availIds=new Array(32);
    this.availPieceDivs=null;
    this.availPieceDivs=new Array(32);
    this.pieces=null;
    this.pieces=new Array(32);
    this.uptoId=0;
    this.uptoPiece=0;
};
Board.prototype.getXY=function(){
    if(true||!this.board_xy){
        this.board_xy=YAHOO.util.Dom.getXY("ctb-"+this.boardName);
    }
    return this.board_xy;
};
Board.prototype.updateFromTo=function(_e2,_e3,_e4,_e5,_e6,_e7){
    YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
    YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
    if(_e4==null){
        return;
    }
    this.lastFromSquare=_e2;
    this.lastToSquare=_e3;
    this.lastFromRow=_e4;
    this.lastFromColumn=_e5;
    this.lastToRow=_e6;
    this.lastToColumn=_e7;
    if(this.highlightFromTo){
        YAHOO.util.Dom.addClass(_e2,"ct-from-square");
        YAHOO.util.Dom.addClass(_e3,"ct-to-square");
    }
};
Board.prototype.makeMove=function(_e8,_e9,_ea,_eb,_ec,_ed,_ee,_ef,_f0){
    var _f1;
    var _f2;
    if(!this.isFlipped){
        _f1=YAHOO.util.Dom.get(this.boardName+"-s"+_e8.fromColumn+""+_e8.fromRow);
        _f2=YAHOO.util.Dom.get(this.boardName+"-s"+_e8.toColumn+""+_e8.toRow);
    }else{
        _f1=YAHOO.util.Dom.get(this.boardName+"-s"+(7-_e8.fromColumn)+""+(7-_e8.fromRow));
        _f2=YAHOO.util.Dom.get(this.boardName+"-s"+(7-_e8.toColumn)+""+(7-_e8.toRow));
    }
    if(this.oldSelectedSquare){
        if(!this.allowPreMoveSelection||(this.oldSelectedPiece&&_e9&&(this.oldSelectedPiece.colour==_e9.colour))){
            YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
            this.oldSelectedSquare=null;
            this.oldSelectedPiece=null;
        }
    }
    if(_ed){
        this.updateFromTo(_f1,_f2,_e8.fromRow,_e8.fromColumn,_e8.toRow,_e8.toColumn);
    }
    var _f3=this.boardPieces[_e8.toColumn][_e8.toRow];
    if(_f3!=null){
        _f3.enPassant=false;
        _f3.castled=false;
    }
    if(_e9.piece==ChessPiece.PAWN&&_e8.toColumn!=_e8.fromColumn&&this.boardPieces[_e8.toColumn][_e8.toRow]==null){
        _f3=this.boardPieces[_e8.toColumn][_e8.fromRow];
        this.boardPieces[_e8.toColumn][_e8.fromRow]=null;
        if(_f3!=null){
            _f3.enPassant=true;
        }
    }
    var _f4=null;
    if(_e9.piece==ChessPiece.KING&&Math.abs(_e8.toColumn-_e8.fromColumn)>1){
        var _f5;
        var _f6;
        if(_e8.toColumn>_e8.fromColumn){
            _f4=this.boardPieces[7][_e8.fromRow];
            _f5=_e8.fromRow;
            _f6=5;
            this.boardPieces[7][_e8.toRow]=null;
        }else{
            _f4=this.boardPieces[0][_e8.fromRow];
            _f5=_e8.fromRow;
            _f6=3;
            this.boardPieces[0][_e8.toRow]=null;
        }
        if(!_f4){
            alert("No castle piece");
        }else{
            _f4.setPosition(_f6,_f5,_ea,null,_eb,null,_f0);
            this.boardPieces[_f4.column][_f4.row]=_f4;
            _f4.castled=true;
        }
    }
    _e8.taken=_f3;
    if(_f3&&_ec){
        this.processTaken(_f3,true);
    }
    this.moveNumber++;
    _e8.preHalfMoveNumber=this.halfMoveNumber;
    this.halfMoveNumber++;
    if(_f3||_e9.piece==ChessPiece.PAWN){
        this.halfMoveNumber=0;
    }
    this.board_xy=null;
    if(_e8.promotion!=null){
        _e9.changePieceKeepImage(_e8.promotion);
    }
    _e9.setPosition(_e8.toColumn,_e8.toRow,_ea,function(){
        var tp=_f3;
        if(tp){
            tp.setVisible(false);
        }
        if(_e8.promotion!=null){
            _e9.changePiece(_e8.promotion);
        }
        if(_ee){
            _ee.call(_ef);
        }
    },_eb,_f3,_f0);
    if(!_ea){
        if(_e8.promotion!=null){
            _e9.changePiece(_e8.promotion);
        }
    }
    this.boardPieces[_e8.fromColumn][_e8.fromRow]=null;
    this.boardPieces[_e8.toColumn][_e8.toRow]=_e9;
    if(_f4!=null){
        _e8.taken=_f4;
    }
    _e8.preCastleQueenSide=new Array(2);
    _e8.preCastleKingSide=new Array(2);
    _e8.preCastleQueenSide[0]=this.canCastleQueenSide[0];
    _e8.preCastleQueenSide[1]=this.canCastleQueenSide[1];
    _e8.preCastleKingSide[0]=this.canCastleKingSide[0];
    _e8.preCastleKingSide[1]=this.canCastleKingSide[1];
    if(_e9.piece==ChessPiece.ROOK){
        if(((_e9.colour==ChessPiece.WHITE)&&_e8.fromRow==0)||((_e9.colour==ChessPiece.BLACK)&&_e8.fromRow==7)){
            if(_e8.fromColumn==0){
                this.canCastleQueenSide[_e9.colour]=false;
            }else{
                if(_e8.fromColumn==7){
                    this.canCastleKingSide[_e9.colour]=false;
                }
            }
        }
    }else{
        if(_e9.piece==ChessPiece.KING){
            this.canCastleQueenSide[_e9.colour]=false;
            this.canCastleKingSide[_e9.colour]=false;
        }
    }
    if(_f3&&(_f3.piece==ChessPiece.ROOK)){
        if(_e8.toColumn==0){
            if(((_f3.colour==ChessPiece.WHITE)&&_e8.toRow==0)||((_f3.colour==ChessPiece.BLACK)&&_e8.toRow==7)){
                this.canCastleQueenSide[_f3.colour]=false;
            }
        }else{
            if(_e8.toColumn==7){
                if(((_f3.colour==ChessPiece.WHITE)&&_e8.toRow==0)||((_f3.colour==ChessPiece.BLACK)&&_e8.toRow==7)){
                    this.canCastleKingSide[_f3.colour]=false;
                }
            }
        }
    }
    this.updatePositionReached(_e9.colour);
    for(var i=0;i<this.registeredMakeMoveListeners.length;i++){
        var _f9=this.registeredMakeMoveListeners[i].makeMoveCallback(_e8);
    }
};
Board.prototype.isThreeFoldRep=function(_fa){
    var _fb=this.toMove;
    if(_fa){
        if(_fb==ChessPiece.WHITE){
            _fb=ChessPiece.BLACK;
        }else{
            _fb=ChessPiece.WHITE;
        }
    }
    var _fc=this.boardToUniqueFen(_fb);
    return (this.positionsSeen[_fc]>=3);
};
Board.prototype.updatePositionReached=function(_fd){
    if(this.dontUpdatePositionReachedTable){
        return;
    }
    var _fe=this.boardToUniqueFen(_fd);
    if(!this.positionsSeen){
        this.positionsSeen=[];
    }
    if(this.positionsSeen[_fe]){
        this.positionsSeen[_fe]++;
    }else{
        this.positionsSeen[_fe]=1;
    }
};
Board.prototype.promptPromotion=function(_ff,col,row,_102,_103){
    _ff.prePromotionColumn=_ff.column;
    _ff.prePromotionRow=_ff.row;
    _ff.setPosition(col,row,false,null,this.moveAnimationLength);
    var _104=this;
    var _105=new YAHOO.widget.Dialog("promotionDialogId",{width:"300px",fixedcenter:true,visible:true,modal:true,close:false,constraintoviewport:true,buttons:[{text:_js("Queen"),handler:function(){
        _105.hide();
        _104.updatePiece(_ff,col,row,_102,_103,false,"q");
    },isDefault:true},{text:_js("Rook"),handler:function(){
        _105.hide();
        _104.updatePiece(_ff,col,row,_102,_103,false,"r");
    },isDefault:false},{text:_js("Bishop"),handler:function(){
        _105.hide();
        _104.updatePiece(_ff,col,row,_102,_103,false,"b");
    },isDefault:false},{text:_js("Knight"),handler:function(){
        _105.hide();
        _104.updatePiece(_ff,col,row,_102,_103,false,"n");
    },isDefault:false}]});
    _105.setHeader(_js("Select Promotion Piece"));
    _105.setBody("<div></div>");
    _105.render(document.body);
};
Board.moveToLocale=function(_106){
    if(!_106||_106==""){
        return _106;
    }
    var _107="";
    for(var i=0;i<_106.length;i++){
        var _109=_106.charAt(i);
        switch(_109){
            case "K":
                _109=_js("K");
                break;
            case "Q":
                _109=_js("Q");
                break;
            case "R":
                _109=_js("R");
                break;
            case "N":
                _109=_js("N");
                break;
            case "B":
                _109=_js("B");
                break;
            case "P":
                _109=_js("P");
                break;
            case "a":
                _109=_js("a");
                break;
            case "b":
                _109=_js("b");
                break;
            case "c":
                _109=_js("c");
                break;
            case "d":
                _109=_js("d");
                break;
            case "e":
                _109=_js("e");
                break;
            case "f":
                _109=_js("f");
                break;
            case "g":
                _109=_js("g");
                break;
            case "h":
                _109=_js("h");
                break;
            case "x":
                _109=_js("x");
                break;
            case "#":
                _109=_js("#");
                break;
        }
        _107+=_109;
    }
    return _107;
};
Board.prototype.updatePiece=function(_10a,col,row,_10d,_10e,_10f,_110,_111){
    if(_110){
        this.board_xy=null;
        if(_10a.prePromotionRow){
            _10a.row=_10a.prePromotionRow;
            _10a.column=_10a.prePromotionColumn;
        }
    }
    if(_110==null&&_10a.column==col&&_10a.row==row){
        this.board_xy=null;
        _10a.setPosition(_10a.column,_10a.row,false,null,this.moveAnimationLength);
        if(clog){
            console.log("moved piece back to its orig position");
        }
        return;
    }
    var _112=null;
    if(this.currentMove){
        if(this.currentMove.prev){
            _112=this.currentMove.prev;
        }else{
            _112=this.prev_move;
        }
    }else{
        _112=this.prev_move;
    }
    if(clog){
        if(this.currentMove){
            console.log("updatepiece currentMove:"+this.currentMove.output());
        }else{
            console.log("updatepiece currentmove null");
        }
    }
    if(!_10d&&!this.canMove(_10a.makeLightWeight(),col,row,_112,true)){
        this.board_xy=null;
        _10a.setPosition(_10a.column,_10a.row,false,null,0.5);
        if(clog){
            console.log("move not legal , move back to orig:"+this.toMove);
            if(_112){
                console.log("prevMove was:"+_112.output());
            }else{
                console.log("prevMove was null");
            }
        }
        return;
    }
    var _113="";
    if(_10f&&_10a.piece==ChessPiece.PAWN&&(row==7||row==0)){
        this.promptPromotion(_10a,col,row,_10d,_10e);
        return;
    }else{
        if(_110!=null){
            _113=_110;
        }
    }
    var _114=true;
    var _115="";
    _115+=Move.columnToChar(_10a.column);
    _115+=String.fromCharCode("1".charCodeAt(0)+_10a.row);
    _115+=Move.columnToChar(col);
    _115+=String.fromCharCode("1".charCodeAt(0)+(row));
    if(_113){
        _115+=_113;
    }
    var _116=this.createMoveFromString(_115);
    var move=this.currentMove;
    if(move){
        _116.moveNum=move.moveNum;
    }
    var res=null;
    for(var i=0;i<this.registeredUpdateListeners.length;i++){
        _11a=this.registeredUpdateListeners[i].updatePieceCallback(_113,_10a,col,row,_10d,_10e,_10f,_110,_111,_112,this.currentMove,_116);
        if(!_11a){
            return false;
        }
        if(!_11a.ignoreRetVal){
            res=_11a;
        }
    }
    if(!res){
        if(clog){
            console.log("Got no update piece callbak");
        }
        return false;
    }
    if(res.allowMove){
        if(this.oldSelectedSquare){
            YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
        }
        var move=res.move;
        for(var i=0;i<this.registeredUpdateAllowMoveListeners.length;i++){
            var res2=this.registeredUpdateAllowMoveListeners[i].updateAllowMoveCallback(_113,_10a,col,row,_10d,_10e,_10f,_110,_111,move);
        }
        this.makeMove(move,_10a,_10e,this.moveAnimationLength,true,true,null,null,true);
        var _11c=!res.dontMakeOpponentMove&&!_10d&&(this.currentMove&&this.currentMove.next&&!this.currentMove.next.atEnd);
        if(clog){
            if(move.next){
                console.log("setting current move in updatepiece to:"+move.next.output());
            }else{
                console.log("in updatepiece, current move being set to null");
            }
        }
        this.setCurrentMove(move.next,false,_11c);
        if(this.currentMove.atEnd){
            for(var i=0;i<this.registeredUpdateEndOfMovesListeners.length;i++){
                var res=this.registeredUpdateEndOfMovesListeners[i].updateEndOfMovesCallback(_113,_10a,col,row,_10d,_10e,_10f,_110,_111);
            }
        }
        if(_11c){
            opponentMove=this.currentMove;
            if(this.currentMove&&this.currentMove.next.atEnd){
                this.toggleToMove();
            }
            this.updatePiece(this.boardPieces[opponentMove.fromColumn][opponentMove.fromRow],opponentMove.toColumn,opponentMove.toRow,true,true,false);
        }
    }else{
        var move=res.move;
        var _11d=_10a.column;
        var _11e=_10a.row;
        this.board_xy=null;
        _10a.setPosition(_10a.column,_10a.row,false,null,this.moveAnimationLength);
        for(var i=0;i<this.registeredUpdateWrongMoveListeners.length;i++){
            var res=this.registeredUpdateWrongMoveListeners[i].updateWrongMoveCallback(_113,_10a,col,row,_10d,_10e,_10f,_110,_111,move);
        }
    }
    for(var i=0;i<this.registeredUpdatePieceFinishedListeners.length;i++){
        var _11a=this.registeredUpdatePieceFinishedListeners[i].updatePieceFinishedCallback(_113,_10a,col,row,_10d,_10e,_10f,_110,_111,_112,this.currentMove,_116);
    }
};
Board.prototype.addGotoMoveIndexListener=function(_11f){
    this.registeredGotoMoveIndexListeners.push(_11f);
};
Board.prototype.addPasteFenClickedListener=function(_120){
    this.registeredPasteFenClickedListeners.push(_120);
};
Board.prototype.addBackMovePreCurrentListener=function(_121){
    this.registeredBackMovePreCurrentListeners.push(_121);
};
Board.prototype.addForwardMovePostUpdateListener=function(_122){
    this.registeredForwardMovePostUpdateListeners.push(_122);
};
Board.prototype.addForwardAtEndListener=function(_123){
    this.registeredForwardAtEndListeners.push(_123);
};
Board.prototype.addUpdatePieceListener=function(_124){
    this.registeredUpdateListeners.push(_124);
};
Board.prototype.addUpdatePieceFinishedListener=function(_125){
    this.registeredUpdatePieceFinishedListeners.push(_125);
};
Board.prototype.addUpdatePieceEndOfMovesListener=function(_126){
    this.registeredUpdateEndOfMovesListeners.push(_126);
};
Board.prototype.addUpdatePieceHaveAltListener=function(_127){
    this.registeredUpdateHaveAltListeners.push(_127);
};
Board.prototype.addUpdatePieceAllowMoveListener=function(_128){
    this.registeredUpdateAllowMoveListeners.push(_128);
};
Board.prototype.addMakeMoveListener=function(_129){
    this.registeredMakeMoveListeners.push(_129);
};
Board.prototype.addUpdatePieceWrongMoveListener=function(_12a){
    this.registeredUpdateWrongMoveListeners.push(_12a);
};
Board.prototype.scoreToShortString=function(_12b){
    if(_12b=="draw"){
        return "D";
    }
    if(_12b>=0){
        return "M"+_12b;
    }else{
        return "L"+(-1*_12b);
    }
};
Board.prototype.scoreToLongString=function(_12c){
    if(_12c=="draw"){
        return _js("Draw");
    }
    if(_12c==0){
        return _js("Mate");
    }else{
        if(_12c>0){
            return __js("Mate in {NUMBER_MOVES}",[["NUMBER_MOVES",_12c]]);
        }else{
            return __js("Lose in {NUMBER_MOVES}",[["NUMBER_MOVES",(-1*_12c)]]);
        }
    }
};
Board.prototype.egMoveToScoreString=function(_12d){
    var _12e=_12d.score;
    var _12f=_12d.optimal_score;
    var s=this.scoreToShortString(_12e);
    var opt=this.scoreToShortString(_12f);
    var _132=this.scoreToLongString(_12e);
    var _133=this.scoreToLongString(_12f);
    if(_12e==_12f){
        return ["",_132];
    }else{
        var _134="ct-subopt-move-score";
        if(_12e=="draw"||_12e<0){
            _134="ct-bad-move-score";
        }
        return ["<span class=\""+_134+"\">"+s+"("+opt+")</span>",_132+"("+_133+")"];
    }
};
Board.prototype.makeShortAlgabraic=function(_135,_136,_137,_138,_139){
    if(clog){
        console.log("fromCol:"+_135+" fromRow:"+_136+" toCol:"+_137+" toRow:"+_138);
    }
    var _13a=this.boardPieces[_135][_136];
    var _13b=_13a.piece;
    var _13c=ChessPiece.pieceTypeToChar(_13b);
    var move="";
    if(_13b==ChessPiece.PAWN){
        if(_135==_137){
            move=Move.columnToChar(_135)+""+(_138+1);
        }else{
            move=Move.columnToChar(_135)+"x"+Move.columnToChar(_137)+""+(_138+1);
            if(!this.boardPieces[_137][_138]){
                move+=" e.p.";
            }
        }
    }else{
        if(_13b==ChessPiece.KING){
            var _13e=Math.abs(_135-_137);
            if(_13e==1||_13e==0){
                move=_13c;
                if(this.boardPieces[_137][_138]){
                    move+="x";
                }
                move+=Move.columnToChar(_137)+""+(_138+1);
            }else{
                if(_137==6){
                    move="O-O";
                }else{
                    move="O-O-O";
                }
            }
        }else{
            var _13f=[];
            for(var row=0;row<8;row++){
                for(var col=0;col<8;col++){
                    var cp=this.boardPieces[col][row];
                    if(cp&&cp.colour==_13a.colour&&cp.piece==_13b&&!(_13a.column==cp.column&&_13a.row==cp.row)){
                        var prev=null;
                        if(this.currentMove){
                            prev=this.currentMove.prev;
                        }
                        if(this.canMove(cp.makeLightWeight(),_137,_138,prev,true)){
                            _13f.push(cp);
                        }
                    }
                }
            }
            move=_13c;
            if(_13f.length>0){
                var _144=false;
                var _145=false;
                for(var i=0;i<_13f.length;i++){
                    if(_13f[i].row==_136){
                        _145=true;
                    }
                    if(_13f[i].column==_135){
                        _144=true;
                    }
                }
                if(_145||!(_145||_144)){
                    move+=Move.columnToChar(_135);
                }
                if(_144){
                    move+=""+(_136+1);
                }
            }
            if(this.boardPieces[_137][_138]){
                move+="x";
            }
            move+=Move.columnToChar(_137)+""+(_138+1);
        }
    }
    var _147="";
    var _148="";
    if(_139){
        var _149=this.cloneBoard();
        var _14a=ChessPiece.WHITE;
        if(_149.boardPieces[_139.fromColumn][_139.fromRow].colour==ChessPiece.WHITE){
            _14a=ChessPiece.BLACK;
        }
        _149.makeMove(_139,_149.boardPieces[_139.fromColumn][_139.fromRow],false,_149.moveAnimationLength,false,false);
        if(!_149.isKingSafe(_14a,_139)){
            _147="+";
            if(_149.isKingMated(_14a,_139)){
                _147="#";
            }
        }
        if(_139.promotion){
            _148="="+((_139.promotion+"").toUpperCase());
        }
    }
    move+=_148+_147;
    return move;
};
Board.getVarMove=function(move,row,col,_14e,_14f){
    if(move.vars&&move.vars.length>0){
        var i=0;
        for(var i=0;i<move.vars.length;i++){
            var _151=move.vars[i];
            if(_151.fromColumn==_14e.column&&_151.fromRow==_14e.row&&_151.toRow==row&&_151.toColumn==col&&(_14f==""||(_14f==_151.promotion))){
                return _151;
            }
        }
    }
};
Board.prototype.createMoveFromString=function(_152){
    var _153=0;
    var take=false;
    var _155=null;
    var _156=_152.charCodeAt(_153++);
    var _157=_152.charCodeAt(_153++);
    var _158=_152.split("|");
    var pgn=null;
    if(_158.length>1){
        pgn=_158[1];
        _152=_158[0];
    }else{
        _152=_158[0];
    }
    if(_152.charAt(_153)=="x"){
        _153++;
        take=true;
    }
    var _15a=_152.charCodeAt(_153++);
    var _15b=_152.charCodeAt(_153++);
    if(_153<_152.length){
        _155=_152.charAt(_153);
    }
    var move=new Move(_156-("a".charCodeAt(0)),_157-("1".charCodeAt(0)),_15a-("a".charCodeAt(0)),_15b-("1".charCodeAt(0)),take,_155,_152);
    move.pgn=pgn;
    return move;
};
Board.prototype.getBackButton=function(){
    if(!this.backButton){
        this.backButton=YAHOO.util.Dom.get(this.boardName+"-back");
    }
    return this.backButton;
};
Board.prototype.getForwardButton=function(){
    if(!this.forwardButton){
        this.forwardButton=YAHOO.util.Dom.get(this.boardName+"-forward");
    }
    return this.forwardButton;
};
Board.prototype.getEndButton=function(){
    if(!this.endButton){
        this.endButton=YAHOO.util.Dom.get(this.boardName+"-end");
    }
    return this.endButton;
};
Board.prototype.getStartButton=function(){
    if(!this.startButton){
        this.startButton=YAHOO.util.Dom.get(this.boardName+"-start");
    }
    return this.startButton;
};
Board.prototype.setForwardBack=function(){
    var back=this.getBackButton();
    var _15e=this.getForwardButton();
    var end=this.getEndButton();
    var _160=this.getStartButton();
    if(!this.currentMove){
        if(back){
            back.src=this.boardImagePath+"/images/resultset_previous_disabled"+this.getVersString()+".gif";
        }
        if(_160){
            _160.src=this.boardImagePath+"/images/disabled_resultset_first"+this.getVersString()+".gif";
        }
        if(_15e){
            _15e.src=this.boardImagePath+"/images/resultset_next_disabled"+this.getVersString()+".gif";
        }
        if(end){
            end.src=this.boardImagePath+"/images/disabled_resultset_last"+this.getVersString()+".gif";
        }
        return;
    }
    if(this.currentMove.prev==null){
        if(back){
            back.src=this.boardImagePath+"/images/resultset_previous_disabled"+this.getVersString()+".gif";
        }
        if(_160){
            _160.src=this.boardImagePath+"/images/disabled_resultset_first"+this.getVersString()+".gif";
        }
    }else{
        if(back){
            back.src=this.boardImagePath+"/images/resultset_previous"+this.getVersString()+".gif";
        }
        if(_160){
            _160.src=this.boardImagePath+"/images/resultset_first"+this.getVersString()+".gif";
        }
    }
    if(this.currentMove.atEnd){
        if(_15e){
            _15e.src=this.boardImagePath+"/images/resultset_next_disabled"+this.getVersString()+".gif";
        }
        if(end){
            end.src=this.boardImagePath+"/images/disabled_resultset_last"+this.getVersString()+".gif";
        }
    }else{
        if(_15e){
            _15e.src=this.boardImagePath+"/images/resultset_next"+this.getVersString()+".gif";
        }
        if(end){
            end.src=this.boardImagePath+"/images/resultset_last"+this.getVersString()+".gif";
        }
    }
};
Board.prototype.convertPiecesFromLightWeight=function(_161){
    var _162=this.settingUpPosition;
    this.settingUpPosition=true;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            if(this.boardPieces[i][j]!=null){
                var _165=this.boardPieces[i][j];
                var p=_165.makeHeavyWeight();
                this.boardPieces[i][j]=p;
                p.setPosition(p.column,p.row,false,null,this.moveAnimationLength);
                p.setVisible(true);
            }
        }
    }
    var move=this.moveArray[_161];
    while(move!=null){
        if(move.taken){
            move.taken=move.taken.makeHeavyWeight();
        }
        move=move.prev;
    }
    this.settingUpPosition=_162;
};
MovesDisplay.prototype.setToMove=function(_168){
    this.toMove=_168;
};
MovesDisplay.prototype.clickComment=function(e){
    var t=e.currentTarget?e.currentTarget:e.targetElement?e.targetElement:false;
    if(!t){
        t=YAHOO.util.Event.getTarget(e);
    }
    if(!t.id){
        t=t.parentNode;
    }
    var _16b=t.id.substr((this.board.boardName+"-mcX").length);
    var _16c=true;
    if(t.id.indexOf("-mca")>=0){
        _16c=false;
    }
    var move=this.board.moveArray[_16b];
    var _16e="";
    if(_16c){
        _16e=move.beforeComment;
    }else{
        _16e=move.afterComment;
    }
    mySimpleDialog=new YAHOO.widget.SimpleDialog(this.boardName+"-editCommentDialog",{width:"20em",fixedcenter:true,modal:true,visible:false,draggable:false});
    mySimpleDialog.setHeader("Edit Comment");
    mySimpleDialog.setBody("<textarea id=\""+this.board.boardName+"-editComment\">"+_16e+"</textarea>");
    mySimpleDialog.cfg.setProperty("icon",YAHOO.widget.SimpleDialog.ICON_INFO);
    var me=this;
    var _170=function(){
        if(_16c){
            move.beforeComment=null;
        }else{
            move.afterComment=null;
        }
        t.innerHTML="";
        this.hide();
    };
    var _171=function(){
        var _172=YAHOO.util.Dom.get(me.board.boardName+"-editComment");
        var txt=trimStr(_172.value);
        if(_16c){
            move.beforeComment=txt;
        }else{
            move.afterComment=txt;
        }
        if(_16c){
            t.innerHTML=me.outputComment(txt,0)+" ";
        }else{
            t.innerHTML=" "+me.outputComment(txt,0);
        }
        this.hide();
    };
    var _174=function(){
        this.hide();
    };
    var _175=[{text:"Delete",handler:_170},{text:"Save",handler:_171},{text:"Cancel",handler:_174,isDefault:true}];
    mySimpleDialog.cfg.queueProperty("buttons",_175);
    mySimpleDialog.render(document.body);
    mySimpleDialog.show();
};
MovesDisplay.prototype.gotoMove=function(e){
    if(this.board.disableNavigation){
        return;
    }
    if(this.board.tactics&&this.board.tactics.problemActive){
        return;
    }
    if(this.board.blockFowardBack||this.board.deferredBlockForwardBack){
        return;
    }
    activeBoard=this.board;
    var t=e.currentTarget?e.currentTarget:e.targetElement?e.targetElement:false;
    if(!t){
        t=YAHOO.util.Event.getTarget(e);
    }
    if(!t.id){
        t=t.parentNode;
    }
    var _178=t.id.substr((this.board.boardName+"-m").length);
    if(clog){
        console.log("got goto move index:"+_178);
    }
    this.board.gotoMoveIndex(_178,false,false,false,false);
    if(this.board.problem){
        if(this.board.currentMove.bestMoves){
            this.board.problem.showBestMoves(this.board.currentMove,this.board.currentMove.bestMoves,this.board.currentMove.correctMove,this.board.currentMove.wrongMove);
        }else{
            this.board.problem.clearBestMoves();
        }
    }
};
MovesDisplay.prototype.getMovesDisplay=function(){
    if(!this.cachedMovesDisplay&&!this.allreadyCachedMovesDisplay){
        var name=this.board.boardName+"-moves";
        if(this.moveListName){
            name=this.moveListName;
        }
        this.cachedMovesDisplay=YAHOO.util.Dom.get(name);
        this.allreadyCachedMovesDisplay=true;
    }
    return this.cachedMovesDisplay;
};
MovesDisplay.prototype.outputVariationStart=function(_17a,_17b,_17c,_17d){
    var _17e="";
    if(_17b>this.board.ml){
        return _17e;
    }
    if(this.board.ml==1&&_17d>1){
        return _17e;
    }
    var _17f=this.getMovesDisplay();
    if(_17f||this.board.outputWithoutDisplay){
        if(_17a==0&&this.displayType==MovesDisplay.MAIN_ON_OWN_LINE){
            if(this.firstNonMove){
                if(this.board.useDivClearForNewline){
                    _17e+="<div style=\"clear:both;\"></div>";
                }
                _17e+="<div class=\"ct-mainline-commentary\"/>";
                this.pendingLevelZeroCommentaryClose=true;
            }
        }
        if(this.variationOnOwnLine){
            if(this.board.useDivClearForNewline){
                _17e+="<div style=\"clear:both;\"></div>";
            }else{
                _17e+="<br/>";
            }
        }
        if(this.board.showBracketsOnVariation&&(!this.board.hideBracketsOnTopLevelVariation||_17a>0)){
            _17e+="<span>"+this.board.variationStartString+"</span>";
        }
    }
    this.firstNonMove=false;
    return _17e;
};
MovesDisplay.prototype.outputVariationEnd=function(_180,_181,_182,_183){
    var _184=this.getMovesDisplay();
    var _185="";
    if(this.board.ml==1&&_181>0&&this.board.outputFirstVar){
        return _185;
    }
    this.board.outputFirstVar=true;
    if(_184||this.board.outputWithoutDisplay){
        if(this.board.showBracketsOnVariation&&(!this.board.hideBracketsOnTopLevelVariation||_180>1)){
            _185+="<span>"+this.board.variationEndString+"</span>";
        }
    }
    if(_180==1&&this.displayType==MovesDisplay.MAIN_ON_OWN_LINE){
    }
    this.firstNonMove=false;
    return _185;
};
MovesDisplay.prototype.outputComment=function(_186,_187,_188,_189){
    if(this.board.ignoreCommentRegex){
        var _18a=new RegExp(this.board.ignoreCommentRegex);
        if(_18a.test(_186)){
            return "";
        }
    }
    var _18b="";
    if(this.board.ml==1){
        return _18b;
    }
    var _18c=this.getMovesDisplay();
    if(_18c||this.board.outputWithoutDisplay){
        if(_187==0&&this.displayType==MovesDisplay.MAIN_ON_OWN_LINE){
            if(this.firstNonMove){
                _18b+="<br/>";
            }
            _18b+="<div class=\"ct-mainline-commentary\">";
            this.pendingLevelZeroCommentaryClose=true;
        }
        var _18d="ct-board-move-comment";
        if(_188){
            _18d="ct-board-move-alt-comment";
        }
        if(this.board.handleCommentClicks){
            _18d+=" ct-board-clickable-comment";
        }
        _18b+="<span class=\""+_18d+"\"> "+_186+" </span>";
        if(_187==0&&this.displayType==MovesDisplay.MAIN_ON_OWN_LINE){
        }
    }
    if(!_189){
        this.firstNonMove=false;
    }
    return _18b;
};
MovesDisplay.prototype.outputNag=function(_18e){
    var _18f="";
    var _190=this.getMovesDisplay();
    if(_190||this.board.outputWithoutDisplay){
        var _191=null;
        switch(_18e){
            case 11:
                _191="=";
                break;
            case 14:
                _191="+=";
                break;
            case 15:
                _191="=+";
                break;
            case 16:
                _191="+/-";
                break;
            case 17:
                _191="-/+";
                break;
            case 18:
                _191="+-";
                break;
            case 19:
                _191="-+";
                break;
            case 20:
                _191="+--";
                break;
            case 21:
                _191="--+";
                break;
            default:
        }
        if(_191){
            _18f+="<span> "+_191+" </span>";
        }
    }
    return _18f;
};
MovesDisplay.prototype.outputResult=function(_192){
    return "<span class=\"ct-result\">"+_192+"</span>";
};
MovesDisplay.prototype.outputMove=function(_193,_194,_195,_196,_197,_198,_199,move,_19b,_19c,_19d,_19e,_19f,_1a0,_1a1){
    var clog=false;
    if(clog){
        console.log("outputMove:"+_196+" hideScore:"+_19b+" this.board:"+this.board);
    }
    var _1a3="";
    var _1a4=this.getMovesDisplay();
    if(this.board.tr&&_194>0&&(_198>1||_199>3)&&!_197){
        return _1a3;
    }
    if(clog){
        console.log("ravLevel:"+_194+" ravCount:"+_198+" topCount:"+_199+" output:"+_196);
    }
    if(this.board.ml==1&&_198>0&&this.board.outputFirstVar){
        return _1a3;
    }
    if(clog){
        console.log("movesDisplay:"+_1a4);
    }
    if(_1a4||this.board.outputWithoutDisplay){
        var _1a5=""+Math.round(_195/2)+". ";
        var _1a6=false;
        if(_195%2!=1){
            if(clog){
                console.log("firstRav:"+_197+" firstNonMove:"+this.firstNonMove);
            }
            if(_197||!this.firstNonMove){
                _1a5=Math.round(_195/2)+"... ";
                _1a6=true;
            }else{
                _1a5="";
            }
        }
        if(clog){
            console.log("moveNum:"+_195+" moveNumOut:"+_1a5);
        }
        if(this.displayType==MovesDisplay.MAIN_ON_OWN_LINE&&_194==0&&(!this.firstNonMove||_195%2==1)){
            if(this.pendingLevelZeroCommentaryClose){
                this.pendingLevelZeroCommentaryClose=false;
                _1a3+="</div>";
            }
            if(this.board.newlineForEachMainMove){
                if(this.board.useDivClearForNewline){
                    _1a3+="<div style=\"clear:both;\"></div>";
                }else{
                    _1a3+="<br/>";
                }
            }
        }
        var _1a7="";
        var _1a8="";
        if(move&&move.eg_move){
            var res=this.board.egMoveToScoreString(move.eg_move);
            _1a7=res[0];
            _1a8=res[1];
        }
        var _1aa="";
        if(_19b){
            _1aa="initially_hidden";
        }
        if(_1a7!=""){
            _1a7=" "+_1a7;
        }
        var _1ab="title";
        if(_19b){
            _1ab="alt";
        }
        var _1ac="";
        if(_19c){
            _1ac=" rel=\""+_196+"\" ";
            _196="___";
        }
        var _1ad="";
        if(_1a6&&_194==0){
            _1ad="<span class=\"ct-board-move-dottedempty\">&nbsp;</span>";
        }
        var _1ae="";
        if(_1a5){
            _1ae="<span class=\"ct-board-move-movenum\">"+_1a5+"</span>";
        }
        var _1af="";
        if(_193==0){
            if(_19d){
                _1af=" ct-best-move ";
            }else{
                if(_19f){
                    _1af=" ct-bad-move ";
                }else{
                    if(_19e){
                        _1af=" ct-good-move ";
                    }else{
                        if(_1a0){
                            _1af=" ct-current-move ";
                        }else{
                            _1af=" ct-first-move ";
                        }
                    }
                }
            }
        }
        if(_1a1){
            _1af=" ct-current-move ";
        }
        _1a3+="<span "+_1ac+_1ab+"=\""+_1a8+"\" id=\""+this.board.boardName+"-m"+_193+"\" class=\""+((_194==0)?"ct-board-move-mainline":"ct-board-move-variation")+_1af+"\">"+_1ae+_1ad+"<span class=\"ct-board-move-movetext\">"+_196+"</span><span id=\""+this.board.boardName+"-msc"+_193+"\" class=\""+_1aa+"\">"+_1a7+"</span></span>";
    }
    this.firstNonMove=true;
    return _1a3;
};
Board.prototype.setMoveSeqLalg=function(_1b0,_1b1,_1b2,_1b3,_1b4,_1b5,_1b6,_1b7,_1b8,_1b9,_1ba,_1bb){
    var _1bc=new Array();
    if(_1b0&&_1b0.length>0){
        _1bc=_1b0.replace(/\s+$/g,"").split(" ");
    }
    this.setupFromLalgArray(_1bc,_1b3,_1b2,_1b1,_1b4,_1b5,_1b6,_1b7,_1b8,_1b9,_1ba,_1bb);
};
Board.prototype.setupFromLalgArray=function(_1bd,_1be,_1bf,_1c0,_1c1,_1c2,_1c3,_1c4,_1c5,_1c6,_1c7,_1c8){
    var clog=false;
    if(clog){
        console.log("top of setupFromLalgArray");
    }
    this.outputFirstVar=false;
    if(this.movesDisplay){
        this.movesDisplay.pendingLevelZeroCommentaryClose=false;
        var md=this.movesDisplay.getMovesDisplay();
        if(md){
            if(!_1c2){
                YAHOO.util.Event.purgeElement(md,true);
            }
            md.innerHTML="";
        }
    }
    if(!_1c0){
        _1c0=new Array();
    }
    var _1cb=this.cloneBoard();
    this.movesDisplay.firstNonMove=false;
    var _1cc=null;
    var _1cd=null;
    if(!_1c1){
        _1cc=new Array();
        _1cd=new Array();
    }
    if(!_1c6&&this.prev_move){
        if(clog){
            console.log("this.prev_move:"+this.prev_move.output());
        }
        if(_1cb.boardPieces[this.prev_move.fromColumn][this.prev_move.fromRow]){
            _1cb.makeMove(this.prev_move,_1cb.boardPieces[this.prev_move.fromColumn][this.prev_move.fromRow],false,_1cb.moveAnimationLength,false,false);
        }
    }
    var _1ce=null;
    if(!_1c1){
        _1ce=_1cb.cloneBoard();
    }
    var _1cf=null;
    var _1d0=0;
    var _1d1="";
    var _1d2=false;
    var _1d3=false;
    var _1d4=0;
    var _1d5=false;
    var _1d6=new Array();
    var _1d7=new Array();
    _1d7[0]=0;
    var _1d8=new Array();
    var _1d9=new Array();
    var _1da=_1bf*2-1;
    var _1db=_1bf*2-1;
    var _1dc=new Array();
    var _1dd=ChessPiece.WHITE;
    var _1de=0;
    var eval="";
    var _1e0="";
    var _1e1="";
    var time="";
    var _1e3=-1;
    var _1e4=0;
    for(var i=0;i<_1bd.length;i++){
        var _1e6=0;
        if(clog){
            console.log("movesArr["+i+"]:"+_1bd[i]);
        }
        if(_1bd[i]=="ALT"){
            _1d3=true;
            continue;
        }
        if(_1bd[i].indexOf("EVAL")==0){
            eval=_1bd[i].split(":")[1];
            if(parseInt(eval)>=175&&_1d4>0&&_1d7[_1d4]>1){
                _1d3=true;
            }
            continue;
        }
        if(_1bd[i].indexOf("DEPTH")==0){
            _1e0=_1bd[i].split(":")[1];
            continue;
        }
        if(_1bd[i].indexOf("NODES")==0){
            _1e1=_1bd[i].split(":")[1];
            continue;
        }
        if(_1bd[i].indexOf("TIME")==0){
            time=_1bd[i].split(":")[1];
            var e=eval;
            if(eval.indexOf("mate")!=0){
                e=(parseFloat(eval)/100).toFixed(2);
                if(e>0){
                    e="+"+e;
                }
            }else{
                e=e.replace(/_/," ");
                var _1e8=e.split(" ");
                _1e6=parseInt(_1e8[1]);
                e=_js("mate")+" "+_1e8[1];
                if(_1d7[_1d4]==1){
                    _1e3=_1e6;
                }
            }
            _1e4=_1e6;
            if(_1e6<0){
                _1d3=false;
            }else{
                if(_1e6>0&&_1e6<8&&_1d4>0&&_1d7[_1d4]>1){
                    _1d3=true;
                }
            }
            var _1e9="";
            if(_1d3){
                _1e9=_js("ALT")+" ";
            }
            var t=parseInt(time);
            var nps=" "+__js("nps:{NODES_PER_SECOND}",[["NODES_PER_SECOND",Math.round(parseInt(_1e1)/(parseInt(time)/1000))]]);
            if(!this.showNPS){
                nps="";
            }
            if(!(_1d4>0&&_1d7[_1d4]>this.ml)){
                _1bd[i]=_1e9+e+" ("+__js("depth:{DEPTH}",[["DEPTH",_1e0]])+nps+")";
            }else{
                _1bd[i]="";
            }
        }
        if(_1bd[i]=="}"){
            _1d2=false;
            if(this.movesDisplay){
                _1d1=_1d1.replace(/\s+$/g,"");
                _1dc.push(this.movesDisplay.outputComment(_1d1,_1d4,_1d3));
            }
            continue;
        }else{
            if(_1d2){
                _1d1+=_1bd[i]+" ";
                continue;
            }else{
                if(_1bd[i]=="{"){
                    _1d1="";
                    _1d2=true;
                    continue;
                }else{
                    if(_1bd[i]=="("){
                        if(!_1d7[_1d4+1]){
                            _1d7[_1d4+1]=0;
                        }
                        _1d7[_1d4+1]++;
                        if(this.movesDisplay){
                            _1dc.push(this.movesDisplay.outputVariationStart(_1d4,_1d7[_1d4+1],_1da,_1d6[0]));
                        }
                        _1d6[_1d4]=_1da;
                        _1d8[_1d4]=_1cf;
                        _1d9[_1d4]=_1dd;
                        _1cc[_1d4]=_1cb;
                        _1cd[_1d4]=_1ce;
                        _1cb=_1ce.cloneBoard();
                        _1d4++;
                        _1da--;
                        _1d5=true;
                        continue;
                    }else{
                        if(_1bd[i]==")"){
                            if(this.movesDisplay){
                                _1dc.push(this.movesDisplay.outputVariationEnd(_1d4,_1d7[_1d4],_1da,_1d6[0]));
                            }
                            var _1ec=new Move();
                            _1ec.atEnd=true;
                            _1cf.next=_1ec;
                            _1ec.prev=_1cf;
                            _1d4--;
                            _1da=_1d6[_1d4];
                            _1cf=_1d8[_1d4];
                            _1dd=_1d9[_1d4];
                            _1cb=_1cc[_1d4];
                            _1ce=_1cd[_1d4];
                            _1d3=false;
                            continue;
                        }else{
                            if(_1bd[i].charAt(0)=="$"){
                                if(this.movesDisplay){
                                    _1dc.push(this.movesDisplay.outputNag(parseInt(_1bd[i].substring(1))));
                                }
                                continue;
                            }
                        }
                    }
                }
            }
        }
        var move=this.createMoveFromString(_1bd[i]);
        var _1ee=false;
        if(_1da==_1db&&this.boardPieces[move.fromColumn][move.fromRow].colour==ChessPiece.BLACK){
            _1da++;
            _1ee=true;
            _1dd=ChessPiece.BLACK;
        }
        move.index=_1d0;
        var _1ef=(move.pgn)?move.pgn:move.moveString;
        if(move.pgn){
            _1ef=move.pgn;
        }else{
            _1ef=_1cb.makeShortAlgabraic(move.fromColumn,move.fromRow,move.toColumn,move.toRow,move);
            move.SAN=_1ef;
        }
        _1ef=Board.moveToLocale(_1ef);
        if(this.movesDisplay){
            this.movesDisplay.setToMove(_1dd);
            var _1f0=false;
            if(_1c7&&_1c8&&!_1c8.atEnd){
                var _1f1=_1c8.toMoveString();
                _1c8=_1c8.next;
                if(_1f1==_1bd[i]){
                    _1f0=true;
                }else{
                    _1c7=false;
                }
            }
            _1dc.push(this.movesDisplay.outputMove(_1d0,_1d4,_1da,_1ef+" ",_1d5,_1d7[_1d4],_1d6[0],null,false,false,_1c3,_1c4,_1c5,_1c7,_1f0));
        }
        _1dd=(_1dd==ChessPiece.BLACK)?ChessPiece.WHITE:ChessPiece.BLACK;
        move.moveNum=_1da;
        _1da++;
        if(_1d4>0){
            if(_1d5){
                var _1f2=_1cf;
                if(_1f2==null){
                    alert("Got no previous move for variation:"+movesArra[i]);
                }
                if(_1f2.numVars==0){
                    _1f2.vars=new Array();
                }
                move.isAlt=_1d3;
                move.mateInMoves=_1e4;
                _1f2.vars[_1f2.numVars++]=move;
                move.prev=_1f2.prev;
                _1d5=false;
            }else{
                move.prev=_1cf;
                if(_1cf!=null){
                    _1cf.next=move;
                }
            }
        }else{
            move.prev=_1cf;
            if(_1cf!=null){
                _1cf.next=move;
            }
        }
        _1d7[_1d4+1]=0;
        if(_1d4==0){
            _1de=_1d0;
        }
        _1c0[_1d0++]=move;
        _1cb.moveArray[_1d0-1]=move;
        _1cf=move;
        if(!_1c1){
            _1ce=_1cb.cloneBoard();
        }
        _1cb.makeMove(move,_1cb.boardPieces[move.fromColumn][move.fromRow],false,_1cb.moveAnimationLength,false,false);
    }
    if(this.movesDisplay&&!this.disableMoveOutput){
        var _1f3=this.movesDisplay.getMovesDisplay();
        _1dc.push(this.movesDisplay.outputResult(_1be));
        this.pendingMovesOutput=_1dc.join("");
        this.pendingMovesOutputCount=_1d0;
    }
    this.lastMoveIndex=_1de;
    if(_1cf!=null){
        var _1ec=new Move();
        _1ec.atEnd=true;
        _1cf.next=_1ec;
        _1ec.prev=_1cf;
    }
    this.lastCount=_1d0;
};
Board.prototype.getMaterialCount=function(){
    var _1f4=0;
    var _1f5=0;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var _1f8=this.boardPieces[i][j];
            if(_1f8){
                if(_1f8.colour==ChessPiece.WHITE){
                    _1f4+=ChessPiece.materialValue(_1f8.piece);
                }else{
                    _1f5+=ChessPiece.materialValue(_1f8.piece);
                }
            }
        }
    }
    return [_1f4,_1f5];
};
Board.prototype.getMaterialBalance=function(){
    var cnt=this.getMaterialCount();
    return cnt[0]-cnt[1];
};
Board.prototype.getMaterialBalances=function(){
    var _1fa=this.cloneBoard();
    var mv=this.moveArray[0];
    _1fa.gotoMoveIndex(-1,true,true,true,true);
    var _1fc=[];
    while(mv&&!mv.atEnd){
        _1fa.makeMove(mv,_1fa.boardPieces[mv.fromColumn][mv.fromRow],false,this.moveAnimationLength,false,false);
        _1fc.push(_1fa.getMaterialBalance());
        mv=mv.next;
        _1fa.toggleToMove();
    }
    return _1fc;
};
Board.prototype.lalgToMoveList=function(_1fd,_1fe,_1ff,_200,_201,_202){
    if(ctime){
        console.time("lalgToMoveList");
    }
    if(clog){
        console.log("startMoveNum:"+_1ff);
    }
    if(!_200){
        _200=new Array();
    }
    var _203=this.cloneBoard();
    var _204=null;
    var _205=null;
    if(!_202){
        _204=new Array();
        _205=new Array();
    }
    if(!_201&&this.prev_move){
        _203.makeMove(this.prev_move,_203.boardPieces[this.prev_move.fromColumn][this.prev_move.fromRow],false,_203.moveAnimationLength,false,false);
    }
    var _206=null;
    if(!_202){
        _206=_203.cloneBoard();
    }
    var nags=[];
    var _208=null;
    var _209=0;
    var _20a="";
    var _20b=false;
    var _20c=0;
    var _20d=false;
    var _20e=new Array();
    var _20f=new Array();
    _20f[0]=0;
    var _210=new Array();
    var _211=new Array();
    var _212=_1ff*2-1;
    var _213=new Array();
    var _214=ChessPiece.WHITE;
    var _215=0;
    var _216=true;
    for(var i=0;i<_1fd.length;i++){
        if(_1fd[i]=="}"){
            _20b=false;
            _20a=_20a.replace(/\s+$/g,"");
            continue;
        }else{
            if(_20b){
                _20a+=_1fd[i]+" ";
                continue;
            }else{
                if(_1fd[i]=="{"){
                    if(_20a){
                        if(_208){
                            _208.afterComment=trimStr(_20a);
                        }
                    }
                    _20a="";
                    _20b=true;
                    continue;
                }else{
                    if(_1fd[i]=="("){
                        if(clog){
                            console.log("var start comment:"+_20a);
                        }
                        if(_208){
                            _208.afterComment=trimStr(_20a);
                            _20a="";
                        }
                        if(clog){
                            if(_208){
                                console.log("old:"+_208.output());
                            }else{
                                console.log("no old move");
                            }
                        }
                        if(!_20f[_20c+1]){
                            _20f[_20c+1]=0;
                        }
                        _20f[_20c+1]++;
                        _20e[_20c]=_212;
                        _210[_20c]=_208;
                        _211[_20c]=_214;
                        _204[_20c]=_203;
                        _205[_20c]=_206;
                        _203=_206.cloneBoard();
                        _20c++;
                        _212--;
                        _20d=true;
                        continue;
                    }else{
                        if(_1fd[i]==")"){
                            if(_208){
                                if(clog){
                                    console.log("var end comment:"+_20a);
                                    console.log("var end comment:"+_208.output());
                                }
                                _208.afterComment=trimStr(_20a);
                                _20a="";
                            }
                            var _218=new Move();
                            _218.atEnd=true;
                            _208.next=_218;
                            _218.prev=_208;
                            _20c--;
                            _212=_20e[_20c];
                            _208=_210[_20c];
                            _214=_211[_20c];
                            _203=_204[_20c];
                            _206=_205[_20c];
                            continue;
                        }else{
                            if(_1fd[i].charAt(0)=="$"){
                                nags.push(parseInt(_1fd[i].substring(1)));
                                continue;
                            }
                        }
                    }
                }
            }
        }
        var move=this.createMoveFromString(_1fd[i]);
        move.nags=nags;
        move.beforeComment=trimStr(_20a);
        _20a=null;
        nags=[];
        if(_216){
            if(this.boardPieces[move.fromColumn][move.fromRow].colour==ChessPiece.BLACK){
                _212++;
                _214=ChessPiece.BLACK;
                if(clog){
                    console.log("first move black new movenum:"+_212);
                }
            }
            _216=false;
        }
        move.index=_209;
        var _21a=(move.pgn)?move.pgn:move.moveString;
        if(move.pgn){
            _21a=move.pgn;
            move.SAN=move.pgn;
        }else{
            _21a=_203.makeShortAlgabraic(move.fromColumn,move.fromRow,move.toColumn,move.toRow,move);
            move.SAN=_21a;
        }
        _214=(_214==ChessPiece.BLACK)?ChessPiece.WHITE:ChessPiece.BLACK;
        move.moveNum=_212;
        _212++;
        if(_20c>0){
            if(_20d){
                var _21b=_208;
                if(_21b==null){
                    alert("Got no previous move for variation:"+movesArra[i]);
                }
                if(_21b.numVars==0){
                    _21b.vars=new Array();
                }
                _21b.vars[_21b.numVars++]=move;
                move.prev=_21b.prev;
                _20d=false;
            }else{
                move.prev=_208;
                if(_208!=null){
                    _208.next=move;
                }
            }
        }else{
            move.prev=_208;
            if(_208!=null){
                _208.next=move;
            }
        }
        _20f[_20c+1]=0;
        if(_20c==0){
            _215=_209;
        }
        _200[_209++]=move;
        _203.moveArray[_209-1]=move;
        _208=move;
        if(!_202){
            _206=_203.cloneBoard();
        }
        _203.makeMove(move,_203.boardPieces[move.fromColumn][move.fromRow],false,_203.moveAnimationLength,false,false);
    }
    if(_208!=null){
        var _218=new Move();
        _218.atEnd=true;
        _208.next=_218;
        _218.prev=_208;
        if(_20a){
            _208.afterComment=trimStr(_20a);
        }
    }
    if(ctime){
        console.timeEnd("lalgToMoveList");
    }
    return _200;
};
Board.prototype.reset=function(fen,_21d){
    if(this.lastFromSquare){
        YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
    }
    if(this.lastToSquare){
        YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
    }
    this.clearMoveList();
    if(fen){
        this.startFen=fen;
        this.setupFromFen(fen,false,this.isFlipped,false,_21d,true);
    }else{
        this.startFen=Board.INITIAL_FEN;
        this.setupFromFen(Board.INITIAL_FEN,false,this.isFlipped,false,false,true);
    }
    this.setForwardBack();
};
Board.prototype.clearMoveList=function(_21e){
    this.movesDisplay.firstNonMove=false;
    var _21f=this.movesDisplay.getMovesDisplay();
    if(_21f){
        YAHOO.util.Event.purgeElement(_21f,true);
        _21f.innerHTML="";
    }
    this.currentMove=null;
    this.moveIndex=-1;
    this.moveArray=new Array();
    if(_21e){
        _21e.prev=null;
        this.startMoveNum=_21e.moveNum;
    }else{
        this.startMoveNum=1;
    }
};
Board.prototype.insertMovesFromMoveList=function(_220,_221,_222,_223,_224){
    var _225=!_221;
    if(clog){
        console.log("insertMovesFromMoveList called");
    }
    if(ctime&&_225){
        console.time("insertMovesFromMoveList");
    }
    if(!this.movesDisplay){
        return;
    }
    if(_225){
        this.clearMoveList(_220);
    }
    var _226=0;
    var _227=_220.moveNum;
    var move=_220;
    while(move!=null&&!move.atEnd){
        if(clog){
            console.log("move:"+move.output());
        }
        var _229=move.next;
        if(clog){
            if(this.currentMove){
                console.log("current move:"+this.currentMove.output());
            }else{
                console.log("no current move");
            }
            if(_229){
                console.log("next move:"+_229.output());
            }else{
                console.log("no next move");
            }
        }
        if(_225||_220!=move||_222==null){
            if(clog){
                console.log("about to call insertmoveafter");
            }
            if(_223!=null){
                if(clog){
                    console.log("inserting after moveToInsertAfter:"+_223.output());
                }
                this.insertMoveAfter(_223,move);
                _223=null;
            }else{
                if(clog){
                    console.log("inserting after current move");
                }
                this.insertMoveAfter(this.currentMove,move);
            }
            if(clog){
                console.log("finished call to insertmoveafter");
            }
        }else{
            if(clog){
                console.log("about to replace variationParent:"+_222.output()+" with move:"+move.output()+" and board:"+this.boardToFen());
            }
            this.replaceMove(_222,move,true,true,false,false,true);
        }
        if(move.beforeComment){
            this.insertCommentIntoMoveDisplay(move,move.beforeComment,false);
        }
        if(move.afterComment){
            this.insertCommentIntoMoveDisplay(move,move.afterComment,true);
        }
        if(clog){
            console.log("about to make move:"+move.output()+" with board pos:"+this.boardToFen());
        }
        this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],false,this.moveAnimationLength,false,false);
        if(clog){
            console.log("made move");
        }
        this.setCurrentMove(move,true,true);
        if(move.numVars>0){
            var _22a=move.index;
            var bm=move.prev;
            var _22c=-1;
            if(bm){
                _22c=bm.index;
            }
            var _22d=move.numVars;
            var vars=move.vars;
            move.numVars=0;
            move.vars=[];
            for(var i=0;i<_22d;i++){
                this.gotoMoveIndex(_22c,true,true,true,true);
                if(clog){
                    console.log("about to call insertMovesFromMoveList with head of variation");
                }
                this.insertMovesFromMoveList(vars[i],true,move,null,0);
                if(clog){
                    console.log("about to reset currentMoveIndex  after variation insert:"+_22a);
                }
            }
            this.gotoMoveIndex(_22a,true,true,true,true);
            this.backMove();
            var cm=this.currentMove;
            this.makeMove(cm,this.boardPieces[cm.fromColumn][cm.fromRow],false,this.moveAnimationLength,false,false);
            if(clog){
                if(this.currentMove){
                    console.log("popped up from variation, current set back to:"+this.currentMove.output());
                }else{
                    console.log("popped up from variation, current set to null");
                }
            }
        }
        move=_229;
        _226++;
        if(_224>0&&_226>=_224){
            break;
        }
    }
    if(_225){
        this.gotoMoveIndex(-1,false,false,false,false);
    }
    if(clog){
        var m=this.currentMove;
        while(m){
            console.log("m:"+m.output());
            m=m.next;
        }
    }
    if(ctime&&_225){
        console.timeEnd("insertMovesFromMoveList");
    }
};
Board.prototype.setupFromLalgArrayIncremental=function(_232,_233,_234,_235){
    this.outputFirstVar=false;
    if(this.movesDisplay&&this.lastCount){
        this.movesDisplay.pendingLevelZeroCommentaryClose=false;
        for(var i=0;i<this.lastCount;i++){
            var mv=YAHOO.util.Dom.get(this.boardName+"-m"+i);
            if(mv){
                YAHOO.util.Event.purgeElement(mv);
            }
        }
    }
    var _238=0;
    var _239=_234*2-1;
    var _23a="";
    var _23b=false;
    var _23c=false;
    var _23d=ChessPiece.WHITE;
    var _23e=false;
    var _23f=true;
    this.currentMove=null;
    for(var i=0;i<_232.length;i++){
        if(_232[i]=="}"){
            _23e=false;
            if(this.movesDisplay){
                _23a=_23a.replace(/\s+$/g,"");
            }
            continue;
        }else{
            if(_23e){
                _23a+=_232[i]+" ";
                continue;
            }else{
                if(_232[i]=="{"){
                    _23a="";
                    _23e=true;
                    continue;
                }else{
                    if(_232[i]=="("){
                        _23b=true;
                        continue;
                    }else{
                        if(_232[i]==")"){
                            _23c=true;
                            continue;
                        }else{
                            if(_232[i].charAt(0)=="$"){
                                continue;
                            }
                        }
                    }
                }
            }
        }
        var move=this.createMoveFromString(_232[i]);
        var _241=false;
        if(_23f&&this.boardPieces[move.fromColumn][move.fromRow].colour==ChessPiece.BLACK){
            _239++;
            _241=true;
            _23d=ChessPiece.BLACK;
        }
        this.startMoveNum=_239;
        _23f=false;
        move.index=_238++;
        var _242=move.moveString;
        _242=Board.moveToLocale(_242);
        _23d=(_23d==ChessPiece.BLACK)?ChessPiece.WHITE:ChessPiece.BLACK;
        this.insertMoveAfter(this.currentMove,move);
        if(clog){
            if(move.prev){
                if(move.prev.next){
                    console.log("move.prev.next:"+move.prev.next.output());
                }else{
                    console.log("move.prev:"+move.prev.output()+" next null");
                }
            }
        }
        this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],false,this.moveAnimationLength,false,false);
        this.setCurrentMove(move);
    }
    this.gotoMoveIndex(-1,false,false,false,false);
};
Board.prototype.displayPendingMoveList=function(){
    if(this.pendingMovesOutput&&this.movesDisplay){
        var _243=this.movesDisplay.getMovesDisplay();
        if(_243){
            _243.innerHTML=this.pendingMovesOutput;
            var _244=new YAHOO.util.Scroll(_243,{scroll:{to:[0,0]}},0);
            _244.animate();
        }
        if(this.movesDisplay){
            for(var i=0;i<this.pendingMovesOutputCount;i++){
                var mv1=YAHOO.util.Dom.get(this.boardName+"-m"+i);
                if(mv1){
                    YAHOO.util.Event.addListener(mv1,"click",this.movesDisplay.gotoMove,this.movesDisplay,true);
                    if(this.handleCommentClicks){
                        var _247=YAHOO.util.Dom.get(this.boardName+"-mcb"+i);
                        if(_247){
                            YAHOO.util.Event.addListener(_247,"click",this.movesDisplay.clickComment,this.movesDisplay,true);
                        }
                        _247=YAHOO.util.Dom.get(this.boardName+"-mca"+i);
                        if(_247){
                            YAHOO.util.Event.addListener(_247,"click",this.movesDisplay.clickComment,this.movesDisplay,true);
                        }
                    }
                }
            }
        }
    }
};
Board.prototype.setMoveSequence=function(_248,_249,_24a,_24b){
    this.tacticMoveArray=new Array();
    this.moveArray=this.tacticMoveArray;
    this.setMoveSeqLalg(_248,this.tacticMoveArray,_24a,_24b);
    this.tacticsmoveArrayLastMoveIndex=this.lastMoveIndex;
    if(false&&_249!="NA"){
        this.fullmoveArray=new Array();
        this.disableMoveOutput=true;
        this.setMoveSeqLalg(_249,this.fullmoveArray,_24a,_24b);
        this.disableMoveOutput=false;
        this.fullmoveArrayLastMoveIndex=this.lastMoveIndex;
    }else{
        this.fullmoveArray=null;
    }
    this.lastMoveIndex=this.tacticsmoveArrayLastMoveIndex;
};
Board.prototype.resetVariationsPreviousNodes=function(_24c,_24d){
    if(_24c.numVars>0){
        for(var i=0;i<_24c.numVars;i++){
            _24c.vars[i].prev=_24d;
            this.resetVariationsPreviousNodes(_24c.vars[i],_24d);
        }
    }
};
Board.prototype.reconnectNextNodeVariations=function(_24f,_250){
    if(!_250){
        return;
    }
    if(_250.numVars>0){
        for(var i=0;i<_250.numVars;i++){
            _250.vars[i].prev=_24f;
            this.reconnectNextNodeVariations(_24f,_250.vars[i]);
        }
    }
};
Board.prototype.findFirstMoveFromList=function(move){
    var m=move;
    while(m&&m.prev!=null){
        m=m.prev;
    }
    return m;
};
Board.prototype.findVariationHeadFromMove=function(move){
    var m=move;
    while(m&&m.prev&&m.prev.next==m){
        m=m.prev;
    }
    if(m&&m.prev&&m.prev.next!=m){
        return m;
    }else{
        if(m&&!m.prev){
            var _256=this.moveArray[0];
            if(m!=_256){
                return m;
            }
        }
        return null;
    }
};
Board.prototype.liftVariation=function(_257){
    if(!_257){
        return;
    }
    var _258=null;
    var _259=null;
    if(_257.prev){
        _258=_257.prev.next;
    }else{
        _258=this.moveArray[0];
        _259=_257;
    }
    var _25a=null;
    if(this.currentMove&&this.currentMove.prev){
        _25a=this.currentMove.prev;
    }
    if(_258){
        var _25b=_258.numVars;
        var vars=_258.vars;
        _258.numVars=0;
        _258.vars=[];
        if(_257.numVars==0){
            _257.vars=[];
        }
        for(var i=0;i<_25b;i++){
            var _25e=vars[i];
            if(clog){
                console.log("processing var:"+_25e.output());
            }
            if(_25e==_257){
                if(clog){
                    console.log("inserted parent var");
                }
                _257.vars.push(_258);
                _257.numVars++;
            }else{
                _257.vars.push(_25e);
                _257.numVars++;
            }
        }
        if(_257.prev){
            _257.prev.next=_257;
        }
        if(clog){
            console.log("finished moving variations");
        }
        if(!_259){
            _259=this.findFirstMoveFromList(_257);
        }
        this.moveArray[0]=_259;
        this.gotoMoveIndex(-1,true,true,true,true);
        if(clog){
            console.log("fm:"+_259.output());
        }
        this.insertMovesFromMoveList(_259);
    }
    if(_25a){
        this.gotoMoveIndex(_25a.index);
    }
};
Board.prototype.deleteMoveAndLine=function(move){
    var m=move;
    var oldM=m;
    var _262=false;
    var _263=null;
    var _264=this.moveArray[0];
    var _265=null;
    if(clog){
        console.log("delete line:"+move.output());
    }
    if(clog){
        console.log("delete line prev:"+move.prev);
    }
    if(clog&&move.prev){
        console.log("delete line prev.next:"+move.prev.next);
    }
    if(move&&move.prev&&move.prev.next!=move){
        if(clog){
            console.log("var is head and not front of move list");
        }
        _262=true;
        _263=move.prev.next;
    }else{
        if(move&&!move.prev&&move!=this.moveArray[0]){
            if(clog){
                console.log("var is head and front of move list");
            }
            _262=true;
            _263=this.moveArray[0];
        }
    }
    if(clog){
        console.log("isVariationHead:"+_262);
    }
    if(clog){
        console.log("fm:"+_264.output());
    }
    var _266=m.prev;
    if(_262){
        _265=_263;
        if(_263){
            if(clog){
                console.log("delete variation from parent:"+_263.output());
            }
            var _267=[];
            for(var i=0;i<_263.numVars;i++){
                if(!(_263.vars[i]==oldM)){
                    if(clog){
                        console.log("saving var:"+_263.vars[i].output());
                    }
                    _267.push(_263.vars[i]);
                }else{
                    if(clog){
                        console.log("dropping var:"+_263.vars[i].output());
                    }
                }
            }
            _263.vars=_267;
            _263.numVars=_267.length;
        }
    }else{
        if(_266){
            _266.next=null;
            _265=_266;
        }else{
            if(clog){
                console.log("deleting entire list");
            }
            if(this.movesDisplay){
                this.movesDisplay.firstNonMove=false;
                YAHOO.util.Event.purgeElement(this.movesDisplay.getMovesDisplay(),true);
                this.movesDisplay.pendingLevelZeroCommentaryClose=false;
            }
            var _269=this.movesDisplay.getMovesDisplay();
            if(_269){
                _269.innerHTML="";
            }
            this.currentMove=null;
            this.startMoveNum=_264.moveNum;
            if(clog){
                console.log("startFen:"+this.startFen);
            }
            this.moveIndex=-1;
            this.moveArray=[];
            this.setupFromFen(this.startFen);
            if(this.lastFromSquare){
                YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
            }
            if(this.lastToSquare){
                YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
            }
            this.setForwardBack();
            return;
        }
    }
    this.moveArray[0]=_264;
    this.gotoMoveIndex(-1,true,true,true,true);
    if(clog){
        console.log("fm:"+_264.output());
    }
    this.insertMovesFromMoveList(_264);
    if(_265){
        this.gotoMoveIndex(_265.index);
    }
};
Board.prototype.insertMoveAfter=function(_26a,_26b,_26c,_26d,_26e,_26f){
    addToMovelist=!_26c;
    if(clog){
        console.log("addToMovelist:"+addToMovelist);
    }
    var _270="null";
    if(_26a){
        _270=_26a.output();
    }
    if(clog){
        console.log("insert newMove:"+_26b.output()+" after:"+_270);
    }
    if(_26a==null){
        this.currentMove=_26b;
        _26b.atEnd=0;
        _26b.prev=null;
        _26b.next=null;
        this.firstMove=_26b;
        if(this.startMoveNum>0){
            this.currentMove.moveNum=this.startMoveNum;
        }else{
            if(this.toMove==ChessPiece.WHITE){
                this.currentMove.moveNum=1;
            }else{
                this.currentMove.moveNum=2;
            }
        }
        if(clog){
            console.log("startMoveNum:"+this.startMoveNum+" currMoveNum:"+this.currentMove.moveNum);
        }
    }else{
        _26b.atEnd=_26a.atEnd;
        _26b.prev=_26a;
        _26a.atEnd=0;
        if(clog){
            if(_26a.next){
                console.log("prevMove.next:"+_26a.next.output());
            }
        }
        if(_26b.equals(_26a.next)||_26b.equals(_26a)){
            if(clog){
                console.log("inserting move that already exists in variation:"+_26a.next.output());
            }
            var _271=_26a.next;
            if(this.firstMove==_271){
                this.firstMove=_26b;
            }
            if(_26b.equals(_26a)){
                _271=_26a;
            }
            if(_271.prev&&(_271.prev.next==_271)){
                _271.prev.next=_26b;
            }
            if(_271.next){
                _271.next.prev=_26b;
            }
            addToMovelist=false;
            _26b.moveNum=_271.moveNum;
            _26b.ravLevel=_271.ravLevel;
            _26b.index=_271.index;
            _26b.fen=_271.fen;
            _26b.nextFen=_271.nextFen;
            _26b.bestMoves=_271.bestMoves;
            _26b.correctMove=_271.correctMove;
            _26b.wrongMove=_271.wrongMove;
            _26b.next=_271.next;
            _26b.vars=_271.vars;
            _26b.numVars=_271.numVars;
            this.reconnectNextNodeVariations(_26b,_271.next);
            this.moveArray[_26b.index]=_26b;
            if(this.currentMove==_271){
                this.setCurrentMove(_26b);
            }
        }else{
            _26b.moveNum=_26a.moveNum+1;
            _26b.ravLevel=_26a.ravLevel;
            _26b.next=_26a.next;
            if(_26b.next){
                _26b.next.prev=_26b;
            }
        }
        _26a.next=_26b;
    }
    if(addToMovelist){
        this.insertIntoMoveDisplay(_26a,_26b,_26d,_26e,_26f);
    }
    if(_26b.next==null){
        var _272=this.createMoveFromString("i1i2");
        _26b.next=_272;
        _272.prev=_26b;
        _272.moveNum=_26b.moveNum+1;
        _272.ravLevel=_26b.ravLevel;
        _272.next=null;
        _272.atEnd=1;
        _272.endNode=true;
        if(clog){
            console.log("created endmove node in insertAfterMove:"+_272.output());
        }
    }else{
        if(clog){
            console.log("allready had a node at end:"+_26b.next.output());
        }
        _26b.next.moveNum=_26b.moveNum+1;
    }
};
function insertBefore(node,_274){
    if(_274){
        _274.parentNode.insertBefore(node,_274);
    }
}
function insertAfter(node,_276){
    var _277=_276.parentNode;
    _277.insertBefore(node,_276.nextSibling);
}
Board.prototype.replaceIntoMoveDisplay=function(_278,_279,_27a,_27b,_27c){
    var _27d="null";
    if(_278){
        _27d=_278.output();
    }
    if(clog){
        console.log("replace display newMove:"+_279.output()+" after:"+_27d+" hideScore:"+_27b);
    }
    if(!_278){
        if(clog){
            console.log("null oldMove");
        }
        this.insertIntoMoveDisplay(null,_279,false,_27b);
    }else{
        if(clog){
            console.log("about to get movesdsiplay in replace into move display:"+this.movesDisplay);
        }
        var _27e=this.movesDisplay.getMovesDisplay();
        if(clog){
            console.log("got moves display");
        }
        if(!_27e){
            if(clog){
                console.log("no movesd disiplay in replace into move display");
            }
            return;
        }
        var san=_279.SAN;
        if(!san){
            if(clog){
                console.log("about to make san");
            }
            san=this.makeShortAlgabraic(_279.fromColumn,_279.fromRow,_279.toColumn,_279.toRow,_279);
            if(clog){
                console.log("about to made san:"+san);
            }
            _279.SAN=san;
        }
        if(clog){
            console.log("oldMove.index:"+_278.index);
        }
        var _280=this.boardName+"-ms"+_278.index;
        var _281=-1;
        if(_278.next){
            _281=this.boardName+"-m"+_278.next.index;
        }
        if(clog){
            console.log("oldMoveId:"+_280);
        }
        var _282=YAHOO.util.Dom.get(_280);
        var _283=YAHOO.util.Dom.get(_281);
        if(_27a){
            this.moveIndex++;
            _279.index=this.moveIndex;
            this.moveArray[this.moveIndex]=_279;
            if(clog){
                console.log("replace as variation old:"+_278.output()+" new:"+_279.output());
            }
            var _284=document.createElement("span");
            if(typeof _278.ravlevel=="undefined"||_278.ravlevel==0){
                YAHOO.util.Dom.addClass(_284,"ct-top-var-start");
            }
            var _285=this.movesDisplay.outputVariationStart(0,0,_279.moveNum,0);
            _279.ravLevel=_278.ravlevel+1;
            var _27d=Board.moveToLocale(san);
            if(_279.prev==null){
                this.movesDisplay.firstNonMove=false;
            }
            var _286=this.movesDisplay.outputMove(this.moveIndex,_279.ravLevel,_279.moveNum,_27d,_27a,0,_279.moveNum,_279,_27b,_27c);
            var _287=document.createElement("span");
            _287.id=(this.boardName+"-ms"+_279.index);
            _287.innerHTML=_286+"&nbsp;";
            var _288=this.movesDisplay.outputVariationEnd(0,0,_279.moveNum,0);
            this.movesDisplay.firstNonMove=true;
            var _289=document.createElement("span");
            _289.innerHTML=_285;
            var _28a=document.createElement("span");
            _28a.innerHTML=_288;
            _284.appendChild(_289);
            var els=YAHOO.util.Dom.getElementsByClassName("ct-mainline-commentary","div",_284);
            var _28c=_284;
            if(els.length>0){
                _28c=els[0];
            }
            _28c.appendChild(_287);
            _28c.appendChild(_28a);
            _282.appendChild(_284);
            if(_283){
                var els=YAHOO.util.Dom.getElementsByClassName("ct-board-move-movenum","span",_283);
                if(els.length==0){
                    var _28d=_278.next.moveNum;
                    var _28e=""+Math.round(_28d/2)+". ";
                    var _28f=false;
                    if(_28d%2!=1){
                        if(clog){
                            console.log("firstRav:"+firstRav+" firstNonMove:"+this.firstNonMove);
                        }
                        if(true||firstRav||!this.firstNonMove){
                            _28e=Math.round(_28d/2)+"... ";
                            _28f=true;
                        }else{
                            _28e="";
                        }
                    }
                    var _287=document.createElement("span");
                    _287.className="ct-board-move-movenum";
                    _287.innerHTML=_28e;
                    insertBefore(_287,_283.firstChild);
                    _287=document.createElement("span");
                    if(_28f){
                        _287.className="ct-board-move-dottedempty";
                        _287.innerHTML="&nbsp;";
                        insertAfter(_287,_283.firstChild);
                    }
                }
            }
        }else{
            _279.index=_278.index;
            this.moveArray[_279.index]=_279;
            var _27d=Board.moveToLocale(san);
            if(_279.prev==null){
                this.movesDisplay.firstNonMove=false;
            }
            var _286=this.movesDisplay.outputMove(_279.index,_279.ravLevel,_279.moveNum,_27d,_27a,0,_279.moveNum,_279,_27b,_27c);
            var _287=document.createElement("span");
            _287.innerHTML=_286+"&nbsp;";
            _287.id=(this.boardName+"-ms"+_279.index);
            var _290=[];
            if(_282&&_282.childNodes){
                for(var i=1;i<_282.childNodes.length;i++){
                    _290[i-1]=_282.childNodes[i];
                }
            }
            if(clog){
                console.log("replace as main line not variation old:"+_278.output()+" new:"+_279.output());
            }
            _282.parentNode.replaceChild(_287,_282);
            if(_290){
                for(var i=0;i<_290.length;i++){
                    _287.appendChild(_290[i]);
                }
            }
        }
        YAHOO.util.Event.removeListener(this.boardName+"-m"+_279.index);
        YAHOO.util.Event.addListener((this.boardName+"-m"+_279.index),"click",this.movesDisplay.gotoMove,this.movesDisplay,true);
    }
};
Board.prototype.insertCommentIntoMoveDisplay=function(move,_293,_294){
    var _295=this.movesDisplay.getMovesDisplay();
    if(!_295){
        return;
    }
    var _296="b";
    if(_294){
        _296="a";
    }
    if(move){
        var _297=this.boardName+"-mc"+_296+move.index;
        var _298=YAHOO.util.Dom.get(_297);
        var _299=false;
        if(!_298){
            _298=document.createElement("span");
            _298.id=_297;
            _299=true;
        }
        var _29a=move.moveNum%2!=1;
        var _29b=!_29a&&!_294;
        if(clog){
            console.log("dontResetFirstNoneMove:"+_29b+" isBlackMoveNum:"+_29a+" insertCommentAfter:"+_294+" move.moveNum:"+move.moveNum+" comment:"+_293);
        }
        _298.innerHTML=this.movesDisplay.outputComment(_293,0,false,_29b);
        var _29c=YAHOO.util.Dom.get((this.boardName+"-m"+move.index));
        if(_29c){
            if(_294){
                move.afterComment=_293;
                if(_299){
                    insertAfter(_298,_29c);
                }
            }else{
                move.beforeComment=_293;
                if(_299){
                    insertBefore(_298,_29c);
                }
            }
        }
        if(_298&&_299&&this.handleCommentClicks){
            YAHOO.util.Event.addListener(_298,"click",this.movesDisplay.clickComment,this.movesDisplay,true);
        }
    }else{
    }
};
Board.prototype.insertIntoMoveDisplay=function(_29d,_29e,_29f,_2a0,_2a1){
    var _2a2=this.movesDisplay.getMovesDisplay();
    if(!_2a2){
        return;
    }
    if(clog){
        var _2a3="null";
        if(_29d){
            _2a3=_29d.output();
        }
        console.log("insert display newMove:"+_29e.output()+" after:"+_2a3);
    }
    var san=_29e.SAN;
    if(!san){
        san=this.makeShortAlgabraic(_29e.fromColumn,_29e.fromRow,_29e.toColumn,_29e.toRow,_29e);
        _29e.SAN=san;
    }
    this.moveIndex++;
    _29e.index=this.moveIndex;
    this.moveArray[this.moveIndex]=_29e;
    var _2a3=Board.moveToLocale(san);
    var _2a5=false;
    var _2a6=null;
    if(_29d){
        _2a6=YAHOO.util.Dom.get((this.boardName+"-ms"+_29d.index));
    }
    if(_2a6){
        var els=YAHOO.util.Dom.getElementsByClassName("ct-mainline-commentary","div",_2a6);
        if(els.length>0){
            _2a5=true;
        }
    }
    var _2a8=this.movesDisplay.outputMove(this.moveIndex,_29e.ravLevel,_29e.moveNum,_2a3,_2a5,0,_29e.moveNum,_29e,_2a0,_2a1);
    var _2a9=document.createElement("span");
    _2a9.innerHTML=_2a8+"&nbsp;";
    _2a9.id=(this.boardName+"-ms"+this.moveIndex);
    if(_29f){
        YAHOO.util.Dom.setStyle(_2a9,"visibility","hidden");
    }
    if(_29d){
        if(clog){
            console.log("prevMove.index:"+_29d.index+"prevMove:"+_29d.output());
        }
        if(_2a6){
            insertAfter(_2a9,_2a6);
        }else{
            _2a2.appendChild(_2a9);
        }
    }else{
        if(_29e.next){
            var _2aa=YAHOO.util.Dom.get((this.boardName+"-ms"+_29e.next.index));
            insertBefore(_2a9,_2aa);
        }else{
            _2a2.appendChild(_2a9);
        }
    }
    YAHOO.util.Event.removeListener(this.boardName+"-m"+this.moveIndex);
    YAHOO.util.Event.addListener((this.boardName+"-m"+this.moveIndex),"click",this.movesDisplay.gotoMove,this.movesDisplay,true);
};
Board.prototype.replaceMove=function(_2ab,_2ac,_2ad,_2ae,_2af,_2b0,_2b1){
    var _2b2="null";
    if(_2ab){
        _2b2=_2ab.output();
    }
    if(clog){
        console.log("replace newMove:"+_2ac.output()+" after:"+_2b2+" replace as var"+_2ad+" rep move display:"+_2ae+" hideScore:"+_2af+" replaceAsVariationEvenIfSame:"+_2b1);
        if(_2ab&&_2ab.prev){
            console.log("replace oldMove.prev:"+_2ab.prev.output());
        }
        if(_2ab&&_2ab.next){
            console.log("replace oldMove.next:"+_2ab.next.output());
        }
    }
    var _2b3=false;
    var _2b4=null;
    var _2b5=0;
    if(_2ab.endNode){
        if(clog){
            console.log("asked to replace endNode,inserting before instead");
        }
        this.insertMoveAfter(_2ab.prev,_2ac,false,false,_2af,_2b0);
        _2ac.fen=_2ab.fen;
        _2ac.nextFen=_2ab.nextFen;
        return;
    }
    if(!_2b1&&_2ac.equals(_2ab)){
        if(clog){
            console.log("new move is same as old move so not replacing as variation");
        }
        _2ad=false;
    }else{
        if(!_2b1&&_2ab&&_2ab.numVars>0){
            for(var i=0;i<_2ab.numVars;i++){
                var _2b7=_2ab.vars[i];
                if(_2ac.equals(_2b7)){
                    if(clog){
                        console.log("new move is same as an existing variation varNum:"+i);
                        console.log("variation:"+_2b7.output());
                        if(_2b7.next){
                            console.log("variation next:"+_2b7.next.output());
                        }
                    }
                    _2b3=true;
                    _2b4=_2ab;
                    _2ab=_2b7;
                    _2b5=i;
                    break;
                }
            }
        }
    }
    if(_2ab==null){
        if(clog){
            console.log("replaced new move with null oldmove");
        }
        this.currentMove=_2ac;
        _2ac.atEnd=1;
        _2ac.next=null;
        _2ac.prev=null;
        if(this.startPositionAfterOpponentMove){
            _2ac.fen=this.startPositionAfterOpponentMove;
            _2ac.nextFen=null;
        }
        if(this.toMove==ChessPiece.WHITE){
            this.currentMove.moveNum=1;
        }else{
            this.currentMove.moveNum=2;
        }
        this.firstMove=_2ac;
    }else{
        var _2b8=false;
        if(_2ab&&_2ab.prev&&_2ab.prev.next!=_2ab){
            _2b8=true;
        }
        if(this.currentMove==_2ab&&!_2ad){
            this.currentMove=_2ac;
        }else{
            if(clog){
                console.log("not setting current move in replacemove");
            }
        }
        _2ac.atEnd=_2ab.atEnd;
        _2ac.prev=_2ab.prev;
        _2ac.next=_2ab.next;
        _2ac.fen=_2ab.fen;
        _2ac.nextFen=_2ab.nextFen;
        _2ac.bestMoves=_2ab.bestMoves;
        _2ac.correctMove=_2ab.correctMove;
        _2ac.wrongMove=_2ab.wrongMove;
        _2ac.moveNum=_2ab.moveNum;
        _2ac.ravLevel=_2ab.ravLevel;
        _2ac.index=_2ab.index;
        if(clog){
            console.log("replacingVariation with var not null:"+_2b3);
        }
        if(_2b3){
            _2b4.vars[_2b5]=_2ac;
            _2ac.vars=_2ab.vars;
            _2ac.numVars=_2ab.numVars;
            this.reconnectNextNodeVariations(_2ac,_2ab.next);
            if(_2ab.next){
                _2ab.next.prev=_2ac;
            }
            this.moveArray[_2ac.index]=_2ac;
            if(clog){
                console.log("replacing existing sub variation of main line");
                if(_2ac.next){
                    console.log("next of replacement variation:"+_2ac.next.output());
                }
            }
            return;
        }
        if(!_2ad){
            if(clog){
                console.log("not replacing as variation");
            }
            if(!_2b8&&_2ab.prev){
                _2ab.prev.next=_2ac;
            }
            if(_2ab.next){
                _2ab.next.prev=_2ac;
            }
            _2ac.vars=_2ab.vars;
            _2ac.numVars=_2ab.numVars;
            this.reconnectNextNodeVariations(_2ac,_2ab.next);
            if(this.firstMove==_2ab){
                this.firstMove=_2ac;
            }
            this.moveArray[_2ac.index]=_2ac;
        }else{
            if(clog){
                console.log("replacing as variation");
            }
            if(_2ab.numVars==0){
                _2ab.vars=new Array();
            }
            _2ab.vars[_2ab.numVars++]=_2ac;
            _2ab.atEnd=0;
            _2ac.next=null;
            var _2b9=this.createMoveFromString("i1i2");
            _2ac.next=_2b9;
            _2b9.prev=_2ac;
            _2b9.next=null;
            _2b9.atEnd=1;
            _2b9.moveNum=_2ac.moveNum+1;
            _2b9.ravLevel=_2ac.ravLevel;
            _2b9.endNode=true;
        }
    }
    if(_2ae){
        this.replaceIntoMoveDisplay(_2ab,_2ac,_2ad,_2af,_2b0);
    }
};
Board.prototype.setCurrentMove=function(move,_2bb,_2bc){
    if(!this.cloned&&this.currentMove!=null){
        if(this.currentMove.prev!=null){
            YAHOO.util.Dom.removeClass(this.boardName+"-m"+this.currentMove.prev.index,"ct-board-move-current");
        }
    }
    this.currentMove=move;
    if(!this.cloned&&this.currentMove!=null&&this.currentMove.prev!=null){
        var _2bd=this.boardName+"-m"+this.currentMove.prev.index;
        if(clog){
            console.log("setCurrentMove attempted highlight of id:"+_2bd+" for move:"+move.output());
        }
        var span=YAHOO.util.Dom.get(_2bd);
        if(span){
            var cls=span.className;
            YAHOO.util.Dom.addClass(span,"ct-board-move-current");
            if(this.autoScrollMoves){
                if(!_2bc&&(this.scrollVariations||cls.indexOf("ct-board-move-variation")==-1)){
                    var _2c0=this.movesDisplay.getMovesDisplay();
                    if(_2c0){
                        var off=0;
                        if(_2c0&&_2c0.offsetHeight){
                            off=_2c0.offsetHeight/2;
                        }
                        var y=YAHOO.util.Dom.getY(span)-(YAHOO.util.Dom.getY(_2c0)+off);
                        var _2c3=new YAHOO.util.Scroll(_2c0,{scroll:{by:[0,y-this.scrollOffsetCorrection]}},this.moveAnimationLength,YAHOO.util.Easing.easeOut);
                        _2c3.animate();
                    }
                }
            }
        }
    }else{
        if(move==null){
            if(clog){
                console.log("attempted to set current move on null node");
            }
        }
    }
    if(!_2bb){
        this.setForwardBack();
    }
};
Board.prototype.distanceFromInitial=function(){
    var _2c4=this.cloneBoard();
    _2c4.setupFromFen(Board.INITIAL_FEN,false,false,true,false,false);
    var _2c5=0;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var p1=this.boardPieces[i][j];
            var p2=_2c4.boardPieces[i][j];
            if(p1==p2){
                continue;
            }
            if(!p2){
                continue;
            }
            if(!p1){
                _2c5++;
                continue;
            }
            if(p1.piece==p2.piece&&p1.colour==p2.colour){
                continue;
            }
            _2c5++;
        }
    }
    return _2c5;
};
Board.INITIAL_FEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
Board.isFenLegal=function(fen){
    function isLegalCastling(c){
        if(!c){
            return false;
        }
        c=c.toLowerCase();
        for(var i=0;i<c.length;i++){
            if(!(c.charAt(i)=="q"||c.charAt(i)=="k"||c.charAt(i)=="-")){
                return false;
            }
        }
        return true;
    }
    function isLegalEnpassant(m){
        if(!m){
            return false;
        }
        if(m=="-"){
            return true;
        }
        if(m.length!=2){
            return false;
        }
        if(m.charAt(0)<"a"||m.charAt(0)>"h"){
            return false;
        }
        var n=parseInt(m.charAt(1));
        if(isNaN(n)||n<1||n>8){
            return false;
        }
        return true;
    }
    function isRowLegal(r){
        if(!r){
            return false;
        }
        r=r.toLowerCase();
        for(var i=0;i<r.length;i++){
            if(!isSquareCharLegal(r.charAt(i))){
                return false;
            }
        }
        return true;
    }
    function isSquareCharLegal(c){
        switch(c){
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "p":
            case "k":
            case "b":
            case "q":
            case "r":
            case "k":
                return true;
            default:
                false;
        }
    }
    if(!fen){
        return false;
    }
    var ss=fen.split(" ");
    if(ss.length!=6){
        return false;
    }
    var pos=ss[0].split("/");
    if(pos.length!=8){
        return false;
    }
    if(ss[1]!="w"&&ss[1]!="b"){
        return false;
    }
    if(isNaN(parseInt(ss[4]))){
        return false;
    }
    if(isNaN(parseInt(ss[5]))){
        return false;
    }
    if(!isLegalCastling(ss[2])){
        return false;
    }
    if(!isLegalEnpassant(ss[3])){
        return false;
    }
    return true;
};
Board.prototype.boardToUniqueFen=function(_2d4){
    var fen=this.boardToFen();
    var ss=fen.split(" ");
    var _2d7="w";
    if(_2d4==ChessPiece.BLACK){
        _2d7="b";
    }
    var _2d8=ss[0]+" "+_2d7+" "+ss[2]+" "+ss[3];
    return _2d8;
};
Board.prototype.boardToFen=function(_2d9){
    var _2da="";
    for(var row=7;row>=0;row--){
        var _2dc=0;
        var line="";
        if(row<7){
            line="/";
        }
        for(var col=0;col<8;col++){
            var _2df=this.boardPieces[col][row];
            if(_2df){
                var _2e0="";
                if(_2dc>0){
                    _2e0=_2dc+"";
                }
                line+=_2e0+_2df.getFenLetter();
                _2dc=0;
            }else{
                _2dc++;
            }
        }
        if(_2dc>0){
            line+=_2dc+"";
        }
        _2da+=line;
    }
    var fen=_2da;
    var _2e2=" w ";
    if(_2d9){
        if(this.toMove==ChessPiece.WHITE){
            _2e2=" b ";
        }
    }else{
        if(this.toMove==ChessPiece.BLACK){
            _2e2=" b ";
        }
    }
    fen+=_2e2;
    var _2e3="";
    _2e3+=Board.getFenCastleChar(this.canCastleKingSide,"K",ChessPiece.WHITE);
    _2e3+=Board.getFenCastleChar(this.canCastleQueenSide,"Q",ChessPiece.WHITE);
    _2e3+=Board.getFenCastleChar(this.canCastleKingSide,"K",ChessPiece.BLACK);
    _2e3+=Board.getFenCastleChar(this.canCastleQueenSide,"Q",ChessPiece.BLACK);
    if(_2e3==""){
        fen+="- ";
    }else{
        fen+=_2e3+" ";
    }
    var _2e4=null;
    if(this.currentMove){
        if(this.currentMove.prev){
            _2e4=this.currentMove.prev;
        }else{
            _2e4=this.prev_move;
        }
    }else{
        _2e4=this.prev_move;
    }
    var _2e5="- ";
    if(_2e4){
        var _2e6=this.boardPieces[_2e4.toColumn][_2e4.toRow];
        if(_2e6){
            if(_2e6.piece==ChessPiece.PAWN){
                if(_2e6.colour==ChessPiece.WHITE){
                    if(_2e4.fromRow==1&&_2e4.toRow==3){
                        _2e5=Move.columnToChar(_2e4.fromColumn)+"3 ";
                    }
                }else{
                    if(_2e4.fromRow==6&&_2e4.toRow==4){
                        _2e5=Move.columnToChar(_2e4.fromColumn)+"6 ";
                    }
                }
            }
        }
    }
    fen+=_2e5;
    fen+=this.halfMoveNumber+" "+parseInt((this.moveNumber+1)/2);
    if(clog){
        console.log("moveNumber:"+this.moveNumber+" fen:"+fen);
    }
    return fen;
};
Board.getFenCastleChar=function(_2e7,_2e8,_2e9){
    if(_2e7[_2e9]){
        if(_2e9==ChessPiece.WHITE){
            return _2e8.toUpperCase();
        }else{
            return _2e8.toLowerCase();
        }
    }
    return "";
};
Board.prototype.getCastlingString=function(_2ea){
    var _2eb=_js("None");
    if(this.canCastleKingSide[_2ea]){
        _2eb="O-O";
    }
    if(this.canCastleQueenSide[_2ea]){
        if(_2eb==_js("None")){
            _2eb="O-O-O";
        }else{
            _2eb+=",O-O-O";
        }
    }
    return _2eb;
};
Board.prototype.updateToPlay=function(){
    if(this.disableUpdateToPlay){
        return;
    }
    if(this.showToMoveIndicators){
        if(this.isFlipped){
            YAHOO.util.Dom.setStyle(this.boardName+"-top-to-move-inner","background-color","white");
            YAHOO.util.Dom.setStyle(this.boardName+"-top-to-move-inner","border","1px solid black");
            YAHOO.util.Dom.setStyle(this.boardName+"-bottom-to-move-inner","background-color","black");
            YAHOO.util.Dom.setStyle(this.boardName+"-bottom-to-move-inner","border","1px solid white");
        }else{
            YAHOO.util.Dom.setStyle(this.boardName+"-bottom-to-move-inner","background-color","white");
            YAHOO.util.Dom.setStyle(this.boardName+"-bottom-to-move-inner","border","1px solid black");
            YAHOO.util.Dom.setStyle(this.boardName+"-top-to-move-inner","background-color","black");
            YAHOO.util.Dom.setStyle(this.boardName+"-top-to-move-inner","border","1px solid white");
        }
        if(this.toMove==ChessPiece.WHITE){
            if(this.isFlipped){
                YAHOO.util.Dom.addClass(this.boardName+"-top-to-move-outer","ct-to-move-active");
                YAHOO.util.Dom.removeClass(this.boardName+"-bottom-to-move-outer","ct-to-move-active");
            }else{
                YAHOO.util.Dom.addClass(this.boardName+"-bottom-to-move-outer","ct-to-move-active");
                YAHOO.util.Dom.removeClass(this.boardName+"-top-to-move-outer","ct-to-move-active");
            }
        }else{
            if(this.isFlipped){
                YAHOO.util.Dom.addClass(this.boardName+"-bottom-to-move-outer","ct-to-move-active");
                YAHOO.util.Dom.removeClass(this.boardName+"-top-to-move-outer","ct-to-move-active");
            }else{
                YAHOO.util.Dom.addClass(this.boardName+"-top-to-move-outer","ct-to-move-active");
                YAHOO.util.Dom.removeClass(this.boardName+"-bottom-to-move-outer","ct-to-move-active");
            }
        }
    }
    var _2ec=YAHOO.util.Dom.get("toPlay");
    if(_2ec==null){
        return;
    }
    if(this.toMove==ChessPiece.WHITE){
        _2ec.src="/images/whiteknight"+this.getVersString()+".gif";
        _2ec.alt=_js("White to play");
    }else{
        _2ec.src="/images/blackknight"+this.getVersString()+".gif";
        _2ec.alt=_js("Black to play");
    }
    var _2ed=YAHOO.util.Dom.get("fenStatus");
    if(_2ed){
        var _2ee=this.getCastlingString(ChessPiece.BLACK);
        var _2ef=this.getCastlingString(ChessPiece.WHITE);
        var s="<div><span>"+_js("White Castling: ")+"</span><span>"+_2ef+"</span></div>"+"<div><span>"+_js("Black Castling: ")+"</span><span>"+_2ee+"</span></div>";
        _2ed.innerHTML=s;
    }
};
Board.prototype.getBoardDivFromId=function(id){
    if(!this[id]){
        this[id]=YAHOO.util.Dom.get(id);
    }
    return this[id];
};
Board.prototype.getBoardDiv=function(){
    if(!this.boardDiv){
        this.boardDiv=YAHOO.util.Dom.get("ctb-"+this.boardName);
    }
    return this.boardDiv;
};
Board.prototype.getDocBody=function(){
    if(!this.docBody){
        var _2f2=document.getElementsByTagName("body");
        if(_2f2==null||_2f2.length==0){
            alert("Could not find body tag");
        }else{
            this.docBody=_2f2[0];
        }
    }
    return this.docBody;
};
Board.prototype.getPieceDragDiv=function(){
    if(!this.pieceDragDiv){
        this.pieceDragDiv=YAHOO.util.Dom.get("pieceDragDiv");
    }
    return this.pieceDragDiv;
};
Board.prototype.createBoardCoords=function(){
    this.coordinatesShown=false;
    var _2f3=YAHOO.util.Dom.get(this.boardName+"-fileLabels");
    var _2f4=YAHOO.util.Dom.get(this.boardName+"-rankLabels");
    if(!_2f3||!_2f4){
        return;
    }
    YAHOO.util.Event.purgeElement(_2f3,true);
    _2f4.innerHTML="";
    _2f3.innerHTML="";
    var _2f5=YAHOO.util.Dom.get(this.boardName+"-boardBorder");
    if(!this.showCoordinates){
        YAHOO.util.Dom.setStyle(_2f3,"display","none");
        YAHOO.util.Dom.setStyle(_2f4,"display","none");
        var _2f6=0;
        YAHOO.util.Dom.setStyle(_2f5,"width",(this.pieceSize*8+_2f6)+"px");
        YAHOO.util.Dom.setStyle(_2f5,"height",(this.pieceSize*8+_2f6)+"px");
        return;
    }
    YAHOO.util.Dom.setStyle(_2f3,"display","block");
    YAHOO.util.Dom.setStyle(_2f4,"display","block");
    var _2f6=15;
    var _2f7=0;
    if(check_bad_msie()){
        _2f7=this.ie6FixCoordsOffsetSize;
    }
    if(YAHOO.util.Event.isIE){
        _2f7+=this.allIeFixCoordsOffsetSize;
        if(document.compatMode!="CSS1Compat"){
            _2f7=8;
        }
    }
    YAHOO.util.Dom.setStyle(_2f5,"width",(this.pieceSize*8+_2f6+_2f7)+"px");
    YAHOO.util.Dom.setStyle(_2f5,"height",(this.pieceSize*8+_2f6)+"px");
    this.coordinatesShown=true;
    for(var i=0;i<8;i++){
        var _2f9=document.createElement("div");
        YAHOO.util.Dom.setStyle(_2f9,"height",this.pieceSize+"px");
        YAHOO.util.Dom.setStyle(_2f9,"width","15px");
        YAHOO.util.Dom.setStyle(_2f9,"text-align","center");
        YAHOO.util.Dom.setStyle(_2f9,"line-height",this.pieceSize+"px");
        if(this.isFlipped){
            _2f9.innerHTML=""+(i+1);
        }else{
            _2f9.innerHTML=""+9-(i+1);
        }
        _2f4.appendChild(_2f9);
    }
    for(var i=0;i<9;i++){
        var _2fa=document.createElement("span");
        YAHOO.util.Dom.setStyle(_2fa,"float","left");
        YAHOO.util.Dom.setStyle(_2fa,"height","15px");
        if(i==0){
            YAHOO.util.Dom.setStyle(_2fa,"width","15px");
            YAHOO.util.Dom.setStyle(_2fa,"clear","both");
            YAHOO.util.Dom.setStyle(_2fa,"margin-top","-5px");
            if(_2f7){
                YAHOO.util.Dom.setStyle(_2fa,"margin-left","-3px");
            }else{
                YAHOO.util.Dom.setStyle(_2fa,"margin-left","-2px");
            }
            var _2fb="";
            if(this.isFlipped){
                _2fb="whiteblack-flipper"+this.getVersString()+".png";
            }else{
                _2fb="blackwhite-flipper"+this.getVersString()+".png";
            }
            _2fa.innerHTML="<span><img id=\""+this.boardName+"-flipper\" title=\""+_js("Flip Board")+"\" src=\""+this.boardImagePath+"/images/"+_2fb+"\"/></span>";
            if(!this.disableFlipper){
                YAHOO.util.Event.addListener(this.boardName+"-flipper","click",this.flipBoard,this,true);
            }
        }else{
            YAHOO.util.Dom.setStyle(_2fa,"width",this.pieceSize+"px");
            YAHOO.util.Dom.setStyle(_2fa,"text-align","center");
            if(this.isFlipped){
                _2fa.innerHTML=_js(Move.columnToChar(8-(i)));
            }else{
                _2fa.innerHTML=_js(Move.columnToChar((i-1)));
            }
        }
        _2f3.appendChild(_2fa);
    }
    var _2fc=YAHOO.util.Dom.get(this.boardName+"-flipper");
    if(_2fc){
        fix_ie_png(_2fc);
    }
};

Board.prototype.showNavigation=function(){
    this.disableNavigation=false;
    YAHOO.util.Dom.setStyle(this.boardName+"-ct-nav-container","display","block");
};
Board.prototype.hideNavigation=function(){
    this.disableNavigation=true;
    YAHOO.util.Dom.setStyle(this.boardName+"-ct-nav-container","display","none");
};
Board.prototype.createBoardUI=function(){
    var _2fd=this.boardName+"-container";
    var _2fe=YAHOO.util.Dom.get(_2fd);
    if(_2fe==null){
        alert("Could not find board container:"+_2fd);
        return;
    }
    YAHOO.util.Dom.addClass(_2fe,"ct-board-container");
    this.boardDiv=null;
    var _2ff=document.createElement("div");
    _2ff.id=this.boardName+"-boardBorder";
    YAHOO.util.Dom.addClass(_2ff,"ct-board-border"+this.squareColorClass);
    var _300=0;
    if(this.showCoordinates){
        _300=15;
    }
    YAHOO.util.Dom.setStyle(_2ff,"width",(this.pieceSize*8+_300)+"px");
    YAHOO.util.Dom.setStyle(_2ff,"height",(this.pieceSize*8+_300)+"px");
    var _301=document.createElement("div");
    YAHOO.util.Dom.setStyle(_301,"float","left");
    _301.id=this.boardName+"-rankLabels";
    _2ff.appendChild(_301);
    var _302=document.createElement("div");
    YAHOO.util.Dom.addClass(_302,"ct-board");
    YAHOO.util.Dom.setStyle(_302,"width",(this.pieceSize*8)+"px");
    YAHOO.util.Dom.setStyle(_302,"height",(this.pieceSize*8)+"px");
    _302.id="ctb-"+this.boardName;
    var _303="ct-white-square"+this.squareColorClass;
    var _304="";
    var _305=[];
    for(var i=7;i>=0;i--){
        var s="<div>";
        for(var j=0;j<8;j++){
            var _309=document.createElement("div");
            var _30a=this.boardName+"-s"+j+""+i;
            var _30b=(((j+1)*(i+1))%19/19*100);
            var _30c=((65-((j+1)*(i+1)))%19/19*100);
            s+="<div id=\""+_30a+"\" class=\""+_303+"\" style=\"width:"+this.pieceSize+"px;height:"+this.pieceSize+"px;background-position:"+_30b+"% "+_30c+"%\"></div>";
            _305.push(_30a);
            _303=(_303=="ct-black-square"+this.squareColorClass)?"ct-white-square"+this.squareColorClass:"ct-black-square"+this.squareColorClass;
        }
        _303=(_303=="ct-black-square"+this.squareColorClass)?"ct-white-square"+this.squareColorClass:"ct-black-square"+this.squareColorClass;
        s+="</div>";
        _304+=s;
    }
    _302.innerHTML=_304;
    var _30d=document.createElement("div");
    _30d.id=this.boardName+"-fileLabels";
    _2ff.appendChild(_302);
    _2ff.appendChild(_30d);
    _2fe.appendChild(_2ff);
    if(this.showToMoveIndicators){
        var _30e=document.createElement("div");
        _30e.id=this.boardName+"-moveIndicators";
        YAHOO.util.Dom.addClass(_30e,"ct-move-indicators");
        _30e.innerHTML="<div class=\"ct-top-to-move-outer\" id=\""+this.boardName+"-top-to-move-outer\"><div  class=\"ct-top-to-move-inner\" id=\""+this.boardName+"-top-to-move-inner\"></div></div><div class=\"ct-bottom-to-move-outer\"  id=\""+this.boardName+"-bottom-to-move-outer\"><div class=\"ct-bottom-to-move-inner\" id=\""+this.boardName+"-bottom-to-move-inner\" ></div>";
        _2fe.appendChild(_30e);
        YAHOO.util.Dom.setStyle(_2ff,"float","left");
        YAHOO.util.Dom.setStyle(_30e,"float","left");
        YAHOO.util.Dom.setStyle(_30e,"margin-left","2px");
        YAHOO.util.Dom.setStyle(_30e,"height",((this.pieceSize*8)+2)+"px");
        YAHOO.util.Dom.setStyle(_30e,"position","relative");
        var _30f=document.createElement("div");
        YAHOO.util.Dom.setStyle(_30f,"clear","both");
        _2fe.appendChild(_30f);
    }
    this.createBoardCoords();
    var _310=false;
    var _311=YAHOO.util.Dom.get(this.boardName+"-ct-nav-container");
    if(!_311){
        _311=document.createElement("div");
    }else{
        _310=true;
        _311.innerHTML="";
    }
    _311.id=this.boardName+"-ct-nav-container";
    if(!this.dontOutputNavButtons||this.r){
        var _312="";
        if(!this.dontOutputNavButtons){
            if(!this.problem||!this.problem.isEndgame){
                _312="<span id=\"playStopSpan\"><img class=\"ct-end\" id=\""+this.boardName+"-end\" src=\""+this.boardImagePath+"/images/resultset_last"+this.getVersString()+".gif\" alt=\""+_js("End position")+"\" title=\""+_js("Go to final position")+"\"/>"+"<img class=\"ct-play\" id=\""+this.boardName+"-play\" src=\""+this.boardImagePath+"/images/control_play_blue"+this.getVersString()+".gif\" alt=\""+_js("Play moves")+"\" title=\""+_js("Play sequence of moves")+"\"/>"+"<img class=\"ct-stop\" id=\""+this.boardName+"-stop\" src=\""+this.boardImagePath+"/images/control_stop_blue"+this.getVersString()+".gif\" alt=\""+_js("Stop playing")+"\" title=\""+_js("Stop playing move sequence")+"\"/></span>";
            }
        }
        var _313="<div class=\"ct-nav-buttons\" id=\""+this.boardName+"-navButtons\"><span id=\""+this.boardName+"-nav-buttons-only\">";
        if(!this.dontOutputNavButtons){
            var size="";
            if(isIphone||isIpad){
                size=" width=\"50px\" height=\"34px\" ";
                _312="";
            }
            if(!(isIphone||isIpad)){
                _313+="<img class=\"ct-start\" id=\""+this.boardName+"-start\" src=\""+this.boardImagePath+"/images/resultset_first"+this.getVersString()+".gif\" alt=\""+_js("Start position")+"\" title=\""+_js("Go to starting position")+"\"/>";
            }
            _313+="<img class=\"ct-back\" id=\""+this.boardName+"-back\" "+size+" src=\""+this.boardImagePath+"/images/resultset_previous"+this.getVersString()+".gif\" alt=\""+_js("Previous Move")+"\" title=\""+_js("Go back a move")+"\"/>"+"<img class=\"ct-forward\" id=\""+this.boardName+"-forward\" "+size+" src=\""+this.boardImagePath+"/images/resultset_next"+this.getVersString()+".gif\" alt=\""+_js("Next Move")+"\" title=\""+_js("Go forward a move")+"\"/>"+_312;
        }
        if(this.r){
            _313+="<img class=\"ct-forward\" id=\""+this.boardName+"-analyse\" src=\""+this.boardImagePath+"/images/anboard"+this.getVersString()+".gif\" alt=\""+_js("Analyse")+"\" title=\""+_js("Launch analysis board to explore different lines in this position")+"\"/>";
            if(!this.g){
                _313+="<img class=\"ct-forward\" id=\""+this.boardName+"-showfen\" src=\""+this.boardImagePath+"/images/copy_fen"+this.getVersString()+".gif\" alt=\""+_js("Copy FEN")+"\" title=\""+_js("Show FEN for current position")+"\"/>";
            }
        }
        if(this.canPasteFen){
            _313+="<img class=\"ct-forward\" id=\""+this.boardName+"-pastefen\" src=\""+this.boardImagePath+"/images/paste_fen"+this.getVersString()+".gif\" alt=\""+_js("Input FEN")+"\" title=\""+_js("Setup position from user supplied FEN or move list")+"\"/>";
        }
        if(this.g2){
            _313+="<img class=\"ct-forward\" id=\""+this.boardName+"-playcomp\" src=\""+this.boardImagePath+"/images/computer"+this.getVersString()+".gif\" alt=\""+_js("Play Current Position vs Computer")+"\" title=\""+_js("Play current position against computer")+"\"/>";
        }
        _313+="</span>";
        _313+="</div>";
        if(this.puzzle){
            var _315="";
            var _316="";
            var _317="";
            var _318="";
            if(this.pieceSize>=29){
                _315=_js("Easy");
                _316=_js("Medium");
                _317=_js("Hard");
                _318=_js("Help");
            }else{
                _315=_js("D1");
                _316=_js("D2");
                _317=_js("D3");
                _318=_js("?");
            }
            _313+="<div><form action=\"\"><button type=\"button\" id=\""+this.boardName+"-puzzleSolution\" class=\"asolution-button\">"+_js("Show")+"</button><button id=\""+this.boardName+"-easyPuzzle\" type=\"button\" class=\"puzzle-difficulty\">"+_315+"</button>"+"<button id=\""+this.boardName+"-mediumPuzzle\" type=\"button\" class=\"puzzle-difficulty\">"+_316+"</button>"+"<button id=\""+this.boardName+"-hardPuzzle\" type=\"button\" class=\"puzzle-difficulty\">"+_317+"</button>"+"<button id=\""+this.boardName+"-puzzleHelp\" type=\"button\" class=\"puzzle-difficulty\">"+_318+"</button>"+"<img alt=\"\" class=\"ct-forward\" id=\""+this.boardName+"-problemState\"></img><span id=\""+this.boardName+"-puzzleResult\"></span></form></div>";
            _313+="<div class=\"initially_hidden initially_invisible\" id=\""+this.boardName+"-moves\"></div>";
            _313+="<div class=\"initially_hidden initially_invisible\" id=\""+this.boardName+"-moves\"></div>";
        }
        _311.innerHTML=_313;
    }
    if(!_310){
        _2fe.appendChild(_311);
    }
    if(this.problem){
        var body=YAHOO.util.Dom.get("body");
        if(body){
            YAHOO.util.Dom.setStyle(body,"min-width",((this.pieceSize*8+_300)+300+200+120)+"px");
        }
    }
};
Board.prototype.getPieceDiv=function(){
    var _31a=this.getBoardDiv();
    var _31b=document.createElement("div");
    this.availPieceDivs[this.uptoId]=_31b;
    this.availIds[this.uptoId]=YAHOO.util.Dom.generateId(_31b);
    YAHOO.util.Dom.setStyle(_31b,"visibility","hidden");
    YAHOO.util.Dom.addClass(_31b,"board-piece-start-style");
    _31a.appendChild(_31b);
    this.uptoId++;
    return _31b;
};
Board.prototype.flipToMove=function(_31c){
    return (_31c=="w")?"b":"w";
};
Board.prototype.pieceCharToPieceNum=function(_31d){
    var _31e;
    switch(_31d){
        case "K":
            _31e=ChessPiece.KING;
            break;
        case "Q":
            _31e=ChessPiece.QUEEN;
            break;
        case "R":
            _31e=ChessPiece.ROOK;
            break;
        case "B":
            _31e=ChessPiece.BISHOP;
            break;
        case "N":
            _31e=ChessPiece.KNIGHT;
            break;
        case "P":
            _31e=ChessPiece.PAWN;
            break;
    }
    return _31e;
};
Board.prototype.pieceTypeToChar=function(_31f){
    switch(_31f){
        case ChessPiece.KING:
            return "K";
        case ChessPiece.QUEEN:
            return "Q";
        case ChessPiece.ROOK:
            return "R";
        case ChessPiece.BISHOP:
            return "B";
        case ChessPiece.KNIGHT:
            return "N";
        case ChessPiece.PAWN:
            return "P";
    }
    return "?";
};
Board.prototype.canMoveKnight=function(_320,_321,_322,_323){
    if(_320+2==_322&&_321+1==_323){
        return true;
    }
    if(_320+2==_322&&_321-1==_323){
        return true;
    }
    if(_320-2==_322&&_321+1==_323){
        return true;
    }
    if(_320-2==_322&&_321-1==_323){
        return true;
    }
    if(_320+1==_322&&_321+2==_323){
        return true;
    }
    if(_320-1==_322&&_321+2==_323){
        return true;
    }
    if(_320+1==_322&&_321-2==_323){
        return true;
    }
    if(_320-1==_322&&_321-2==_323){
        return true;
    }
    return false;
};
Board.prototype.canMovePawn=function(_324,_325,_326,_327,_328){
    var _329=this.boardPieces[_326][_327];
    var _32a=this.boardPieces[_324][_325];
    if(_328){
        var _32b=this.boardPieces[_328.toColumn][_328.toRow];
        if(_32b&&_32b.piece==ChessPiece.PAWN){
            if(_32b.colour==ChessPiece.WHITE){
                if(_328.fromRow==1&&_328.toRow==3){
                    if(_326==_328.fromColumn&&_325==3&&_327==2&&(_324==_326+1||_324==_326-1)){
                        return true;
                    }
                }
            }else{
                if(_328.fromRow==6&&_328.toRow==4){
                    if(_326==_328.fromColumn&&_325==4&&_327==5&&(_324==_326+1||_324==_326-1)){
                        return true;
                    }
                }
            }
        }
    }
    if(_329){
        if(_32a.colour==ChessPiece.WHITE){
            if((_324==_326+1||_324==_326-1)&&(_325==_327-1)){
                return true;
            }
        }else{
            if((_324==_326+1||_324==_326-1)&&(_325==_327+1)){
                return true;
            }
        }
    }else{
        if(_324==_326){
            if(_32a.colour==ChessPiece.WHITE){
                if(_325==1){
                    if(_327==2){
                        return true;
                    }else{
                        if(_327==3&&this.boardPieces[_326][2]==null){
                            return true;
                        }
                    }
                }else{
                    if(_325+1==_327){
                        return true;
                    }
                }
            }else{
                if(_325==6){
                    if(_327==5){
                        return true;
                    }else{
                        if(_327==4&&this.boardPieces[_326][5]==null){
                            return true;
                        }
                    }
                }else{
                    if(_325-1==_327){
                        return true;
                    }
                }
            }
        }
    }
    return false;
};
Board.prototype.canMoveStraight=function(_32c,_32d,_32e,_32f,_330,_331){
    var _332=_32c;
    var _333=_32d;
    var _334=0;
    var _335=0;
    if(_32e>_32c){
        _334=1;
    }else{
        if(_32e<_32c){
            _334=-1;
        }
    }
    if(_32f>_32d){
        _335=1;
    }else{
        if(_32f<_32d){
            _335=-1;
        }
    }
    if(clog){
        console.log("deltaRow:"+_335+" deltaCol:"+_334+" fromCol:"+_32c+" fromRow:"+_32d+" toCol:"+_32e+" toRow:"+_32f);
    }
    if(_330==ChessPiece.ROOK&&(_334!=0&&_335!=0)){
        return false;
    }
    if(_330==ChessPiece.BISHOP&&(_334==0||_335==0)){
        return false;
    }
    var _336=0;
    while(true){
        _336++;
        _32c+=_334;
        _32d+=_335;
        if(_330==ChessPiece.KING&&_336>1){
            if(clog){
                console.log("king count:"+_336+" toCol:"+_32e+" toRow:"+_32f);
            }
            if(_336!=2){
                return false;
            }
            if(_335!=0){
                return false;
            }
            if(!(_32e==6||_32e==2)){
                return false;
            }
            if(_32e==2){
                if(this.boardPieces[1][_32d]||this.boardPieces[2][_32d]||this.boardPieces[3][_32d]){
                    return false;
                }
                if(!this.canCastleQueenSide[_331.colour]){
                    return false;
                }
            }else{
                if(_32e==6){
                    if(this.boardPieces[5][_32d]||this.boardPieces[6][_32d]){
                        if(clog){
                            console.log("king can't castle intervening piece");
                        }
                        return false;
                    }
                    if(!this.canCastleKingSide[_331.colour]){
                        if(clog){
                            console.log("king can't castle king side (made previously invalid) colour:"+_331.colour);
                        }
                        return false;
                    }
                }else{
                    if(clog){
                        console.log("king not in col 2 or 6");
                    }
                    return false;
                }
            }
            var _337="";
            _337+=Move.columnToChar(_332);
            _337+=String.fromCharCode("1".charCodeAt(0)+_333);
            _337+=Move.columnToChar((_332+_334));
            _337+=String.fromCharCode("1".charCodeAt(0)+(_333+_335));
            var move=this.createMoveFromString(_337);
            var _339=this.cloneBoard();
            _339.makeMove(move,_339.boardPieces[_332][_333],false,this.moveAnimationLength,false,false);
            kingSafe=_339.isKingSafe(_331.colour,move);
            if(clog){
                console.log("kingSafe1:"+kingSafe);
            }
            if(!kingSafe){
                return false;
            }
            var _337="";
            _337+=Move.columnToChar(_332);
            _337+=String.fromCharCode("1".charCodeAt(0)+_333);
            _337+=Move.columnToChar(_332);
            _337+=String.fromCharCode("1".charCodeAt(0)+_333);
            var move=this.createMoveFromString(_337);
            var _339=this.cloneBoard();
            _339.makeMove(move,_339.boardPieces[_332][_333],false,this.moveAnimationLength,false,false);
            kingSafe=_339.isKingSafe(_331.colour,move);
            var _339=this.cloneBoard();
            _339.makeMove(move,_339.boardPieces[_332][_333],false,this.moveAnimationLength,false,false);
            kingSafe=this.isKingSafe(_331.colour,move);
            if(clog){
                console.log("kingSafe2:"+kingSafe);
            }
            if(!kingSafe){
                return false;
            }
        }
        if(_32c==_32e&&_32d==_32f){
            return true;
        }
        if(_32c<0||_32c>7||_32d<0||_32d>7){
            return false;
        }
        if(this.boardPieces[_32c][_32d]!=null){
            return false;
        }
    }
};
Board.prototype.canMove=function(_33a,_33b,_33c,_33d,_33e){
    var _33f=_33a.column;
    var _340=_33a.row;
    if(_33b>7||_33b<0||_33c>7||_33c<0){
        if(clog){
            console.log("can't move coz out of bounds");
        }
        return false;
    }
    var _341=this.boardPieces[_33b][_33c];
    var _342=this.boardPieces[_33f][_340];
    if(_342==null){
        return false;
    }
    if(_341&&_341.colour==_342.colour){
        return false;
    }
    var _343=false;
    if(_33a.piece==ChessPiece.PAWN){
        _343=this.canMovePawn(_33f,_340,_33b,_33c,_33d);
    }else{
        if(_33a.piece==ChessPiece.KNIGHT){
            _343=this.canMoveKnight(_33f,_340,_33b,_33c);
        }else{
            _343=this.canMoveStraight(_33f,_340,_33b,_33c,_33a.piece,_33a);
        }
    }
    if(clog){
        console.log("moveOk:"+_343);
    }
    var _344=true;
    if(_343&&_33e){
        var _345="";
        _345+=Move.columnToChar(_33f);
        _345+=String.fromCharCode("1".charCodeAt(0)+_340);
        _345+=Move.columnToChar(_33b);
        _345+=String.fromCharCode("1".charCodeAt(0)+_33c);
        var move=this.createMoveFromString(_345);
        var _347=this.cloneBoard();
        _347.makeMove(move,_347.boardPieces[_33f][_340],false,this.moveAnimationLength,false,false);
        _344=_347.isKingSafe(_33a.colour,move);
    }
    return _343&&_344;
};
Board.prototype.is50MoveRule=function(){
    return (this.halfMoveNumber>=100);
};
Board.prototype.isCheckmate=function(_348){
    return (!this.isKingSafe(this.toMove,_348)&&this.isKingMated(this.toMove,_348));
};
Board.prototype.isStalemate=function(_349){
    return (this.isKingSafe(this.toMove,_349)&&(this.getCandidateMoves(this.toMove,_349,true)).length==0);
};
Board.prototype.isKingMated=function(_34a,_34b){
    var _34c=null;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var bp=this.boardPieces[i][j];
            if(bp!=null&&bp.piece==ChessPiece.KING&&bp.colour==_34a){
                _34c=bp;
                break;
            }
        }
    }
    var _350=[[1,0],[1,1],[1,-1],[-1,0],[-1,1],[-1,-1],[0,1],[0,-1],[2,0],[-2,0]];
    var bp=_34c;
    for(var k=0;k<_350.length;k++){
        if(this.canMove(bp,bp.column+_350[k][0],bp.row+_350[k][1],_34b,true)){
            return false;
        }
    }
    var _352=this.getCandidateMoves(_34a,_34b,true,true);
    if(_352.length>0){
        return false;
    }
    return true;
};
Board.prototype.getCandidateMoves=function(_353,_354,_355,_356){
    var _357=new Array();
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var bp=this.boardPieces[i][j];
            var _35b=[];
            if(!bp||bp.colour!=_353){
                continue;
            }
            switch(bp.piece){
                case ChessPiece.KING:
                    if(_356){
                        continue;
                    }
                    _35b=[[1,0],[1,1],[1,-1],[-1,0],[-1,1],[-1,-1],[0,1],[0,-1],[2,0],[-2,0]];
                    break;
                case ChessPiece.KNIGHT:
                    _35b=[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
                    break;
                case ChessPiece.BISHOP:
                    for(var k=0;k<8;k++){
                        _35b.push([1+k,1+k]);
                        _35b.push([1+k,-1-k]);
                        _35b.push([-1-k,1+k]);
                        _35b.push([-1-k,-1-k]);
                    }
                    break;
                case ChessPiece.QUEEN:
                    for(var k=0;k<8;k++){
                        _35b.push([1+k,0]);
                        _35b.push([1+k,1+k]);
                        _35b.push([1+k,-1-k]);
                        _35b.push([-1-k,0]);
                        _35b.push([-1-k,1+k]);
                        _35b.push([-1-k,-1-k]);
                        _35b.push([0,-1-k]);
                        _35b.push([0,1+k]);
                    }
                    break;
                case ChessPiece.ROOK:
                    for(var k=0;k<8;k++){
                        _35b.push([1+k,0]);
                        _35b.push([-1-k,0]);
                        _35b.push([0,-1-k]);
                        _35b.push([0,1+k]);
                    }
                    break;
                case ChessPiece.PAWN:
                    if(_353==ChessPiece.BLACK){
                        _35b=[[0,-1],[1,-1],[-1,-1]];
                        if(j==6){
                            _35b.push([0,-2]);
                        }
                    }else{
                        _35b=[[0,1],[1,1],[-1,1]];
                        if(j==1){
                            _35b.push([0,2]);
                        }
                    }
                    break;
            }
            for(var k=0;k<_35b.length;k++){
                if(this.canMove(bp,bp.column+_35b[k][0],bp.row+_35b[k][1],_354,true)){
                    _357.push(new Move(bp.column,bp.row,bp.column+_35b[k][0],bp.row+_35b[k][1]));
                    if(_355){
                        return _357;
                    }
                }
            }
        }
    }
    return _357;
};
Board.prototype.isKingSafe=function(_35d,_35e){
    var _35f=null;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var bp=this.boardPieces[i][j];
            if(bp!=null&&bp.piece==ChessPiece.KING&&bp.colour==_35d){
                _35f=bp;
                break;
            }
        }
    }
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var bp=this.boardPieces[i][j];
            if(bp!=null&&bp.colour!=_35d){
                if(this.canMove(bp,_35f.column,_35f.row,_35e,false)){
                    return false;
                }
            }
        }
    }
    return true;
};
Board.prototype.freeBoardPieces=function(_363){
    if(this.boardPieces){
        for(var i=0;i<8;i++){
            for(var j=0;j<8;j++){
                if(this.boardPieces[i][j]!=null){
                    this.boardPieces[i][j].free();
                    this.boardPieces[i][j]=null;
                }
            }
            if(_363){
                this.boardPieces[i]=null;
            }
        }
    }
    if(_363){
        this.boardPieces=null;
    }
};
Board.prototype.freeBoard=function(){
    this.freeBoardPieces(true);
    this.freeMoveArray();
};
Board.prototype.freeMoveArray=function(){
    if(this.moveArray){
        for(var i=0;i<this.moveArray.length;i++){
            var m=this.moveArray[i];
            if(m){
                m.freeMove();
                this.moveArray[i]=null;
            }
        }
    }
};
Board.prototype.cloneBoard=function(){
    var _368=new Board();
    _368.boardName=this.boardName;
    _368.cloned=true;
    _368.boardPieces=this.copyBoardPieces(true);
    _368.moveArray=this.copyMoveArray(false);
    _368.canCastleQueenSide=this.copyCastleQueenSide();
    _368.canCastleKingSide=this.copyCastleKingSide();
    _368.toMove=this.toMove;
    _368.restrictedColourMovement=-1;
    _368.opponentColour=this.opponentColour;
    _368.outputWithoutDisplay=this.outputWithoutDisplay;
    _368.isFlipped=this.isFlipped;
    _368.isUserFlipped=this.isUserFlipped;
    _368.ignoreFlipping=this.ignoreFlipping;
    _368.reverseFlip=this.reverseFlip;
    _368.moveAnimationLength=this.moveAnimationLength;
    _368.moveNumber=this.moveNumber;
    _368.halfMoveNumber=this.halfMoveNumber;
    _368.startFen=this.startFen;
    _368.boardImagePath=this.boardImagePath;
    _368.dontUpdatePositionReachedTable=this.dontUpdatePositionReachedTable;
    if(this.prev_move){
        _368.prev_move=this.prev_move.clone();
    }else{
        _368.prev_move=null;
    }
    return _368;
};
Board.prototype.copyCastleQueenSide=function(){
    return [this.canCastleQueenSide[0],this.canCastleQueenSide[1]];
};
Board.prototype.copyCastleKingSide=function(){
    return [this.canCastleKingSide[0],this.canCastleKingSide[1]];
};
Board.copyMoves=function(_369,_36a,_36b){
    var _36c=new Array();
    if(!_36a){
        if(_369&&_369.length>0){
            _36c=_369.slice(0);
        }
    }else{
        if(_369){
            for(var i=0;i<_369.length;i++){
                var m=_369[i];
                var newM=null;
                if(m){
                    newM=m.clone(true);
                }
                _36c[i]=newM;
            }
        }
    }
    if(_36b){
        for(var i=0;i<_369.length;i++){
            if(_369[i].prev){
                if(typeof _369[i].prev.index!="undefined"){
                    _36c[i].prev=_36c[_369[i].prev.index];
                }
            }
            if(_369[i].next){
                if(typeof _369[i].next.index!="undefined"){
                    _36c[i].next=_36c[_369[i].next.index];
                }
            }
        }
    }
    return _36c;
};
Board.prototype.copyMoveArray=function(_370){
    return Board.copyMoves(this.moveArray,_370);
    var _371=new Array();
    if(!_370){
        if(this.moveArray&&this.moveArray.length>0){
            _371=this.moveArray.slice(0);
        }
        return _371;
    }else{
        if(this.moveArray){
            for(var i=0;i<this.moveArray.length;i++){
                var m=this.moveArray[i];
                if(m){
                    var newM=m.clone(true);
                    _371[i]=newM;
                }
            }
        }
        return _371;
    }
};
Board.prototype.copyBoardPieces=function(_375){
    var _376=Board.createBoardArray();
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            if(this.boardPieces[i][j]!=null){
                if(_375){
                    _376[i][j]=this.boardPieces[i][j].makeLightWeight();
                }else{
                    _376[i][j]=this.boardPieces[i][j].copyPiece();
                }
            }else{
                _376[i][j]=null;
            }
        }
    }
    return _376;
};
Board.prototype.createPiece=function(_379,_37a,_37b){
    if(_37b){
        return new LightweightChessPiece(null,_379,_37a,this);
    }else{
        return new ChessPiece(this.getPieceDiv(),_379,_37a,this);
    }
};
Board.prototype.restoreCastling=function(_37c){
    this.canCastleKingSide=_37c.kingSide;
    this.canCastleQueenSide=_37c.queenSide;
};
Board.prototype.saveCastling=function(){
    var _37d=[this.canCastleQueenSide[0],this.canCastleQueenSide[1]];
    var _37e=[this.canCastleKingSide[0],this.canCastleKingSide[1]];
    return {queenSide:_37d,kingSide:_37e};
};
var firstLightProf=true;
var firstHeavyProf=true;
Board.prototype.setupFromFenLightweight=function(fen,_380,flip,_382,_383){
    var _384=false&&firstLightProf;
    if(_384){
        console.profile("setupFromFenLight");
    }
    this.setupFromFenGeneric(fen,_380,flip,true,_382,_383);
    if(_384){
        console.profileEnd();
    }
};
Board.prototype.setupFromFenHeavyWeight=function(fen,_386,flip,_388,_389){
    var _38a=false&&firstHeavyProf;
    if(_38a){
        console.profile("setupFromFenHeavy");
    }
    if(this.lastFromSquare){
        YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
    }
    if(this.lastToSquare){
        YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
    }
    this.setupFromFenGeneric(fen,_386,flip,false,_388,_389);
    if(_38a){
        console.profileEnd();
    }
};
Board.prototype.setupFromFen=function(fen,_38c,flip,_38e,_38f,_390){
    this.positionsSeen=[];
    if(_38e){
        this.setupFromFenLightweight(fen,_38c,flip,_38f,_390);
    }else{
        this.setupFromFenHeavyWeight(fen,_38c,flip,_38f,_390);
    }
};
Board.prototype.setupFromFenGeneric=function(fen,_392,flip,_394,_395,_396){
    if(ctime){
        console.time("setupFromFen"+_394);
    }
    if(this.oldSelectedSquare){
        YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
    }
    this.oldSelectedSquare=null;
    this.oldSelectedPiece=null;
    this.settingUpPosition=true;
    var _397=fen.split(" ");
    var _398=_397[0].split("/");
    this.halfMoveNumber=parseInt(_397[4]);
    this.moveNumber=parseInt(_397[5])*2;
    var _399=0;
    var row=8;
    this.uptoId=0;
    this.board_xy=null;
    var _39b=_397[2];
    var _39c=null;
    this.canCastleQueenSide=[false,false];
    this.canCastleKingSide=[false,false];
    if(_39b!="-"){
        if(_39b.indexOf("K")>=0){
            this.canCastleKingSide[ChessPiece.WHITE]=true;
        }
        if(_39b.indexOf("Q")>=0){
            this.canCastleQueenSide[ChessPiece.WHITE]=true;
        }
        if(_39b.indexOf("k")>=0){
            this.canCastleKingSide[ChessPiece.BLACK]=true;
        }
        if(_39b.indexOf("q")>=0){
            this.canCastleQueenSide[ChessPiece.BLACK]=true;
        }
    }
    if(_396){
        this.startMoveNum=this.moveNumber;
    }
    if(_397[1]=="w"){
        if(_396){
            this.startMoveNum--;
        }
        this.toMove=ChessPiece.WHITE;
        this.opponentColour=ChessPiece.WHITE;
        this.isFlipped=false;
        this.moveNumber--;
    }else{
        this.toMove=ChessPiece.BLACK;
        this.opponentColour=ChessPiece.BLACK;
        this.isFlipped=true;
    }
    if(_395){
        var _39d=_397[3];
        if(_39d!="-"&&_39d.length==2){
            var _39e=_39d[0];
            var _39f=parseInt(_39d[1]);
            if(_39f==3){
                _39c=this.createMoveFromString(_39e+"2"+_39e+"4");
            }else{
                _39c=this.createMoveFromString(_39e+"7"+_39e+"5");
            }
            _39c.prevMoveEnpassant=true;
            this.prev_move=_39c;
        }
    }
    if(_392){
        this.toMove=(ChessPiece.BLACK==this.toMove)?ChessPiece.WHITE:ChessPiece.BLACK;
        this.isFlipped=!this.isFlipped;
    }
    if(flip){
        this.isFlipped=true;
    }
    if(this.reverseFlip){
        this.isFlipped=!this.isFlipped;
    }
    if(this.ignoreFlipping){
        this.isFlipped=false;
    }
    if(this.isUserFlipped){
        this.isFlipped=!this.isFlipped;
    }
    this.updateToPlay();
    this.setupPieceDivs();
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            this.boardPieces[i][j]=null;
        }
    }
    for(var i=0;i<8;i++){
        var line=_398[i];
        row--;
        _399=0;
        for(var j=0;j<line.length;j++){
            var c=line.charAt(j);
            var code=line.charCodeAt(j);
            var num=code-"0".charCodeAt(0);
            if(num>0&&num<9){
                while(num--){
                    var _3a6=this.boardPieces[_399][row];
                    this.boardPieces[_399][row]=null;
                    _399++;
                }
            }else{
                var _3a7=(c+"").toLowerCase().charAt(0);
                var _3a8=ChessPiece.WHITE;
                if(_3a7==c){
                    _3a8=ChessPiece.BLACK;
                }
                var cp;
                switch(_3a7){
                    case "k":
                        cp=this.createPiece(_3a8,ChessPiece.KING,_394);
                        break;
                    case "q":
                        cp=this.createPiece(_3a8,ChessPiece.QUEEN,_394);
                        break;
                    case "r":
                        cp=this.createPiece(_3a8,ChessPiece.ROOK,_394);
                        break;
                    case "b":
                        cp=this.createPiece(_3a8,ChessPiece.BISHOP,_394);
                        break;
                    case "n":
                        cp=this.createPiece(_3a8,ChessPiece.KNIGHT,_394);
                        break;
                    case "p":
                        cp=this.createPiece(_3a8,ChessPiece.PAWN,_394);
                        break;
                    default:
                        alert("unknown piece letter:"+_3a7+" for fen:"+fen);
                }
                if(isGecko||isOpera){
                    cp.setPosition(_399,row,false,null,this.moveAnimationLength);
                    cp.setVisible(true);
                }
                this.boardPieces[_399][row]=cp;
                this.pieces[this.uptoPiece]=cp;
                this.pieces[this.uptoPiece].column=_399;
                this.pieces[this.uptoPiece].row=row;
                this.uptoPiece++;
                _399++;
            }
        }
    }
    if(!isGecko){
        for(var i=0;i<this.uptoPiece;i++){
            this.pieces[i].setPosition(this.pieces[i].column,this.pieces[i].row,false,null,0);
        }
    }
    if(!_394){
        for(var i=0;i<this.uptoPiece;i++){
            this.pieces[i].setVisible(true);
        }
    }
    if(!_394){
        this.createBoardCoords();
    }
    this.settingUpPosition=false;
    if(ctime){
        console.timeEnd("setupFromFen"+_394);
    }
};
Board.prototype.resetMoveListScrollPosition=function(){
    var _3aa=this.movesDisplay.getMovesDisplay();
    if(_3aa){
        var _3ab=new YAHOO.util.Scroll(_3aa,{scroll:{to:[0,0]}},0);
        _3ab.animate();
    }
};
Board.prototype.changePieceSet=function(_3ac,_3ad){
    if(!this.showedIE6Warning){
        var str=_js("Depending on your browser you may need to reload the<br/> page for piece size changes to properly take effect.");
        alert(str.replace("<br/>","\n"));
    }
    this.showedIE6Warning=true;
    if(check_bad_msie()){
        if(!this.showedIE6Warning){
            var str=_js("Internet Explorer version 6 does not support dynamic piece size changes.<br/> Please reload page to view new settings.");
            alert(str.replace("<br/>","\n"));
        }
        this.showedIE6Warning=true;
        return;
    }
    var _3af=this.pieceSize;
    this.pieceSet=_3ac;
    this.pieceSize=_3ad;
    var _3b0=YAHOO.util.Dom.get(this.boardName+"-boardBorder");
    var _3b1=0;
    if(this.showCoordinates){
        _3b1=15;
    }
    _3b0.className="";
    YAHOO.util.Dom.addClass(_3b0,"ct-board-border"+this.squareColorClass);
    YAHOO.util.Dom.setStyle(_3b0,"width",(this.pieceSize*8+_3b1)+"px");
    YAHOO.util.Dom.setStyle(_3b0,"height",(this.pieceSize*8+_3b1)+"px");
    var _3b2=YAHOO.util.Dom.get("ctb-"+this.boardName);
    YAHOO.util.Dom.setStyle(_3b2,"width",(this.pieceSize*8)+"px");
    YAHOO.util.Dom.setStyle(_3b2,"height",(this.pieceSize*8)+"px");
    var _3b3="ct-white-square"+this.squareColorClass;
    for(var i=7;i>=0;i--){
        for(var j=0;j<8;j++){
            var _3b6=this.getBoardDivFromId(this.boardName+"-s"+j+""+i);
            _3b6.className="";
            YAHOO.util.Dom.addClass(_3b6,_3b3);
            YAHOO.util.Dom.setStyle(_3b6,"width",this.pieceSize+"px");
            YAHOO.util.Dom.setStyle(_3b6,"height",this.pieceSize+"px");
            var _3b7=(((j+1)*(i+1))%19/19*100);
            var _3b8=((65-((j+1)*(i+1)))%19/19*100);
            YAHOO.util.Dom.setStyle(_3b6,"background-position",_3b7+"% "+_3b8+"%");
            _3b3=(_3b3=="ct-black-square"+this.squareColorClass)?"ct-white-square"+this.squareColorClass:"ct-black-square"+this.squareColorClass;
        }
        _3b3=(_3b3=="ct-black-square"+this.squareColorClass)?"ct-white-square"+this.squareColorClass:"ct-black-square"+this.squareColorClass;
    }
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var cp=this.boardPieces[i][j];
            if(cp){
                cp.icon=get_image_str(ChessPiece.pieceIconNames[cp.colour][cp.piece],cp.board.boardImagePath,cp.board.pieceSet,cp.board.pieceSize,cp.board.addVersion);
                if(YAHOO.util.Event.isIE||isOpera){
                    var _3ba=cp.div;
                    _3ba.innerHTML="<img src=\""+cp.icon+"\"/>";
                    var img=_3ba.firstChild;
                    if(!isOpera){
                        fix_ie_png(img);
                    }
                }else{
                    YAHOO.util.Dom.setStyle([cp.div],"backgroundImage","url("+cp.icon+")");
                    YAHOO.util.Dom.setStyle([cp.div],"background-repeat","no-repeat");
                }
                YAHOO.util.Dom.setStyle([cp.div],"height",this.pieceSize+"px");
                YAHOO.util.Dom.setStyle([cp.div],"width",this.pieceSize+"px");
                YAHOO.util.Dom.setStyle([cp.div],"left","");
                YAHOO.util.Dom.setStyle([cp.div],"top","");
                var xy=cp.getNewXYPosition(cp.column,cp.row);
                YAHOO.util.Dom.setXY(cp.div,xy,false);
            }
        }
    }
    if(this.moveArray){
        var move=this.moveArray[0];
        while(move!=null){
            if(move.taken){
                var cp=move.taken;
                if(cp.getNewXYPosition){
                    cp.icon=get_image_str(ChessPiece.pieceIconNames[cp.colour][cp.piece],cp.board.boardImagePath,cp.board.pieceSet,cp.board.pieceSize,cp.board.addVersion);
                    if(YAHOO.util.Event.isIE||isOpera){
                        var _3ba=cp.div;
                        _3ba.innerHTML="<img src=\""+cp.icon+"\"/>";
                        YAHOO.util.Dom.setStyle([cp.div],"position","relative");
                        var img=_3ba.firstChild;
                        if(!isOpera){
                            fix_ie_png(img);
                        }
                    }else{
                        YAHOO.util.Dom.setStyle([cp.div],"backgroundImage","url("+cp.icon+")");
                        YAHOO.util.Dom.setStyle([cp.div],"background-repeat","no-repeat");
                    }
                    YAHOO.util.Dom.setStyle([cp.div],"height",this.pieceSize+"px");
                    YAHOO.util.Dom.setStyle([cp.div],"width",this.pieceSize+"px");
                    YAHOO.util.Dom.setStyle([cp.div],"left","");
                    YAHOO.util.Dom.setStyle([cp.div],"top","");
                    var xy=cp.getNewXYPosition(cp.column,cp.row);
                    YAHOO.util.Dom.setXY(cp.div,xy,false);
                }
            }
            move=move.next;
        }
    }
    if(this.problem){
        var body=YAHOO.util.Dom.get("body");
        if(body){
            YAHOO.util.Dom.setStyle(body,"min-width",((this.pieceSize*8+_3b1)+300+200+120)+"px");
        }
    }
    this.createBoardCoords();
};
Board.prototype.forwardMove=function(e){
    if(this.disableNavigation){
        return;
    }
    if(this.blockFowardBack||this.deferredBlockForwardBack){
        if(clog){
            console.log("returning early from forward due to block forward on");
        }
        return;
    }
    var _3c0=false;
    if(this.tactics&&this.tactics.problemActive){
        if(clog){
            console.log("not forwarding, tactic is active");
        }
        return;
    }
    this.blockForwardBack=true;
    if(this.currentMove&&!this.currentMove.atEnd){
        move=this.currentMove;
        if(move){
            if(clog){
                console.log("forward move:"+move.output());
            }
        }else{
            if(clog){
                console.log("forward move with currentmove null");
            }
        }
        if(move.endNode){
            if(clog){
                console.log("calling processendgame from forward move");
            }
            if(!_3c0){
                this.problem.processEndgame("",true);
            }
            this.toggleToMove();
            this.updateToPlay();
        }else{
            if(clog){
                console.log("forwarding move:"+move.output());
            }
            var _3c1=null;
            piece=this.boardPieces[move.fromColumn][move.fromRow];
            if(move.promotion){
                _3c1=move.promotion;
                piece.prePromotionColumn=null;
                piece.prePromotionRow=null;
            }
            this.updatePiece(piece,move.toColumn,move.toRow,true,true,false,_3c1,true);
            this.toggleToMove();
            this.updateToPlay();
            var _3c2=this.currentMove;
            if(clog){
                if(_3c2){
                    console.log("after forward curmove:"+_3c2.output());
                }else{
                    console.log("after forward cur move null");
                }
            }
            for(var i=0;i<this.registeredForwardMovePostUpdateListeners.length;i++){
                var _3c4=this.registeredForwardMovePostUpdateListeners[i].forwardMovePostUpdateCallback(move);
            }
        }
    }else{
        if(clog){
            console.log("already at end");
        }
        for(var i=0;i<this.registeredForwardAtEndListeners.length;i++){
            var _3c4=this.registeredForwardAtEndListeners[i].forwardAtEndCallback();
        }
    }
    this.blockForwardBack=false;
};
Board.prototype.setupEventHandlers=function(){
    this.tlf=0;
    YAHOO.util.Event.addListener(document,"blur",this.lostFocus,this,true);
    if(!this.avoidMouseoverActive){
        YAHOO.util.Event.addListener(this.boardName+"-container","mouseover",function(e){
            activeBoard=this;
        },this,true);
    }
    if(true||this.clickAndClick){
        YAHOO.util.Event.addListener(this.boardName+"-container","click",this.selectDestSquare,this,true);
    }
    var _3c6="keydown";
    if(isGecko){
        _3c6="keypress";
    }
    YAHOO.util.Event.addListener(document,_3c6,function(e){
        var _3c8=(e.target)?e.target:e.srcElement;
        if(_3c8.form){
            return true;
        }
        var _3c9=_3c8.tagName.toLowerCase();
        switch(_3c9){
            case "input":
            case "textarea":
            case "select":
                return true;
        }
        if(activeBoard!=this){
            return true;
        }
        switch(YAHOO.util.Event.getCharCode(e)){
            case 37:
                this.backMove();
                break;
            case 39:
                this.forwardMove();
                break;
            case 32:
                var ret=this.spaceBar();
                if(!ret){
                    YAHOO.util.Event.preventDefault(e);
                }
                return ret;
                break;
            default:
        }
        return true;
    },this,true);

    /*
     YAHOO.util.Event.addListener(this.boardName+"-forward","click",this.forwardMove,this,true);
     YAHOO.util.Event.addListener(this.boardName+"-back","click",this.backMove,this,true);
     YAHOO.util.Event.addListener(this.boardName+"-start","click",this.gotoStart,this,true);
     YAHOO.util.Event.addListener(this.boardName+"-end","click",this.gotoEnd,this,true);
     YAHOO.util.Event.addListener(this.boardName+"-play","click",this.playMoves,this,true);
     YAHOO.util.Event.addListener(this.boardName+"-stop","click",this.stopPlayingMoves,this,true);
     */
    setTimeout(this.gotoEnd.bind(this), 500)

    if(this.r){
        YAHOO.util.Event.addListener(this.boardName+"-analyse","click",this.analysePosition,this,true);
        YAHOO.util.Event.addListener(this.boardName+"-showfen","click",this.showBoardFen,this,true);
    }
    if(this.canPasteFen){
        YAHOO.util.Event.addListener(this.boardName+"-pastefen","click",this.pasteFen,this,true);
    }
    if(this.g2){
        YAHOO.util.Event.addListener(this.boardName+"-playcomp","click",this.playComp,this,true);
    }
};
Board.prototype.addFlipListener=function(_3cb){
    this.registeredFlipListeners.push(_3cb);
};
Board.prototype.addSpaceListener=function(_3cc){
    this.registeredSpaceListeners.push(_3cc);
};
Board.prototype.flipBoard=function(){
    this.isUserFlipped=!this.isUserFlipped;
    this.isFlipped=!this.isFlipped;
    this.redrawBoard();
    this.updateToPlay();
    for(var i=0;i<this.registeredFlipListeners.length;i++){
        this.registeredFlipListeners[i].boardFlipped(this);
    }
};
Board.prototype.spaceBar=function(){
    var ret=true;
    for(var i=0;i<this.registeredSpaceListeners.length;i++){
        ret=this.registeredSpaceListeners[i].spacePressed(this);
    }
    return ret;
};
Board.prototype.lostFocus=function(){
    this.tlf++;
};
Board.prototype.redrawBoard=function(){
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var cp=this.boardPieces[i][j];
            if(cp){
                var xy=cp.getNewXYPosition(cp.column,cp.row);
                YAHOO.util.Dom.setXY(cp.div,xy,false);
            }
        }
    }
    if(this.moveArray){
        var move=this.moveArray[0];
        while(move!=null){
            if(move.taken){
                var cp=move.taken;
                if(cp.getNewXYPosition){
                    var xy=cp.getNewXYPosition(cp.column,cp.row);
                    YAHOO.util.Dom.setXY(cp.div,xy,false);
                }
            }
            move=move.next;
        }
    }
    this.createBoardCoords();
    if(this.oldSelectedSquare){
        YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
    }
    this.oldSelectedSquare=null;
    this.oldSelectedPiece=null;
    if(this.highlightFromTo){
        if(!this.isFlipped){
            var _3d5=YAHOO.util.Dom.get(this.boardName+"-s"+this.lastFromColumn+""+this.lastFromRow);
            var _3d6=YAHOO.util.Dom.get(this.boardName+"-s"+this.lastToColumn+""+this.lastToRow);
        }else{
            var _3d5=YAHOO.util.Dom.get(this.boardName+"-s"+(7-this.lastFromColumn)+""+(7-this.lastFromRow));
            var _3d6=YAHOO.util.Dom.get(this.boardName+"-s"+(7-this.lastToColumn)+""+(7-this.lastToRow));
        }
        this.updateFromTo(_3d5,_3d6,this.lastFromRow,this.lastFromColumn,this.lastToRow,this.lastToColumn);
    }
};
Board.prototype.getMaxMoveNumber=function(_3d7){
    var _3d8=this.getMaxPly(_3d7);
    if(_3d8>0){
        return parseInt((_3d8+1)/2);
    }else{
        return 0;
    }
};
Board.prototype.getMaxPly=function(_3d9){
    var mv=null;
    if(_3d9){
        if(this.currentMove){
            mv=this.currentMove;
            if(mv.atEnd){
                if(mv.prev){
                    return mv.prev.moveNum;
                }else{
                    return 0;
                }
            }
        }else{
            return 0;
        }
    }else{
        if(this.moveArray){
            mv=this.moveArray[0];
        }
    }
    if(!mv){
        return 0;
    }
    while(mv!=null){
        if(mv.atEnd){
            if(mv.prev){
                return mv.prev.moveNum;
            }else{
                return 0;
            }
        }
        mv=mv.next;
    }
    return 0;
};
Board.fenPositionOnly=function(fen){
    var _3dc=fen.split(" ");
    return _3dc[0]+" "+_3dc[1];
};
Board.fenStripMoveClock=function(fen){
    var _3de=fen.split(" ");
    return _3de[0]+" "+_3de[1]+" "+_3de[2]+" "+_3de[3];
};
Board.fenSamePosition=function(fen1,fen2,_3e1){
    if(!fen1||!fen2){
        return false;
    }
    var f1=null;
    var f2=null;
    if(_3e1){
        f1=Board.fenPositionOnly(fen1);
        f2=Board.fenPositionOnly(fen2);
    }else{
        f1=Board.fenStripMoveClock(fen1);
        f2=Board.fenStripMoveClock(fen2);
    }
    return (f1==f2);
};
Board.prototype.findFen=function(mv,brd,fen,_3e7){
    var res=this.findFen2(mv,brd,fen,true);
    if(res.move){
        return res.move;
    }else{
        if(_3e7){
            if(res.clockStrip){
                return res.clockStrip;
            }else{
                if(res.fullStrip){
                    return res.fullStrip;
                }
            }
        }
    }
    return null;
};
Board.prototype.findFen2=function(mv,brd,fen,_3ec){
    var _3ed=brd.cloneBoard();
    var res=Object();
    var _3ef=null;
    var _3f0=null;
    res.move=null;
    if(_3ec){
        _3ed.gotoMoveIndex(-1,true,true,true,true);
    }
    var _3f1=null;
    while(mv){
        var _3f2=_3ed.boardToFen();
        if(_3f2==fen){
            res.move=_3f1;
            res.clockStrip=null;
            res.fullStrip=null;
            return res;
        }else{
            if(Board.fenSamePosition(fen,_3f2)){
                _3ef=_3f1;
            }else{
                if(Board.fenSamePosition(fen,_3f2,true)){
                    _3f0=_3f1;
                }
            }
        }
        if(mv.atEnd){
            break;
        }
        if(mv.vars&&mv.vars.length>0){
            for(var i=0;i<mv.vars.length;i++){
                var _3f4=this.findFen2(mv.vars[i],_3ed,fen,false);
                if(_3f4){
                    if(_3f4.move){
                        return _3f4;
                    }else{
                        if(_3f4.clockStrip){
                            _3ef=_3f4.clockStrip;
                        }else{
                            if(_3f4.fullStrip){
                                _3f0=_3f4.fullStrip;
                            }
                        }
                    }
                }
            }
        }
        if(clog){
            console.log("about to make mv:"+mv.output()+" fen:"+_3ed.boardToFen());
        }
        _3ed.makeMove(mv,_3ed.boardPieces[mv.fromColumn][mv.fromRow],false,this.moveAnimationLength,false,false);
        if(clog){
            console.log("finished making mv");
        }
        _3f1=mv;
        mv=mv.next;
        if(clog){
            console.log("toMove:"+_3ed.toMove);
        }
        _3ed.setCurrentMove(mv);
        _3ed.toggleToMove();
    }
    if(_3ef){
        res.clockStrip=_3ef;
    }
    if(_3f0){
        res.fullStrip=_3f0;
    }
    return res;
};
Board.prototype.gotoFen=function(fen,_3f6){
    if(clog){
        console.log("about to find fen for:"+fen);
    }
    var _3f7=this.findFen(this.moveArray[0],this,fen,_3f6);
    if(_3f7){
        if(clog){
            console.log("found move:"+_3f7.output()+" for fen:"+fen);
        }
        this.gotoMoveIndex(_3f7.index);
    }else{
        if(clog){
            console.log("didn't find move for fen:"+fen);
        }
    }
};
Board.prototype.getMaxMoveIndex=function(){
    return this.moveArray.length-1;
};
Board.prototype.gotoMoveIndex=function(_3f8,_3f9,_3fa,_3fb,_3fc){
    if(clog){
        console.log("going to move index:"+_3f8);
    }
    var _3fd=!_3fa;
    if(!this.moveArray||this.moveArray.length<=_3f8||(_3f8==-1&&this.moveArray.length==0)){
        return;
    }
    var _3fe=this.boardName+"-piecestaken";
    var _3ff=YAHOO.util.Dom.get(_3fe);
    if(_3ff){
        _3ff.innerHTML="";
    }
    if(_3f8==-1){
        var flip=false;
        if(this.prev_move&&!this.prev_move.prevMoveEnpassant){
            flip=true;
        }
        this.setupFromFen(this.startFen,flip,false,_3fc);
        if(this.prev_move&&!this.prev_move.prevMoveEnpassant){
            this.makeMove(this.prev_move,this.boardPieces[this.prev_move.fromColumn][this.prev_move.fromRow],!_3fa,this.moveAnimationLength,true,true);
            this.updateToPlay();
        }
        if(this.moveArray&&this.moveArray.length>0){
            this.setCurrentMove(this.moveArray[0],_3f9);
        }else{
            this.setCurrentMove(this.firstMove,_3f9);
        }
        if(!_3f9){
            this.setForwardBack();
        }
        if(!_3fb){
            for(var i=0;i<this.registeredGotoMoveIndexListeners.length;i++){
                var _402=this.registeredGotoMoveIndexListeners[i].gotoMoveIndexCallback(_3f8);
            }
        }
        return;
    }
    var _403=new Array();
    var move=this.moveArray[_3f8];
    if(clog&&move){
        console.log("gotomoveindex move:"+move.output());
        if(move.next){
            console.log("gotomoveindex move.next:"+move.next.output());
        }
        if(move.prev){
            console.log("gotomoveindex move.prev:"+move.prev.output());
        }
    }
    var _405=0;
    if(move.next!=null){
        this.setCurrentMove(move.next,_3f9);
    }else{
        if(clog){
            console.log("move next null with move:"+move.output());
        }
    }
    while(move!=null&&!move.dummy){
        _403[_405++]=move;
        move=move.prev;
    }
    var flip=false;
    if(this.prev_move&&!this.prev_move.prevMoveEnpassant){
        flip=true;
    }
    this.setupFromFen(this.startFen,flip,false,true);
    if(this.prev_move&&!this.prev_move.prevMoveEnpassant){
        if(clog){
            console.log("gotomoveindex prev_move:"+this.prev_move.output());
        }
        this.makeMove(this.prev_move,this.boardPieces[this.prev_move.fromColumn][this.prev_move.fromRow],false,this.moveAnimationLength,true,true);
        this.updateToPlay();
    }
    for(var i=_405-1;i>=1;i--){
        var move=_403[i];
        this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],false,this.moveAnimationLength,true,false);
        this.toggleToMove();
    }
    if(!_3f9){
        this.convertPiecesFromLightWeight(_3f8);
    }
    var move=_403[0];
    this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],_3fd,this.moveAnimationLength,true,true);
    this.toggleToMove();
    this.updateToPlay();
    if(!_3f9){
        this.setForwardBack();
    }
    if(!_3fb){
        for(var i=0;i<this.registeredGotoMoveIndexListeners.length;i++){
            var _402=this.registeredGotoMoveIndexListeners[i].gotoMoveIndexCallback(_3f8);
        }
    }
};
Board.prototype.gotoStart=function(e){
    if(this.disableNavigation){
        return;
    }
    if(this.lastFromSquare){
        YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
    }
    if(this.lastToSquare){
        YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
    }
    this.gotoMoveIndex(-1);
    if(this.problem){
        if(this.currentMove&&this.currentMove.bestMoves){
            this.problem.showBestMoves(this.currentMove,this.currentMove.bestMoves,this.currentMove.correctMove,this.currentMove.wrongMove);
        }else{
            this.problem.clearBestMoves();
        }
    }
};
Board.prototype.gotoEnd=function(e){
    if(this.disableNavigation){
        return;
    }
    if(clog){
        console.log("goto end called");
    }
    if(this.tactics&&this.tactics.problemActive){
        this.tactics.autoForward=false;
        this.tactics.markProblem(false,false,"NULL","NULL");
    }
    if(clog){
        console.log("jumping to start");
    }
    this.gotoMoveIndex(-1,true,true,true);
    var _408=0;
    while(this.currentMove&&this.currentMove.next!=null){
        var move=this.currentMove;
        if(clog){
            console.log("going to end move:"+move.output());
        }
        this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],false,this.moveAnimationLength,true,true);
        _408=move.index;
        this.toggleToMove();
        this.setCurrentMove(move.next);
    }
    for(var i=0;i<this.registeredGotoMoveIndexListeners.length;i++){
        var _40b=this.registeredGotoMoveIndexListeners[i].gotoMoveIndexCallback(_408);
    }
};
Board.prototype.gotoPly=function(_40c,_40d){
    if(clog){
        console.log("goto ply called");
    }
    this.gotoMoveIndex(-1,true,true,true);
    var cnt=1;
    var _40f=0;
    while(cnt<=_40c&&this.currentMove&&this.currentMove.next!=null){
        var move=this.currentMove;
        if(clog){
            console.log("going to end move:"+move.output());
        }
        this.makeMove(move,this.boardPieces[move.fromColumn][move.fromRow],false,this.moveAnimationLength,true,true);
        _40f=move.index;
        this.toggleToMove();
        this.setCurrentMove(move.next);
        cnt++;
    }
    if(_40d){
        for(var i=0;i<this.registeredGotoMoveIndexListeners.length;i++){
            var _412=this.registeredGotoMoveIndexListeners[i].gotoMoveIndexCallback(_40f);
        }
    }
};
Board.prototype.playMove=function(self){
    if(!self.keepPlayingMoves||!self.currentMove||!self.currentMove.next){
        var play=YAHOO.util.Dom.get(this.boardName+"-play");
        play.src=this.boardImagePath+"/images/control_play_blue"+this.getVersString()+".gif";
        self.keepPlayingMoves=false;
        return;
    }
    self.forwardMove();
    setTimeout(function(){
        self.playMove(self);
    },self.pauseBetweenMoves);
};
Board.prototype.insertLineToMoveIndexPosition=function(_415,_416,_417,_418,_419){
    var _418=Board.copyMoves(_418,true,true);
    var mv=null;
    if(!this.moveArray||this.moveArray.length==0||this.moveArray[0]==null||this.moveArray[0].atEnd||_416==this.startFen){
        mv=null;
        if(clog){
            console.log("no moves or initial position, using first move");
        }
    }else{
        if(clog){
            console.log("calling find fen....");
        }
        if(_415>=0){
            mv=this.moveArray[_415];
        }
        if(!mv){
            mv=this.findFen(this.moveArray[0],this,_416,false);
        }
        if(clog){
            console.log("finished calling find fen");
        }
        if(!mv){
            return;
        }
    }
    var _41b=-1;
    if(this.currentMove){
        if(this.currentMove.prev){
            _41b=this.currentMove.prev.index;
        }
    }
    if(_417){
        _418[0].beforeComment=_417;
    }
    if(clog){
        if(mv){
            console.log("mv:"+mv.output()+" mv next:"+mv.next+" oldCurrentMoveIndex:"+_41b);
        }else{
            console.log("mv: null oldCurrentMoveIndex:"+_41b);
        }
    }
    var _41c=null;
    var _41d=null;
    if(mv&&mv.next&&!mv.next.atEnd){
        _41d=mv.next;
    }else{
        _41c=mv;
    }
    if(mv){
        this.gotoMoveIndex(mv.index);
    }else{
        if(this.moveArray&&this.moveArray.length>0){
            _41d=this.moveArray[0];
            if(_41d){
                if(clog){
                    console.log("variation parent from first move:"+_41d.output());
                }
                this.gotoMoveIndex(-1);
            }
        }else{
            this.currentMove=null;
        }
    }
    if(clog){
        if(this.currentMove){
            console.log("current move before insertline:"+this.currentMove.output());
        }else{
            console.log("no current move before insertline");
        }
    }
    if(clog){
        if(_41d){
            console.log("var parent:"+_41d.output());
        }else{
            console.log("var null");
        }
        if(_41c){
            console.log("move ins after:"+_41c.output());
        }else{
            console.log("moveinsafter null");
        }
    }
    this.insertMovesFromMoveList(_418[0],true,_41d,_41c,_419);
    if(clog){
        if(this.currentMove){
            console.log("current move after insertline:"+this.currentMove.output());
        }else{
            console.log("no current move after insertline");
        }
    }
    this.gotoMoveIndex(_41b);
};
Board.prototype.getVersString=function(){
    var _41e=".vers"+SITE_VERSION;
    if(!this.addVersion){
        _41e="";
    }
    return _41e;
};
Board.prototype.playMoves=function(e){
    if(this.disableNavigation){
        return;
    }
    this.keepPlayingMoves=true;
    var play=YAHOO.util.Dom.get(this.boardName+"-play");
    play.src=this.boardImagePath+"/images/disabled_control_play_blue"+this.getVersString()+".gif";
    this.playMove(this);
};
Board.prototype.stopPlayingMoves=function(e){
    this.keepPlayingMoves=false;
};
Board.prototype.pasteFen=function(e){
    for(var i=0;i<this.registeredPasteFenClickedListeners.length;i++){
        var _424=this.registeredPasteFenClickedListeners[i].pasteFenClickedCallback();
    }
};
Board.prototype.playComp=function(e){
    window.open("/play-computer/"+this.boardToFen());
};
Board.prototype.showBoardFen=function(e){
    var fen=this.boardToFen();
    var _428=new YAHOO.widget.SimpleDialog("fenDialog",{fixedcenter:false,visible:true,draggable:true,constraintoviewport:false,buttons:[{id:"linkbutton4",text:"Test"},{text:_js("Ok"),handler:function(){
        _428.hide();
    },isDefault:true}]});
    _428.setHeader(_js("Position FEN"));
    _428.setBody("<textarea class=\"showPgn\" id=\"fenText\" rows=\"1\" readonly=\"true\" cols=\""+(fen.length+9)+"\">"+fen+"</textarea>");
    _428.render(document.body);
    _428.setFooter("<span id=\"copyToComment\"></span><span id=\"fenok\"></span>");
    _428.center();
    var _429=this;
    if(this.problem&&this.problem.comments){
        var _42a=new YAHOO.widget.Button({type:"button",label:_js("Copy To Comment"),container:"fenok",onclick:{fn:function(){
            _429.copyFenToComment(fen,Board.COPY_COMMENT_PROBLEM);
            _428.hide();
        }}});
    }
    if(this.gameComments){
        var _42b=new YAHOO.widget.Button({type:"button",label:_js("Copy To Game Comment"),container:"fenok",onclick:{fn:function(){
            _429.copyFenToComment(fen,Board.COPY_COMMENT_GAME);
            _428.hide();
        }}});
    }
    if(this.playerComments){
        var _42c=new YAHOO.widget.Button({type:"button",label:_js("Copy To Player Comment"),container:"fenok",onclick:{fn:function(){
            _429.copyFenToComment(fen,Board.COPY_COMMENT_PLAYER);
            _428.hide();
        }}});
    }
    if(this.openingComments){
        var _42d=new YAHOO.widget.Button({type:"button",label:_js("Copy To Opening Comment"),container:"fenok",onclick:{fn:function(){
            _429.copyFenToComment(fen,Board.COPY_COMMENT_OPENING);
            _428.hide();
        }}});
    }
    var _42e=new YAHOO.widget.Button({type:"button",label:_js("Ok"),container:"fenok",onclick:{fn:function(){
        _428.hide();
    }}});
};
Board.prototype.copyFenToComment=function(fen,_430){
    switch(_430){
        case (Board.COPY_COMMENT_PROBLEM):
            if(this.problem){
                var flip=false;
                var col=fen.split(" ")[1];
                var col2=this.startFen.split(" ")[1];
                if(col==col2){
                    flip=true;
                }
                this.problem.comments.copyFenToComment(fen,flip);
            }
            break;
        case (Board.COPY_COMMENT_GAME):
            this.gameComments.copyFenToComment(fen);
            break;
        case (Board.COPY_COMMENT_PLAYER):
            this.playerComments.copyFenToComment(fen);
            break;
        case (Board.COPY_COMMENT_OPENING):
            this.openingComments.copyFenToComment(fen);
            break;
    }
};
Board.COPY_COMMENT_PROBLEM=0;
Board.COPY_COMMENT_PLAYER=1;
Board.COPY_COMMENT_GAME=2;
Board.COPY_COMMENT_OPENING=3;
Board.prototype.copyAnalysisToComment=function(_434,fen,flip,_437){
    switch(_437){
        case (Board.COPY_COMMENT_PROBLEM):
            if(this.problem){
                this.problem.comments.copyAnalysisToComment(_434,fen,flip);
            }
            break;
        case (Board.COPY_COMMENT_GAME):
            this.gameComments.copyAnalysisToComment(_434,fen,flip);
            break;
        case (Board.COPY_COMMENT_PLAYER):
            this.playerComments.copyAnalysisToComment(_434,fen,flip);
            break;
        case (Board.COPY_COMMENT_OPENING):
            this.openingComments.copyAnalysisToComment(_434,fen,flip);
            break;
    }
};
Board.squareColours=new Array(8);
var pCol=ChessPiece.BLACK;
for(var i=0;i<8;i++){
    Board.squareColours[i]=new Array(8);
    for(var j=0;j<8;j++){
        Board.squareColours[i][j]=pCol;
        pCol=Board.invertToMove(pCol);
    }
    pCol=Board.invertToMove(pCol);
}
Board.getSquareColour=function(i,j){
    return Board.squareColours[i][j];
};
Board.prototype.isInsufficientMaterial=function(_43a){
    var _43b=0;
    var _43c=0;
    var _43d=0;
    var _43e=0;
    var _43f=0;
    var _440=0;
    var _441=0;
    var _442=0;
    var _443=0;
    var _444=0;
    for(var i=0;i<8;i++){
        for(var j=0;j<8;j++){
            var p=this.boardPieces[i][j];
            if(p){
                if(p.piece==ChessPiece.PAWN){
                    if(p.colour==ChessPiece.WHITE){
                        _43b++;
                    }else{
                        _43c++;
                    }
                }else{
                    if(p.piece!=ChessPiece.KING){
                        if(p.colour==ChessPiece.WHITE){
                            _43d++;
                            if(p.piece==ChessPiece.KNIGHT){
                                _43f++;
                            }else{
                                if(p.piece==ChessPiece.BISHOP){
                                    if(Board.getSquareColour(i,j)==ChessPiece.WHITE){
                                        _441++;
                                    }else{
                                        _442++;
                                    }
                                }
                            }
                        }else{
                            _43e++;
                            if(p.piece==ChessPiece.KNIGHT){
                                _440++;
                            }else{
                                if(p.piece==ChessPiece.BISHOP){
                                    if(Board.getSquareColour(i,j)==ChessPiece.WHITE){
                                        _443++;
                                    }else{
                                        _444++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    function checkBothPieces(){
        if(_43b>0||_43c>0){
            return false;
        }
        if(_43d==_43e==0){
            return true;
        }else{
            if(_43d==_43f&&_43e==0){
                return true;
            }else{
                if(_43e==_440&&_43d==0){
                    return true;
                }else{
                    if(_43d==_441&&_43e==_443){
                        return true;
                    }else{
                        if(_43d==_442&&_43e==_444){
                            return true;
                        }else{
                            if(_43e==_443&&_43d==_441){
                                return true;
                            }else{
                                if(_43d==_444&&_43d==_442){
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    if(_43a==-1){
        return checkBothPieces();
    }else{
        if(_43a==ChessPiece.WHITE){
            if(checkBothPieces()){
                return true;
            }
            if(_43b==0&&_43d==0){
                return true;
            }else{
                if(_43d==_441&&_43e==_443){
                    return true;
                }else{
                    if(_43d==_442&&_43e==_444){
                        return true;
                    }else{
                        if(_43d==_43f&&(_43e==0&&_43c==0)){
                            return true;
                        }
                    }
                }
            }
            return false;
        }else{
            if(checkBothPieces()){
                return true;
            }
            if(_43c==0&&_43e==0){
                return true;
            }else{
                if(_43e==_443&&_43d==_441){
                    return true;
                }else{
                    if(_43e==_444&&_43d==_442){
                        return true;
                    }else{
                        if(_43e==_440&&(_43d==0&&_43b==0)){
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
};
Board.prototype.analysePosition=function(e){
    window.parentBoard=this;
    var _449=(this.pieceSize*8)+450+50;
    var _44a=(this.pieceSize*8)+250;
    var _44b=window.open("/windows/analyse.html",this.analysisWindowName,"width="+_449+",height="+_44a+",resizable=1,scrollbars=1,location=0,copyhistory=0,status=0,toolbar=0,menubar=0");
    _44b.focus();
};
Board.prototype.backMove=function(e){
    if(this.disableNavigation){
        return;
    }
    if(this.blockFowardBack||this.deferredBlockForwardBack){
        return;
    }
    var _44d=this.currentMove;
    if(this.tactics){
        if(this.tactics.problemActive){
            return;
        }
    }
    this.blockForwardBack=true;
    if(this.currentMove&&this.currentMove.prev!=null){
        YAHOO.util.Dom.removeClass(this.lastFromSquare,"ct-from-square");
        YAHOO.util.Dom.removeClass(this.lastToSquare,"ct-to-square");
        this.lastFromRow=null;
        if(this.oldSelectedSquare){
            YAHOO.util.Dom.removeClass(this.oldSelectedSquare,"ct-source-square");
        }
        this.oldSelectedSquare=null;
        this.oldSelectedPiece=null;
        var col=this.toMove;
        if(col==ChessPiece.WHITE){
            col=ChessPiece.BLACK;
        }else{
            col=ChessPiece.WHITE;
        }
        if(!this.dontUpdatePositionReachedTable){
            var _44f=this.boardToUniqueFen(col);
            if(this.positionsSeen[_44f]){
                this.positionsSeen[_44f]--;
            }
        }
        this.toggleToMove();
        this.updateToPlay();
        move=this.currentMove.prev;
        if(move){
            if(clog){
                console.log("backwards moving to prev move:"+move.output()+" from current move:"+this.currentMove.output());
            }
        }
        this.setCurrentMove(move);
        piece=this.boardPieces[move.toColumn][move.toRow];
        if(!piece){
            if(clog){
                console.log("got empty piece in backMove");
            }
        }
        takenPiece=move.taken;
        this.board_xy=null;
        piece.setPosition(move.fromColumn,move.fromRow,true,null,this.moveAnimationLength);
        this.boardPieces[move.fromColumn][move.fromRow]=piece;
        if(move.promotion){
            piece.changePiece("p");
        }
        piece.setVisible(true);
        this.canCastleQueenSide[0]=move.preCastleQueenSide[0];
        this.canCastleQueenSide[1]=move.preCastleQueenSide[1];
        this.canCastleKingSide[0]=move.preCastleKingSide[0];
        this.canCastleKingSide[1]=move.preCastleKingSide[1];
        this.halfMoveNumber=move.preHalfMoveNumber;
        var _450=false;
        if(piece.piece==ChessPiece.KING&&Math.abs(move.fromColumn-move.toColumn)>1){
            _450=true;
        }
        this.moveNumber--;
        if(this.moveNumber<=0){
            this.moveNumber=1;
        }
        if(takenPiece&&!_450){
            this.board_xy=null;
            var _451=move.toColumn;
            var _452=move.toRow;
            if(piece.piece==ChessPiece.PAWN&&move.fromColumn!=move.toColumn&&takenPiece.enPassant){
                _452=move.fromRow;
                this.boardPieces[move.toColumn][move.toRow]=null;
            }
            takenPiece.setPosition(_451,_452,false,null,this.moveAnimationLength);
            this.boardPieces[_451][_452]=takenPiece;
            move.taken=null;
            this.processTaken(takenPiece,false);
        }else{
            this.boardPieces[move.toColumn][move.toRow]=null;
        }
        if(_450){
            var _453=move.toRow;
            var _454;
            var _455;
            if(move.fromColumn>move.toColumn){
                _454=0;
                _455=3;
            }else{
                _454=7;
                _455=5;
            }
            var _456=this.boardPieces[_455][_453];
            _456.setPosition(_454,_453,true,null,this.moveAnimationLength);
            this.boardPieces[_454][_453]=_456;
            this.boardPieces[_455][_453]=null;
        }
        if(move!=null&&move.prev!=null&&move.prev.next!=move){
            move=move.prev.next;
            if(clog){
                if(move){
                    console.log("moving backwards out of variation moving to:"+move.output());
                }else{
                    console.log("jumping out of variation to null move");
                }
            }
        }
        for(var i=0;i<this.registeredBackMovePreCurrentListeners.length;i++){
            var _458=this.registeredBackMovePreCurrentListeners[i].backMovePreCurrentCallback(move,_44d);
        }
        this.setCurrentMove(move);
        this.setForwardBack();
    }
    this.blockForwardBack=false;
};
Board.prototype.getMovesToCurrent=function(){
    var mvs=[];
    var res=[];
    var mv=this.currentMove;
    if(!mv||!mv.prev){
        return res;
    }
    mv=mv.prev;
    while(mv){
        mvs.push(mv);
        mv=mv.prev;
    }
    for(var i=mvs.length-1;i>=0;i--){
        res.push(mvs[i].toMoveString());
    }
    return res;
};
Board.prototype.getAllMoves=function(){
    var mv=null;
    if(this.moveArray&&this.moveArray.length>0){
        mv=this.moveArray[0];
    }else{
        mv=this.firstMove;
    }
    if(!mv){
        return [];
    }
    var mvs=[];
    var res=[];
    while(mv&&!mv.atEnd){
        res.push(mv.toMoveString());
        mv=mv.next;
    }
    return res;
};
Board.prototype.countPly=function(){
    var mv=null;
    if(this.moveArray&&this.moveArray.length>0){
        mv=this.moveArray[0];
    }else{
        mv=this.firstMove;
    }
    var _461=0;
    while(mv&&!mv.atEnd){
        _461++;
        mv=mv.next;
    }
    return _461;
};
Board.prototype.processTaken=function(_462,_463){
    var _464=this.boardName+"-piecestaken";
    var _465=YAHOO.util.Dom.get(_464);
    if(_465){
        if(_463){
            var _466=get_image_str(ChessPiece.pieceIconNames[_462.colour][_462.piece],this.boardImagePath,this.pieceSet,this.pieceTakenSize,this.addVersion);
            _465.innerHTML=_465.innerHTML+"<img src=\""+_466+"\"/>";
        }else{
            var _467=_465.innerHTML.split("<");
            _465.innerHTML="";
            for(var i=1;i<_467.length-1;i++){
                _465.innerHTML=_465.innerHTML+"<"+_467[i];
            }
        }
    }
};
Pool=function(){
    this.pool=new Array();
    this.count=-1;
    this.numGot=0;
    this.numPut=0;
};
Pool.prototype.getObject=function(){
    var o=null;
    if(this.count>=0){
        this.numGot++;
        o=this.pool[this.count--];
    }
    return o;
};
Pool.prototype.putObject=function(o){
    if(o!=null){
        this.numPut++;
        this.pool[++this.count]=o;
    }
};
var boardPool=new Pool();
function touchHandler(_46b){
    if(_46b.changedTouches&&_46b.changedTouches.length>1){
        return;
    }
    _46b.preventDefault();
    var _46c=_46b.changedTouches,_46d=_46c[0],type="";
    switch(_46b.type){
        case "touchstart":
            type="mousedown";
            break;
        case "touchmove":
            type="mousemove";
            break;
        case "touchend":
            type="mouseup";
            break;
        default:
            return;
    }
    var _46f=document.createEvent("MouseEvents");
    _46f.initMouseEvent(type,true,true,window,1,_46d.screenX,_46d.screenY,_46d.clientX,_46d.clientY,false,false,false,false,0,null);
    _46d.target.dispatchEvent(_46f);
}
function initIphone(_470){
    _470.addEventListener("touchstart",touchHandler,true);
    _470.addEventListener("touchmove",touchHandler,true);
    _470.addEventListener("touchend",touchHandler,true);
    _470.addEventListener("touchcancel",touchHandler,true);
}
FenBoard=function(fen,_472){
    if(typeof _472.pieceSize=="undefined"){
        _472.pieceSize=24;
    }
    _472.fenBoard=true;
    _472.dontOutputNavButtons=true;
    _472.avoidMouseoverActive=true;
    this.chessapp=new ChessApp(_472);
    this.chessapp.init();
    this.chessapp.board.disableUpdateToPlay=true;
    this.chessapp.board.setupFromFen(fen,false,false,false);
    this.board=this.chessapp.board;
    this.board.startFen=fen;
};

