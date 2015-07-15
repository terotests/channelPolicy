
# Channel Policy - merging incoming data

The clients C1, C2 (...N)  and server C1 have main files &Omega;C1  &Omega;C2 and  &Omega;S1 which represent the object structure 

The client and server have journals, which construct of changes &Delta

The change object itself is a change command in form

```javascript
[4, "x", 100, 50, "objectID"]
```

Which would represent objects property "x" changing from 50 to 100.

The main file of the server and client &Omega; is something like this;

```javascript
{
  data : {
      x : 50
  },
   __id : "objectID"
}
```

After change &Delta; is applied to the main file, the object will be transformed into a new object.

```javascript
{
  data : {
      x : 100
  },
   __id : "objectID"
}
```

In the journal the first change is &Delta;[0] and range of changes &Delta;[0-10]

The rules of the changes are:

1. Clients are sending the &Delta;[n-m] changes to the server
2. When client makes a change it will immediately apply &Delta;[n-m] to it's own main &Omega;SN but it will keep track of where was the last good server change index.
3. IF server get's &Delta;[n-m] it will try to apply the change to &Omega;S1
4. The server will apply the valid &Delta;[n-m] to it's own &Omega;S1 and maintain the list of recent changes &DeltaS1[i-j]
5. Periodically the server will send the &Delta;S1[i-j] to all clients
6. If client gets &Delta;S1[i-j] from server, it must upgrade it's own status to correspond that change

The question here is now, if clients C1..CN are sending &Delta changes to the server in unspecified order

TODO: continue from here

```javascript

```



# Format of transaction 

Transaction object has following properties

1. `id` unique id UUID of the transaction
2. `version` indicates the main file version (currently not used)
3. `from` the line where the transaction starts, if lines are not matching, the transaction could still proceed, but for now it does not.
3. `fail_all` if set to true, all commands must succeed in order to transaction to complete
4. `fail_tolastok` if set to true, all successfull commands will be saved until first error
5. `commands` is array of [Channel Object commands](https://github.com/terotests/_channelObjects)

The `fail_all` is "all or nothing" -mode where all commands either fail or succeed.

The `fail_tolastok` is "go until failure" -mode where commands are processed until first error and client is asked to roll back to that situation.

```javascript
{
    id   : "transaction ID",        // unique ID for transaction
    version : 1,                    // channel version
    from : 10,                      // journal line to start the change
    to   : 20,                      // the last line ( optionsl, I guess )
    fail_all : false,               // fail all commands if failure
    fail_tolastok : true,           // fail until last ok command
    commands : [
                                    // list of channel commands to run
    ]
}
```

# Return values from transaction

## Success

The success object has

1. `result` is se to `true`
2. `validCnt` number of valid commands in the request frame


```javascript
{ "id":"transaction ID",
  "from":0,
  "result":true,        // <-- indicates the transaction was OK.
  "rollBack":false   
}
```

## Failure

The failure object has

1. `result` is se to `false`
2. `rollBack` can be true / false
3. `rollBackTo` indicates the journal line the client should rollback to
4. `validCnt` number of valid commands in the request frame


```javascript
{   "id":"transaction ID",
    "validCnt" : 2,         // number of valid commands
    "from":3,
    "result":false,
    "rollBack":true,
    "failed":[],
    "rollBackTo":3          // <- line the client should roll back to
}
```
















   

 


   
#### Class channelPolicyModule





   
    
    


   
      
            
#### Class _chPolicy


- [_classFactory](README.md#_chPolicy__classFactory)
- [_pseudoClientOnUpdate](README.md#_chPolicy__pseudoClientOnUpdate)
- [_pseudoOnFrameServer](README.md#_chPolicy__pseudoOnFrameServer)
- [_pseudoRunFrame](README.md#_chPolicy__pseudoRunFrame)
- [deltaClientToServer](README.md#_chPolicy_deltaClientToServer)
- [deltaServerToClient](README.md#_chPolicy_deltaServerToClient)
- [execute](README.md#_chPolicy_execute)
- [rollBack](README.md#_chPolicy_rollBack)



   
    
##### trait _dataTrait

- [guid](README.md#_dataTrait_guid)
- [isArray](README.md#_dataTrait_isArray)
- [isFunction](README.md#_dataTrait_isFunction)
- [isObject](README.md#_dataTrait_isObject)


    
    


   
      
    



      
    





   
# Class channelPolicyModule


The class has following internal singleton variables:
        
        
### channelPolicyModule::constructor( t )

```javascript

```
        


   
    
    


   
      
            
# Class _chPolicy


The class has following internal singleton variables:
        
* _instanceCache
        
        
### <a name="_chPolicy__classFactory"></a>_chPolicy::_classFactory(id)


```javascript

if(!_instanceCache) _instanceCache = {};

if(_instanceCache[id]) return _instanceCache[id];

_instanceCache[id] = this;
```

### <a name="_chPolicy__pseudoClientOnUpdate"></a>_chPolicy::_pseudoClientOnUpdate(t)

Pseudocode for the clients &quot;onUpdate&quot; - this is old version which had problems, but it had some problems.
```javascript

var me = this,
    channelId = this._channelId;


// These incoming commands are problematic now...
socket.on("frame_"+channelId, function(cmd) {

    var frame = cmd.data;
    var chData = me._data;
    
    console.log("--- incoming to "+socket.getEnum()+ "--- ");
    console.log(JSON.stringify( cmd ));
    
    // 1. check if we have not written anything to our change buffer, the easy case...
    var myLine = me._data.getJournalLine();
    if(myLine == frame.from) {
        console.log("--- incoming ok --- ");
        me._logJournal();
        frame.commands.forEach( function(cc) {
            if( me._data.execCmd(me._transformCmdToNs(cc, myNamespace)) ) {
                me._currentFrame.from++;
            }
        });
        me._lastGoodIndex = me._data._journalPointer;
        me._logJournal();
        return; // easiest option
    } else {
        console.log("--- incoming had problems --- ");
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
        if( me._pendingFrames.length > 0 ) {
            
            console.log("--- there were pending frames --- ");
            
            // the pending frames have failed at least locally,
            // we don't know what the server thinks
            me._pendingFrames.forEach( function(f) {
                f._didFail = true; // ??? is this used at all ???
            });
            
            chData.reverseToLine( frame.from ); // last known common position
            for(var i=0; i<frame.commands.length; i++) {
                var cc = frame.commands[i];
                if( me._data.execCmd(me._transformCmdToNs(cc, myNamespace)) ) {
                    okCnt++;
                } else {
                    // a problem: something is totally out of order now, what do do?
                    console.error("syncing frames failed, buffer out of order");
                    console.error(JSON.stringify(cc));
                    console.error(chData._data.data[cc[1]]);
                    break;
                }
            }  
            me._lastGoodIndex = me._data._journalPointer;
            me._logJournal();
            console.log("--- done --- ");
            
            me._createTransaction(); // reset the current frame also
            return; // 
        }
    
        // CASE: no request outside, try to fix the buffer.
        console.log("--- trying to run cmds  --- ");
        
        var rest = chData._journal.splice(frame.from, myLine - frame.from );
        var orig_pointer = chData._journalPointer;
        
        chData._journalPointer -= myLine - frame.from;    
        
        // then we we execute the commands to the channelObject to see if there is conflict
        var okCnt = 0, cLen = frame.commands.length, bFail = false;
        for(var i=0; i<cLen; i++) {
            var cc = frame.commands[i];
            if( me._data.execCmd(me._transformCmdToNs(cc, myNamespace)) ) {
                okCnt++;
            } else {
                // there is a conflict, we must revert
                bFail = true;
                break;
            }
        }
        
        if(!bFail) {
            // the commands were written OK, now add our own commands to the end
            // -- the from line is here ---
            // [frame command]
            // [frame command]              
            // [our command]       <--- now we move these back to the end
            // [our command]
            
            console.log("--- run was ok  --- ");
            
            // fix the current frame start index
            me._currentFrame.from = chData._journalPointer;
            
            // now the journal has our "unverified by server" commands at the end 
            chData._journalPointer += rest.length;
            var i;
            while( i = rest.shift() ) chData._journal.push( i );
            
            me._lastGoodIndex = me._data._journalPointer;
            me._logJournal();
            
            // the _currentFrame is now waiting to be sent and it does not have
            // data which was conflicting with the incoming frame we just received
            // to the locat channelObject, so there is a good possibility that
            // when the data is sent to the server, it will be accepted.

        } else {
            
            console.log("--- run failed  --- ");
            me._logJournal();
            // inserting the new data has failed, because we have conflicting changes locall
            
            console.log("OK cnt " + okCnt);
            
            // first, undo the commands we tried to run
            me._data.undo( okCnt ); 
            
            // then restore the buffer we originally had.
            chData._journalPointer = orig_pointer;
            var rLen = rest.length;
            var i;
            while( i = rest.shift() ) chData._journal.push( i );

            // and then, undo the local commands which were conflicting with the server changes
            chData.undo( rLen );
            
            // we should now have the situation server expects to find from the "from" index
            
            // try running the servers commands to the local channelObject
            bFail = false;
            for(var i=0; i<cLen; i++) {
                var cc = frame.commands[i];
                if( me._data.execCmd(me._transformCmdToNs(cc, myNamespace)) ) {
                    okCnt++;
                } else {
                    debugger;
                    // a problem: something is totally out of order now, what do do?
                    console.error("syncing frames failed, buffer out of order");
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
```

### <a name="_chPolicy__pseudoOnFrameServer"></a>_chPolicy::_pseudoOnFrameServer(t)

The pseudocode for the servers &quot;onFrame&quot; handler at the controller, which listens to sockets sending cmd of data
```javascript

// exectue the transaction manager action for the data...
var res = me._tManager.execute( cmd.data );

// if there was valid commands, write them to
//  a) journal
//  b) to other listeners of this channel


if(res.validCnt > 0 ) {
    cmd.data.commands.length = res.validCnt;
    me._model.writeToJournal( cmd.data.commands ).then( function(r) {
        socket.broadcast.to(cmd.channelId).emit("frame_"+cmd.channelId, cmd );
        result(res);
    });        
} else {
    result(res);
}
```

### <a name="_chPolicy__pseudoRunFrame"></a>_chPolicy::_pseudoRunFrame(t)

Pseudocode for the changeFrames &quot;execute&quot; which runs the changes against the channelObject
```javascript
// The result of the transaction
var res = {
    id : changeFrame.id,
    from : changeFrame.from,
    result : false, 
    rollBack : false,
    failed : []
};

if(!changeFrame.id) return res;

if(this._done[changeFrame.id]) return res;

this._done[changeFrame.id] = true;

try {

    var line = this._channel.getJournalLine();
    if(changeFrame.from != line) {
        res.invalidStart = true;
        res.result = false;
        res.correctStart = changeFrame.from;
        res.correctLines = [];
        for(var i=changeFrame.from; i<line; i++ ) {
            res.correctLines.push( this._channel._journal[i] );
        }
        return res;
    }
    
    var okCnt = 0, failCnt = 0;
    // the list of commands
    for(var i=0; i<changeFrame.commands.length; i++) {
        var c = changeFrame.commands[i];
        if(this._channel.execCmd(c)) {
            // the command was OK
            okCnt++;
        } else {
            // if command fails, ask the client to roll back 
            if(changeFrame.fail_tolastok) {
                //res.rollBack   = true;
                res.validCnt   = okCnt;
                //res.rollBackTo = okCnt + res.from;
                
                var line = this._channel.getJournalLine();
                res.correctStart = changeFrame.from;
                res.correctLines = [];
                for(var i=changeFrame.from; i<line; i++ ) {
                    res.correctLines.push( this._channel._journal[i] );
                }                
                
            } else {            
                //res.rollBack   = true;
                res.validCnt   = 0;
                //res.rollBackTo =  res.from;
                this._channel.undo( okCnt ); // UNDO all the commands
                
                var line = this._channel.getJournalLine();
                res.correctStart = changeFrame.from;
                res.correctLines = [];
                for(var i=changeFrame.from; i<line; i++ ) {
                    res.correctLines.push( this._channel._journal[i] );
                }                 
                
            }           
            return res;
        }
    }
    if( res.failed.length == 0 ) res.result = true;

    var line = this._channel.getJournalLine();
    res.correctStart = changeFrame.from;
    res.correctLines = [];
    for(var i=changeFrame.from; i<line; i++ ) {
        res.correctLines.push( this._channel._journal[i] );
    }      
    
    res.validCnt = okCnt;
    return res;
} catch(e) {
    res.result = false;
    return res;
}
```

### <a name="_chPolicy_deltaClientToServer"></a>_chPolicy::deltaClientToServer(clientFrame, serverState)
`clientFrame` This is the clients changeFrame which should be applied to the servers internal state
 
`serverState` This object holds the data the server needs
 


```javascript

```

### <a name="_chPolicy_deltaServerToClient"></a>_chPolicy::deltaServerToClient(updateFrame, clientState)
`updateFrame` request from server to client
 
`clientState` This object holds the data the client needs to pefrform it&#39;s actions
 


```javascript

```

### <a name="_chPolicy_execute"></a>_chPolicy::execute(changeFrame)


```javascript
// The result of the transaction
var res = {
    id : changeFrame.id,
    from : changeFrame.from,
    result : false, 
    rollBack : false,
    failed : []
};

if(!changeFrame.id) return res;

if(this._done[changeFrame.id]) return res;

this._done[changeFrame.id] = true;

try {

    var line = this._channel.getJournalLine();
    if(changeFrame.from != line) {
        res.invalidStart = true;
        res.result = false;
        res.correctStart = changeFrame.from;
        res.correctLines = [];
        for(var i=changeFrame.from; i<line; i++ ) {
            res.correctLines.push( this._channel._journal[i] );
        }
        return res;
    }
    
    var okCnt = 0, failCnt = 0;
    // the list of commands
    for(var i=0; i<changeFrame.commands.length; i++) {
        var c = changeFrame.commands[i];
        if(this._channel.execCmd(c)) {
            // the command was OK
            okCnt++;
        } else {
            // if command fails, ask the client to roll back 
            if(changeFrame.fail_tolastok) {
                //res.rollBack   = true;
                res.validCnt   = okCnt;
                //res.rollBackTo = okCnt + res.from;
                
                var line = this._channel.getJournalLine();
                res.correctStart = changeFrame.from;
                res.correctLines = [];
                for(var i=changeFrame.from; i<line; i++ ) {
                    res.correctLines.push( this._channel._journal[i] );
                }                
                
            } else {            
                //res.rollBack   = true;
                res.validCnt   = 0;
                //res.rollBackTo =  res.from;
                this._channel.undo( okCnt ); // UNDO all the commands
                
                var line = this._channel.getJournalLine();
                res.correctStart = changeFrame.from;
                res.correctLines = [];
                for(var i=changeFrame.from; i<line; i++ ) {
                    res.correctLines.push( this._channel._journal[i] );
                }                 
                
            }           
            return res;
        }
    }
    if( res.failed.length == 0 ) res.result = true;

    var line = this._channel.getJournalLine();
    res.correctStart = changeFrame.from;
    res.correctLines = [];
    for(var i=changeFrame.from; i<line; i++ ) {
        res.correctLines.push( this._channel._journal[i] );
    }      
    
    res.validCnt = okCnt;
    return res;
} catch(e) {
    res.result = false;
    return res;
}
```

### _chPolicy::constructor( channelId, channelData )

```javascript

this._channelId = channelId;
this._channel = channelData;

this._done = {};

```
        
### <a name="_chPolicy_rollBack"></a>_chPolicy::rollBack(channelData, res)
`channelData` a _channelData -object to roll back
 
`res` The response from transaction
 

a convenience / example method to help clients to roll the response back
```javascript
if( channelData && res && res.rollBack ) {
    // res.rollBackTo has the index to roll back to
    channelData.reverseToLine( res.rollBackTo  );
}

```



   
    
## trait _dataTrait

The class has following internal singleton variables:
        
        
### <a name="_dataTrait_guid"></a>_dataTrait::guid(t)


```javascript
return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

```

### <a name="_dataTrait_isArray"></a>_dataTrait::isArray(t)


```javascript
return t instanceof Array;
```

### <a name="_dataTrait_isFunction"></a>_dataTrait::isFunction(fn)


```javascript
return Object.prototype.toString.call(fn) == '[object Function]';
```

### <a name="_dataTrait_isObject"></a>_dataTrait::isObject(t)


```javascript
return t === Object(t);
```


    
    


   
      
    



      
    




