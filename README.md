
# Channel Policy - merging incoming data

The purpose of Channel Policy is to create patch objects and apply the patches to Objects. The clients are sending changes to the data to the Server and server will merge that data to it's own central state. Periodically the Server is going to send update to the clients about the current valid state of the Object, clients are responsible for updating their own state accordingly.

The Object is represented by JavaScript object of structure:

```javascript
{
  data : {
      x : 50
  },
   __id : "objectID"
}
```

The client and server have journals, which construct of change Commands &Delta; to the objects.

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

List of commands is called `journal`

```javascript
[4, "x", 100, 50,  "objectID"]  // &Delta;[32]
[4, "y", 210, 180, "objectID"]  // &Delta;[33]
[4, "z", 170, 150, "objectID"]  // &Delta;[34]
```

The change request packet (patch) contains the changes for the server. The package is created by functions

1. constructClientToServer
2. constructServerToClient

The change packate is then sent either from the server to client or client to server.

```javascript
{
    id          : "transaction ID",     // unique ID for transaction
    start : 10,                         // journal start line
    end   : 13,                         // journal end line
    c : [
        [4, "x", 100, 50,  "objectID"]  // commands to apply to the object
        [4, "y", 210, 180, "objectID"]
        [4, "z", 170, 150, "objectID"]                                       
    ]
}
```

Both client and server have a state, which contains information for the patching function. The functions are

1. deltaClientToServer(clientFrame, serverState)
2. deltaServerToClient(updateFrame, clientState)

The functions mission is to apply the changes to the server state or client state.

# The workflow

The usual workflow goes like this:

1. The "delta" form a client using `constructClientToServer` is constructed at a client
2. this "delta" is sent to server and applied there using `deltaClientToServer`
3. After a while the server will create a new "delta" using `constructServerToClient`
4. This change is then applied to each client using `deltaServerToClient`

Clients can send multiple deltas to the server before it will create it's own delta to be sent to the clients.

# The state of client and server

The client and server state is stored to plain JS Object and given as a parameter to the functions.

The server's state object looks like this:

```javascript
{
    data : channelData,     // The channel data object
    version : 1,
    last_update : [1, 30],  // the range of last commands sent to the client
    _done : {}              // hash of handled packet ID's
}
```

The clients's state object looks like this:

```javascript
{
    data : channelData,         // The channel data object
    client : chClientObject,    // The channel client object (for Namespace conversion )
    needsRefresh : false,   // true if client is out of sync and needs to reload
    version : 1,
    last_update : [1, 30],  // last succesfull server update
    last_sent : [0,1]       // last range sent to the server
    
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


    
    


   
      
    



      
    




