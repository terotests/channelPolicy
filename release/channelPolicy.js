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
         * Pseudocode for the clients &quot;onUpdate&quot; - this is old version which had problems, but it had some problems.
         * @param float t
         */
        _myTrait_._pseudoClientOnUpdate = function (t) {

          var me = this,
              channelId = this._channelId;

          // These incoming commands are problematic now...
          socket.on('frame_' + channelId, function (cmd) {

            var frame = cmd.data;
            var chData = me._data;

            console.log('--- incoming to ' + socket.getEnum() + '--- ');
            console.log(JSON.stringify(cmd));

            // 1. check if we have not written anything to our change buffer, the easy case...
            var myLine = me._data.getJournalLine();
            if (myLine == frame.from) {
              console.log('--- incoming ok --- ');
              me._logJournal();
              frame.commands.forEach(function (cc) {
                if (me._data.execCmd(me._transformCmdToNs(cc, myNamespace))) {
                  me._currentFrame.from++;
                }
              });
              me._lastGoodIndex = me._data._journalPointer;
              me._logJournal();
              return; // easiest option
            } else {
              console.log('--- incoming had problems --- ');
              me._logJournal();
              // now the situation looks like this:

              // -- the from line is here ---
              // [our command]
              // [our command]
              // -> and the new change frame wants to add these to our journal
              // [frame command]
              // [frame command]       

              // the server is always right. we have to remove our commands from the
              // journal if we want to keep the sync with the current version
              // => the other option would be to create a new fork here, which requires
              // another command policy - TODO later this.

              // the commands have been applied to our UI using workers most likely and
              // if changes are not conflicting, we might be able to keep them, so we
              // collect the old commands to temporary list and see if they can be moved
              // to the end of the journal later on

              // first, check if there are pending frames, in this case we can no longer change the
              // outgoing data and it's going to fail on the server most likely, so just revert the
              // buffer and replace the situation with the server commands
              if (me._pendingFrames.length > 0) {

                console.log('--- there were pending frames --- ');

                // the pending frames have failed at least locally,
                // we don't know what the server thinks
                me._pendingFrames.forEach(function (f) {
                  f._didFail = true; // ??? is this used at all ???
                });

                chData.reverseToLine(frame.from); // last known common position
                for (var i = 0; i < frame.commands.length; i++) {
                  var cc = frame.commands[i];
                  if (me._data.execCmd(me._transformCmdToNs(cc, myNamespace))) {
                    okCnt++;
                  } else {
                    // a problem: something is totally out of order now, what do do?
                    console.error('syncing frames failed, buffer out of order');
                    console.error(JSON.stringify(cc));
                    console.error(chData._data.data[cc[1]]);
                    break;
                  }
                }
                me._lastGoodIndex = me._data._journalPointer;
                me._logJournal();
                console.log('--- done --- ');

                me._createTransaction(); // reset the current frame also
                return; //
              }

              // CASE: no request outside, try to fix the buffer.
              console.log('--- trying to run cmds  --- ');

              var rest = chData._journal.splice(frame.from, myLine - frame.from);
              var orig_pointer = chData._journalPointer;

              chData._journalPointer -= myLine - frame.from;

              // then we we execute the commands to the channelObject to see if there is conflict
              var okCnt = 0,
                  cLen = frame.commands.length,
                  bFail = false;
              for (var i = 0; i < cLen; i++) {
                var cc = frame.commands[i];
                if (me._data.execCmd(me._transformCmdToNs(cc, myNamespace))) {
                  okCnt++;
                } else {
                  // there is a conflict, we must revert
                  bFail = true;
                  break;
                }
              }

              if (!bFail) {
                // the commands were written OK, now add our own commands to the end
                // -- the from line is here ---
                // [frame command]
                // [frame command]             
                // [our command]       <--- now we move these back to the end
                // [our command]

                console.log('--- run was ok  --- ');

                // fix the current frame start index
                me._currentFrame.from = chData._journalPointer;

                // now the journal has our "unverified by server" commands at the end
                chData._journalPointer += rest.length;
                var i;
                while (i = rest.shift()) chData._journal.push(i);

                me._lastGoodIndex = me._data._journalPointer;
                me._logJournal();

                // the _currentFrame is now waiting to be sent and it does not have
                // data which was conflicting with the incoming frame we just received
                // to the locat channelObject, so there is a good possibility that
                // when the data is sent to the server, it will be accepted.
              } else {

                console.log('--- run failed  --- ');
                me._logJournal();
                // inserting the new data has failed, because we have conflicting changes locall

                console.log('OK cnt ' + okCnt);

                // first, undo the commands we tried to run
                me._data.undo(okCnt);

                // then restore the buffer we originally had.
                chData._journalPointer = orig_pointer;
                var rLen = rest.length;
                var i;
                while (i = rest.shift()) chData._journal.push(i);

                // and then, undo the local commands which were conflicting with the server changes
                chData.undo(rLen);

                // we should now have the situation server expects to find from the "from" index

                // try running the servers commands to the local channelObject
                bFail = false;
                for (var i = 0; i < cLen; i++) {
                  var cc = frame.commands[i];
                  if (me._data.execCmd(me._transformCmdToNs(cc, myNamespace))) {
                    okCnt++;
                  } else {
                    debugger;
                    // a problem: something is totally out of order now, what do do?
                    console.error('syncing frames failed, buffer out of order');
                    console.error(JSON.stringify(cc));
                    console.error(chData._data.data[cc[1]]);
                    break;
                  }
                }
                me._lastGoodIndex = me._data._journalPointer;
                me._logJournal();
                me._createTransaction(); // reset the current frame also
              }
            }
          });
        };

        /**
         * The pseudocode for the servers &quot;onFrame&quot; handler at the controller, which listens to sockets sending cmd of data
         * @param float t
         */
        _myTrait_._pseudoOnFrameServer = function (t) {

          // exectue the transaction manager action for the data...
          var res = me._tManager.execute(cmd.data);

          // if there was valid commands, write them to
          //  a) journal
          //  b) to other listeners of this channel

          if (res.validCnt > 0) {
            cmd.data.commands.length = res.validCnt;
            me._model.writeToJournal(cmd.data.commands).then(function (r) {
              socket.broadcast.to(cmd.channelId).emit('frame_' + cmd.channelId, cmd);
              result(res);
            });
          } else {
            result(res);
          }
        };

        /**
         * Pseudocode for the changeFrames &quot;execute&quot; which runs the changes against the channelObject
         * @param float t
         */
        _myTrait_._pseudoRunFrame = function (t) {
          // The result of the transaction
          var res = {
            id: changeFrame.id,
            from: changeFrame.from,
            result: false,
            rollBack: false,
            failed: []
          };

          if (!changeFrame.id) return res;

          if (this._done[changeFrame.id]) return res;

          this._done[changeFrame.id] = true;

          try {

            var line = this._channel.getJournalLine();
            if (changeFrame.from != line) {
              res.invalidStart = true;
              res.result = false;
              res.correctStart = changeFrame.from;
              res.correctLines = [];
              for (var i = changeFrame.from; i < line; i++) {
                res.correctLines.push(this._channel._journal[i]);
              }
              return res;
            }

            var okCnt = 0,
                failCnt = 0;
            // the list of commands
            for (var i = 0; i < changeFrame.commands.length; i++) {
              var c = changeFrame.commands[i];
              if (this._channel.execCmd(c)) {
                // the command was OK
                okCnt++;
              } else {
                // if command fails, ask the client to roll back
                if (changeFrame.fail_tolastok) {
                  //res.rollBack   = true;
                  res.validCnt = okCnt;
                  //res.rollBackTo = okCnt + res.from;

                  var line = this._channel.getJournalLine();
                  res.correctStart = changeFrame.from;
                  res.correctLines = [];
                  for (var i = changeFrame.from; i < line; i++) {
                    res.correctLines.push(this._channel._journal[i]);
                  }
                } else {
                  //res.rollBack   = true;
                  res.validCnt = 0;
                  //res.rollBackTo =  res.from;
                  this._channel.undo(okCnt); // UNDO all the commands

                  var line = this._channel.getJournalLine();
                  res.correctStart = changeFrame.from;
                  res.correctLines = [];
                  for (var i = changeFrame.from; i < line; i++) {
                    res.correctLines.push(this._channel._journal[i]);
                  }
                }
                return res;
              }
            }
            if (res.failed.length == 0) res.result = true;

            var line = this._channel.getJournalLine();
            res.correctStart = changeFrame.from;
            res.correctLines = [];
            for (var i = changeFrame.from; i < line; i++) {
              res.correctLines.push(this._channel._journal[i]);
            }

            res.validCnt = okCnt;
            return res;
          } catch (e) {
            res.result = false;
            return res;
          }
        };

        /**
         * @param Object changeFrame
         */
        _myTrait_.execute = function (changeFrame) {
          // The result of the transaction
          var res = {
            id: changeFrame.id,
            from: changeFrame.from,
            result: false,
            rollBack: false,
            failed: []
          };

          if (!changeFrame.id) return res;

          if (this._done[changeFrame.id]) return res;

          this._done[changeFrame.id] = true;

          try {

            var line = this._channel.getJournalLine();
            if (changeFrame.from != line) {
              res.invalidStart = true;
              res.result = false;
              res.correctStart = changeFrame.from;
              res.correctLines = [];
              for (var i = changeFrame.from; i < line; i++) {
                res.correctLines.push(this._channel._journal[i]);
              }
              return res;
            }

            var okCnt = 0,
                failCnt = 0;
            // the list of commands
            for (var i = 0; i < changeFrame.commands.length; i++) {
              var c = changeFrame.commands[i];
              if (this._channel.execCmd(c)) {
                // the command was OK
                okCnt++;
              } else {
                // if command fails, ask the client to roll back
                if (changeFrame.fail_tolastok) {
                  //res.rollBack   = true;
                  res.validCnt = okCnt;
                  //res.rollBackTo = okCnt + res.from;

                  var line = this._channel.getJournalLine();
                  res.correctStart = changeFrame.from;
                  res.correctLines = [];
                  for (var i = changeFrame.from; i < line; i++) {
                    res.correctLines.push(this._channel._journal[i]);
                  }
                } else {
                  //res.rollBack   = true;
                  res.validCnt = 0;
                  //res.rollBackTo =  res.from;
                  this._channel.undo(okCnt); // UNDO all the commands

                  var line = this._channel.getJournalLine();
                  res.correctStart = changeFrame.from;
                  res.correctLines = [];
                  for (var i = changeFrame.from; i < line; i++) {
                    res.correctLines.push(this._channel._journal[i]);
                  }
                }
                return res;
              }
            }
            if (res.failed.length == 0) res.result = true;

            var line = this._channel.getJournalLine();
            res.correctStart = changeFrame.from;
            res.correctLines = [];
            for (var i = changeFrame.from; i < line; i++) {
              res.correctLines.push(this._channel._journal[i]);
            }

            res.validCnt = okCnt;
            return res;
          } catch (e) {
            res.result = false;
            return res;
          }
        };

        if (_myTrait_.__traitInit && !_myTrait_.hasOwnProperty('__traitInit')) _myTrait_.__traitInit = _myTrait_.__traitInit.slice();
        if (!_myTrait_.__traitInit) _myTrait_.__traitInit = [];
        _myTrait_.__traitInit.push(function (channelId, channelData) {

          this._channelId = channelId;
          this._channel = channelData;

          this._done = {};
        });

        /**
         * a convenience / example method to help clients to roll the response back
         * @param Object channelData  - a _channelData -object to roll back
         * @param Object res  - The response from transaction
         */
        _myTrait_.rollBack = function (channelData, res) {
          if (channelData && res && res.rollBack) {
            // res.rollBackTo has the index to roll back to
            channelData.reverseToLine(res.rollBackTo);
          }
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