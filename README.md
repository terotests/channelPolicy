
# Channel Policy - merging incoming data

The purpose of Channel Policy is to keep the main file &Omega; in sync between clients and server

```javascript
{
  data : {
      x : 50
  },
   __id : "objectID"
}
```

The client and server have journals, which construct of changes &Delta;

The change object itself is a change command in form

```javascript
[4, "x", 100, 50, "objectID"]
```

Which would represent objects property "x" changing from 50 to 100.



After change &Delta; is applied to the main file, the object will be transformed into a new object.

```javascript
{
  data : {
      x : 100
  },
   __id : "objectID"
}
```

In the journal the first change is &Delta;[0] and range of changes like &Delta;[32-34]. For example:

```javascript
[4, "x", 100, 50,  "objectID"]  // &Delta;[32]
[4, "y", 210, 180, "objectID"]  // &Delta;[33]
[4, "z", 170, 150, "objectID"]  // &Delta;[34]
```

The change request packet is actually a bit more complex, it will be something like this;

```javascript
{
    id          : "transaction ID",     // unique ID for transaction
    socket_id   : "socketid",           // added by the server
    v : 1,                              // main file + journal version
    lu : [1,32],                        // version + journal line of last server update
    tl : 1,                             // transaction level
    c : [
        [4, "x", 100, 50,  "objectID"]
        [4, "y", 210, 180, "objectID"]
        [4, "z", 170, 150, "objectID"]                                       
    ]
}
```

The server is not really too interested about the metadata client sends. The server is just trying to apply the changes the
client sends then at some point create an update to all clients of the changed state. This update will be referred as &Delta;&Delta;.


The flow of the data is something like thiss

1. When client makes a change it will immediately apply &Delta; into it's own main &Omega; 
2. Then client sends it's latest &Delta; to the server
3. When server get's &Delta; it will try to apply the change to it's own &Omega;
4. Periodically the server sends all new journal lines it has accepted to all clients, the  &Delta;&Delta; to all clients - **this is the moment when things start usually go wrong** before this clients have been happily making their own changes without knowing about the changes other clients have done to their own main files.
5. **All clients are listening for &Delta;&Delta;** - when a client gets &Delta;&Delta; from server, it must update it's own state to correspond those changes **easy to say**

The purpose of the `channelPolicy` is to be able to determine and test those change policies and what kind of results they will create if applied in certain order.

TODO: continue from here

```javascript

```

## TL;RD;

Clients are sending changes to server - server merges them into one datastructure and sends periodicallly the changes to the real version back to the client. The clients then try to fix their data to correspond the changes.



# Clients &Delta; package format

Transaction object has following properties

1. `id` unique id UUID of the transaction
2. `v` indicates the main file version (currently not used)
3. `lu` the last server update version + line number.
3. `tl`transaction level
4. `c` commands, Array of [Channel Object commands](https://github.com/terotests/_channelObjects)


```javascript
{
    id   : "transaction ID",        // unique ID for transaction
    v : 1,                          // main file + journal version
    lu : [1,10],                        // last update from server 0..N
    tl : 1,                          // transaction level
    c : [
                                    // list of channel commands to run
    ]
}
```
# Servers to Client = &Delta;&Delta; package format

```javascript
{
    c : [ ... ], // list of commands
    start : start,
    end : end,
    version : serverState.version
}
```


# What next?

The challenge is to apply &Delta;&Delta; packages so the local changes with mimimum effort. With minimum effort the goal is:

1. Do not create extra events if you need to rollback and re-apply changes
2. This means that output events to workers by channelObject must be collected first to event stream
3. The channel object should have en easy-to-use comparision function

The bonus with the event stream out from the channelObject might be that Event Streams / Rx functionailty might be easy to add to the event value streams in a defined way. Normally the streams are data-agnostic, they only move values, which means that they can not automatically optimize changes. Event streams coming from the &Delta; changes can be automatically compressed and buffered, because the semantics of the changes is well known ahead. The changes can also be more complex than just value -based.























   

 


   
#### Class channelPolicyModule





   
    
    


   
      
            
#### Class _chPolicy


- [constructClientToServer](README.md#_chPolicy_constructClientToServer)
- [constructServerToClient](README.md#_chPolicy_constructServerToClient)
- [deltaClientToServer](README.md#_chPolicy_deltaClientToServer)
- [deltaServerToClient](README.md#_chPolicy_deltaServerToClient)



   
    
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
        
        
### <a name="_chPolicy_constructClientToServer"></a>_chPolicy::constructClientToServer(clientState)


```javascript
var chData = clientState.data;

if(!clientState.last_sent) {
    clientState.last_sent = [];
}


// last_update : [1, 30]
var start = clientState.last_sent[1] || 0;
var end = chData._journal.length;

if( start == end ) return null;

// [2,4]
// 0 
// 1
// 2 *
// 3 *

clientState.last_sent[0] = start;
clientState.last_sent[1] = end;

var obj = {
    id : this.guid(),
    c : chData._journal.slice( start, end ),
    start : start,
    end : end,
    version : clientState.version
};

if(clientState.client) {
    for(var i=0; i<obj.c.length;i++) {
        var c = obj.c[i];
        obj.c[i] = clientState.client._transformCmdFromNs( c );
    }
}
return obj;

```

### <a name="_chPolicy_constructServerToClient"></a>_chPolicy::constructServerToClient(serverState)


```javascript

var chData = serverState.data;

if(!serverState.last_update) {
    serverState.last_update = [];
}

// last_update : [1, 30]
var start = serverState.last_update[1] || 0;
var end = chData._journal.length;

if( start == end ) return null;

// [2,4]
// 0 
// 1
// 2 *
// 3 *

serverState.last_update[0] = start;
serverState.last_update[1] = end;

return {
    c : chData._journal.slice( start, end ),
    start : start,
    end : end,
    version : serverState.version
};



```

### <a name="_chPolicy_deltaClientToServer"></a>_chPolicy::deltaClientToServer(clientFrame, serverState)
`clientFrame` This is the clients changeFrame which should be applied to the servers internal state
 
`serverState` This object holds the data the server needs
 


```javascript
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

if(!serverState._done) serverState._done = {};

try {
        
    if(!clientFrame.id) return;
    // if(!clientFrame.socket_id) return;
    if(serverState._done[clientFrame.id]) return res;
    
    serverState._done[clientFrame.id] = true;    
    
    var chData = serverState.data; // the channel data object
    var errors = [];

    // now, it's simple, we just try to apply all the comands
    for(var i=0; i<clientFrame.c.length; i++) {
        var c = clientFrame.c[i];
        var cmdRes = chData.execCmd(c);
        if( cmdRes !== true ) {
            errors.push( cmdRes );
        }
    }
    
    return {
        errors : errors
    };

} catch(e) {
    // in this version, NO PROBLEMO!
    return e.message;
}



```

### <a name="_chPolicy_deltaServerToClient"></a>_chPolicy::deltaServerToClient(updateFrame, clientState)
`updateFrame` request from server to client
 
`clientState` This object holds the data the client needs to pefrform it&#39;s actions
 


```javascript

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

if(!clientState.last_update) {
    clientState.last_update = [];
}
// [2,4] = [start, end]
// 0 
// 1
// 2 *
// 3 *

var result = {
    goodCnt : 0,
    oldCnt : 0,
    newCnt : 0,
    reverseCnt : 0
};

var sameUntil = updateFrame.start-1;

if(clientState.needsRefresh) return;

if(updateFrame.start > data._journal.length ) {
    clientState.needsRefresh = true;
    result.fail = true;
    return result;
}

if(clientState.client) {
    for(var i=updateFrame.start; i<updateFrame.end; i++) {
        var serverCmd = updateFrame.c[i-updateFrame.start];
        updateFrame.c[i-updateFrame.start] = clientState.client._transformCmdToNs( serverCmd );
    }
}


for(var i=updateFrame.start; i<updateFrame.end; i++) {
    
    var myJ = data.getJournalCmd(i);    
    var serverCmd = updateFrame.c[i-updateFrame.start];
    
    var bSame = true;
    if(myJ) {
        for(var j=0; j<=4; j++) {
            if(myJ[j] != serverCmd[j]) {
                bSame = false;
            }
        }
    } else {
        // a new command has arrived...

        var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
        if( cmdRes !== true ) {
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
    if(bSame) {
        sameUntil = i;
        result.goodCnt++;
        result.oldCnt++;
    } else {
        // the sent commands did differ...
        
        // TODO: rollback
        data.reverseToLine( sameUntil  );
        // and then run commands without sending them outside...
        for(var i=sameUntil+1; i<updateFrame.end; i++) {
            
            var serverCmd = updateFrame.c[i-updateFrame.start];    
            var cmdRes = data.execCmd(serverCmd, true); // true = remote cmd
            if( cmdRes !== true ) {
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
        
        break;
    }
}
return result;


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


    
    


   
      
    



      
    




