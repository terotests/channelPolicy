// The code template begins here
"use strict";

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
          return Object.prototype.toString.call(fn) == "[object Function]";
        };

        /**
         * @param float t
         */
        _myTrait_.isObject = function (t) {
          return t === Object(t);
        };
      })(this);

      (function (_myTrait_) {

        // Initialize static variables here...

        /**
         * @param Object clientState
         */
        _myTrait_.constructClientToServer = function (clientState) {
          var chData = clientState.data;

          if (!clientState.last_sent) {
            clientState.last_sent = [];
          }

          // last_update : [1, 30]
          var start = clientState.last_sent[1] || 0;
          var end = chData._journal.length;

          // last_update[]
          // clientState.last_update

          // problems here??
          if (clientState.last_update) {
            var fromServer = clientState.last_update[1] || 0;
            if (fromServer >= end) {
              return null;
            }
          }

          if (start == end) return null;

          console.log("clientToServer");
          console.log(clientState.last_update);
          console.log(start, end);

          // [2,4]
          // 0
          // 1
          // 2 *
          // 3 *

          clientState.last_sent[0] = start;
          clientState.last_sent[1] = end;

          var obj = {
            id: this.guid(),
            c: chData._journal.slice(start, end),
            start: start,
            end: end,
            version: clientState.version
          };

          if (clientState.client) {
            for (var i = 0; i < obj.c.length; i++) {
              var c = obj.c[i];
              obj.c[i] = clientState.client._transformCmdFromNs(c);
            }
          }
          return obj;
        };

        /**
         * @param Object serverState
         */
        _myTrait_.constructServerToClient = function (serverState) {

          var chData = serverState.data;

          if (!serverState.last_update) {
            serverState.last_update = [];
          }

          // last_update : [1, 30]
          var start = serverState.last_update[1] || 0;
          var end = chData._journal.length;

          if (start == end) return null;

          // [2,4]
          // 0
          // 1
          // 2 *
          // 3 *

          serverState.last_update[0] = start;
          serverState.last_update[1] = end;

          return {
            c: chData._journal.slice(start, end),
            start: start,
            end: end,
            version: serverState.version
          };
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

          if (!serverState._done) serverState._done = {};

          console.log("Processing client frame");
          console.log(JSON.stringify(clientFrame));

          try {

            if (!clientFrame.id) return;
            // if(!clientFrame.socket_id) return;
            if (serverState._done[clientFrame.id]) return res;

            serverState._done[clientFrame.id] = true;

            var chData = serverState.data; // the channel data object
            var errors = [];

            // now, it's simple, we just try to apply all the comands
            for (var i = 0; i < clientFrame.c.length; i++) {
              var c = clientFrame.c[i];
              var cmdRes = chData.execCmd(c);
              if (cmdRes !== true) {
                errors.push(cmdRes);
              }
            }

            var results = {
              errors: errors
            };
            console.log(JSON.stringify(results));

            return results;
          } catch (e) {
            // in this version, NO PROBLEMO!
            return e.message;
          }
        };

        /**
         * @param Object updateFrame  - request from server to client
         * @param float clientState  - This object holds the data the client needs to pefrform it&#39;s actions
         */
        _myTrait_.deltaServerToClient = function (updateFrame, clientState) {

          // the client state
          /*
          {
          data : channelData,     // The channel data object
          version : 1,
          last_update : [1, 30],  // last server update
          }
          */

          // the server sends
          /*
          {
          c : chData._journal.slice( start, end ),
          start : start,
          end : end,
          version : serverState.version
          }
          */
          // check where is our last point of action...

          var data = clientState.data; // the channel data we have now

          if (!clientState.last_update) {
            clientState.last_update = [];
          }
          // [2,4] = [start, end]
          // 0
          // 1
          // 2 *
          // 3 *

          var result = {
            goodCnt: 0,
            oldCnt: 0,
            newCnt: 0,
            reverseCnt: 0
          };

          console.log("deltaServerToClient");
          console.log(clientState.last_update);

          var sameUntil = updateFrame.start - 1;

          if (clientState.needsRefresh) return;

          if (updateFrame.start > data._journal.length) {
            clientState.needsRefresh = true;
            result.fail = true;
            return result;
          }

          if (clientState.client) {
            for (var i = updateFrame.start; i < updateFrame.end; i++) {
              var serverCmd = updateFrame.c[i - updateFrame.start];
              updateFrame.c[i - updateFrame.start] = clientState.client._transformCmdToNs(serverCmd);
            }
          }

          for (var i = updateFrame.start; i < updateFrame.end; i++) {

            var myJ = data.getJournalCmd(i);
            var serverCmd = updateFrame.c[i - updateFrame.start];

            var bSame = true;
            if (myJ) {
              for (var j = 0; j <= 4; j++) {
                if (myJ[j] != serverCmd[j]) {
                  bSame = false;
                  console.log("was not the same");
                  console.log(serverCmd[j], "vs", myJ[j]);
                }
              }
            } else {
              // a new command has arrived...

              var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
              if (cmdRes !== true) {
                // if we get errors then we have some kind of problem
                clientState.needsRefresh = true;
                result.fail = true;
                result.reason = cmdRes;
                return result;
              } else {
                sameUntil = i;
                result.goodCnt++;
                result.newCnt++;
              }

              continue;
            }
            if (bSame) {
              sameUntil = i;
              result.goodCnt++;
              result.oldCnt++;
            } else {
              // the sent commands did differ...

              // TODO: rollback
              data.reverseToLine(sameUntil);
              // and then run commands without sending them outside...
              for (var i = sameUntil + 1; i < updateFrame.end; i++) {

                var serverCmd = updateFrame.c[i - updateFrame.start];
                var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
                if (cmdRes !== true) {
                  // if we get errors then we have some kind of problem
                  clientState.needsRefresh = true;
                  result.fail = true;
                  result.reason = cmdRes;
                  return result;
                }
                result.reverseCnt++;
              }

              clientState.last_update[0] = updateFrame.start;
              clientState.last_update[1] = updateFrame.end;

              return result;
            }
          }
          clientState.last_update[0] = updateFrame.start;
          clientState.last_update[1] = updateFrame.end;
          return result;
        };
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
          if (typeof res == "function") {
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
          if (typeof m.init == "function") m.init.apply(m, args);
        }
      } else return new _chPolicy(a, b, c, d, e, f, g, h);
    };
    // inheritance is here

    _chPolicy._classInfo = {
      name: "_chPolicy"
    };
    _chPolicy.prototype = new _chPolicy_prototype();

    (function () {
      if (typeof define !== "undefined" && define !== null && define.amd != null) {
        __amdDefs__["_chPolicy"] = _chPolicy;
        this._chPolicy = _chPolicy;
      } else if (typeof module !== "undefined" && module !== null && module.exports != null) {
        module.exports["_chPolicy"] = _chPolicy;
      } else {
        this._chPolicy = _chPolicy;
      }
    }).call(new Function("return this")());

    (function (_myTrait_) {

      // Initialize static variables here...

      if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty("__traitInit")) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
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
        if (typeof res == "function") {
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
        if (typeof m.init == "function") m.init.apply(m, args);
      }
    } else return new channelPolicyModule(a, b, c, d, e, f, g, h);
  };
  // inheritance is here

  channelPolicyModule._classInfo = {
    name: "channelPolicyModule"
  };
  channelPolicyModule.prototype = new channelPolicyModule_prototype();

  if (typeof define !== "undefined" && define !== null && define.amd != null) {
    define(__amdDefs__);
  }
}).call(new Function("return this")());