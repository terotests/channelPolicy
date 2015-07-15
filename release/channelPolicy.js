// The code template begins here
'use strict';

(function () {

  var __amdDefs__ = {};

  // The class definition is here...
  var channelPolicyModule_prototype = function channelPolicyModule_prototype() {
    // Then create the traits and subclasses for this class here...

    // the subclass definition comes around here then

    // The class definition is here...
    var _chPolicy_prototype = function _chPolicy_prototype() {
      // Then create the traits and subclasses for this class here...

      // trait comes here...

      (function (_myTrait_) {

        // Initialize static variables here...

        /**
         * @param float t
         */
        _myTrait_.guid = function (t) {
          return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        };

        /**
         * @param float t
         */
        _myTrait_.isArray = function (t) {
          return t instanceof Array;
        };

        /**
         * @param float fn
         */
        _myTrait_.isFunction = function (fn) {
          return Object.prototype.toString.call(fn) == '[object Function]';
        };

        /**
         * @param float t
         */
        _myTrait_.isObject = function (t) {
          return t === Object(t);
        };
      })(this);

      (function (_myTrait_) {
        var _instanceCache;

        // Initialize static variables here...

        if (!_myTrait_.hasOwnProperty('__factoryClass')) _myTrait_.__factoryClass = [];
        _myTrait_.__factoryClass.push(function (id) {

          if (!_instanceCache) _instanceCache = {};

          if (_instanceCache[id]) return _instanceCache[id];

          _instanceCache[id] = this;
        });

        /**
         * @param Object serverState
         */
        _myTrait_.constructDeltaDelta = function (serverState) {

          var dd = {};

          var chData = serverState.data;

          // last_update : [1, 30]
          var start = serverState.last_update[1];
          var end = chData._journal.length;
          dd.c = chData._journal.slice(start, end);
          dd.start = start;
          dd.version = serverState.version;

          serverState.last_update[1] = end;

          return dd;
        };

        /**
         * @param Object clientFrame  - This is the clients changeFrame which should be applied to the servers internal state
         * @param Object serverState  - This object holds the data the server needs
         */
        _myTrait_.deltaClientToServer = function (clientFrame, serverState) {
          // the client frame
          /*
          {
          id          : "transaction ID",        // unique ID for transaction
          socket_id   : "socketid",              // added by the server
          v : 1,                          // main file + journal version
          lu : [1,10],                        // last update from server 0..N
          tl : 1,                          // transaction level
          c : [
                                    // list of channel commands to run
          ]
          }
          */
          // the server state structure
          /*
          {
          data : channelData,     // The channel data object
          version : 1,
          last_update : [1, 30],  // version + journal line
          lagging_sockets : {}    // hash of invalid sockets
          }
          */

          try {

            if (!clientFrame.id) return;
            if (!clientFrame.socket_id) return;
            if (this._done[clientFrame.id]) return res;

            this._done[clientFrame.id] = true;

            var chData = serverState.data; // the channel data object

            var client_version = clientFrame.lu[0],
                client_line = clientFrame.lu[1],
                server_lu_version = serverState.last_update[0],
                server_lu_line = serverState.last_update[1];

            // the client is lagging so badly, we mark down it must be sent a refresh request
            if (client_version != serverState.version || server_lu_version != client_version || client_verson < server_lu_version) {
              if (!serverState.lagging_sockets) serverState.lagging_sockets = {};
              serverState.lagging_sockets[clientFrame.socket_id] = true;
              return;
            }

            // now, it's simple, we just try to apply all the comands
            for (var i = 0; i < clientFrame.c.length; i++) {
              var c = clientFrame.c[i];
              chData.execCmd(c);
            }
          } catch (e) {}
        };

        /**
         * @param Object updateFrame  - request from server to client
         * @param float clientState  - This object holds the data the client needs to pefrform it&#39;s actions
         */
        _myTrait_.deltaServerToClient = function (updateFrame, clientState) {};

        if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
        if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
        _myTrait_.__traitInit.push(function (channelId, channelData) {

          this._channelId = channelId;
          this._channel = channelData;

          this._done = {};
        });
      })(this);
    };

    var _chPolicy = function _chPolicy(a, b, c, d, e, f, g, h) {
      var m = this,
          res;
      if (m instanceof _chPolicy) {
        var args = [a, b, c, d, e, f, g, h];
        if (m.__factoryClass) {
          m.__factoryClass.forEach(function (initF) {
            res = initF.apply(m, args);
          });
          if (typeof res == 'function') {
            if (res._classInfo.name != _chPolicy._classInfo.name) return new res(a, b, c, d, e, f, g, h);
          } else {
            if (res) return res;
          }
        }
        if (m.__traitInit) {
          m.__traitInit.forEach(function (initF) {
            initF.apply(m, args);
          });
        } else {
          if (typeof m.init == 'function') m.init.apply(m, args);
        }
      } else return new _chPolicy(a, b, c, d, e, f, g, h);
    };
    // inheritance is here

    _chPolicy._classInfo = {
      name: '_chPolicy'
    };
    _chPolicy.prototype = new _chPolicy_prototype();

    (function () {
      if (typeof define !== 'undefined' && define !== null && define.amd != null) {
        __amdDefs__['_chPolicy'] = _chPolicy;
        this._chPolicy = _chPolicy;
      } else if (typeof module !== 'undefined' && module !== null && module.exports != null) {
        module.exports['_chPolicy'] = _chPolicy;
      } else {
        this._chPolicy = _chPolicy;
      }
    }).call(new Function('return this')());

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
      if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
      _myTrait_.__traitInit.push(function (t) {});
    })(this);
  };

  var channelPolicyModule = function channelPolicyModule(a, b, c, d, e, f, g, h) {
    var m = this,
        res;
    if (m instanceof channelPolicyModule) {
      var args = [a, b, c, d, e, f, g, h];
      if (m.__factoryClass) {
        m.__factoryClass.forEach(function (initF) {
          res = initF.apply(m, args);
        });
        if (typeof res == 'function') {
          if (res._classInfo.name != channelPolicyModule._classInfo.name) return new res(a, b, c, d, e, f, g, h);
        } else {
          if (res) return res;
        }
      }
      if (m.__traitInit) {
        m.__traitInit.forEach(function (initF) {
          initF.apply(m, args);
        });
      } else {
        if (typeof m.init == 'function') m.init.apply(m, args);
      }
    } else return new channelPolicyModule(a, b, c, d, e, f, g, h);
  };
  // inheritance is here

  channelPolicyModule._classInfo = {
    name: 'channelPolicyModule'
  };
  channelPolicyModule.prototype = new channelPolicyModule_prototype();

  if (typeof define !== 'undefined' && define !== null && define.amd != null) {
    define(__amdDefs__);
  }
}).call(new Function('return this')());

// in this version, NO PROBLEMO!