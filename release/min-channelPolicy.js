(function(){var t={},n=function(){var n=function(){!function(t){t.guid=function(){return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)},t.isArray=function(t){return t instanceof Array},t.isFunction=function(t){return"[object Function]"==Object.prototype.toString.call(t)},t.isObject=function(t){return t===Object(t)}}(this),function(t){var n;t.hasOwnProperty("__factoryClass")||(t.__factoryClass=[]),t.__factoryClass.push(function(t){return n||(n={}),n[t]?n[t]:void(n[t]=this)}),t.constructDeltaDelta=function(t){var n={},i=t.data,e=t.last_update[1],r=i._journal.length;return n.c=i._journal.slice(e,r),n.start=e,n.version=t.version,t.last_update[1]=r,n},t.deltaClientToServer=function(t,n){try{if(!t.id)return;if(!t.socket_id)return;if(this._done[t.id])return res;this._done[t.id]=!0;{var i=n.data,e=t.lu[0],r=(t.lu[1],n.last_update[0]);n.last_update[1]}if(e!=n.version||r!=e||r>client_verson)return n.lagging_sockets||(n.lagging_sockets={}),void(n.lagging_sockets[t.socket_id]=!0);for(var a=0;a<t.c.length;a++){var o=t.c[a];i.execCmd(o)}}catch(c){}},t.deltaServerToClient=function(){},t.__traitInit&&!t.hasOwnProperty("__traitInit")&&(t.__traitInit=t.__traitInit.slice()),t.__traitInit||(t.__traitInit=[]),t.__traitInit.push(function(t,n){this._channelId=t,this._channel=n,this._done={}})}(this)},i=function(t,n,e,r,a,o,c,s){var f,u=this;if(!(u instanceof i))return new i(t,n,e,r,a,o,c,s);var _=[t,n,e,r,a,o,c,s];if(u.__factoryClass)if(u.__factoryClass.forEach(function(t){f=t.apply(u,_)}),"function"==typeof f){if(f._classInfo.name!=i._classInfo.name)return new f(t,n,e,r,a,o,c,s)}else if(f)return f;u.__traitInit?u.__traitInit.forEach(function(t){t.apply(u,_)}):"function"==typeof u.init&&u.init.apply(u,_)};i._classInfo={name:"_chPolicy"},i.prototype=new n,function(){"undefined"!=typeof define&&null!==define&&null!=define.amd?(t._chPolicy=i,this._chPolicy=i):"undefined"!=typeof module&&null!==module&&null!=module.exports?module.exports._chPolicy=i:this._chPolicy=i}.call(new Function("return this")()),function(t){t.__traitInit&&!t.hasOwnProperty("__traitInit")&&(t.__traitInit=t.__traitInit.slice()),t.__traitInit||(t.__traitInit=[]),t.__traitInit.push(function(){})}(this)},i=function(t,n,e,r,a,o,c,s){var f,u=this;if(!(u instanceof i))return new i(t,n,e,r,a,o,c,s);var _=[t,n,e,r,a,o,c,s];if(u.__factoryClass)if(u.__factoryClass.forEach(function(t){f=t.apply(u,_)}),"function"==typeof f){if(f._classInfo.name!=i._classInfo.name)return new f(t,n,e,r,a,o,c,s)}else if(f)return f;u.__traitInit?u.__traitInit.forEach(function(t){t.apply(u,_)}):"function"==typeof u.init&&u.init.apply(u,_)};i._classInfo={name:"channelPolicyModule"},i.prototype=new n,"undefined"!=typeof define&&null!==define&&null!=define.amd&&define(t)}).call(new Function("return this")());