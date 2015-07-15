
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

The `fail_all` is "all or nothing" -mode where all commands either fail or succeed.

The `fail_tolastok` is "go until failure" -mode where commands are processed until first error and client is asked to roll back to that situation.

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
# Servers &Delta;&Delta; package format

```javascript
{
    version : 1,                    // the main file + journal version
    start : 34,                     // journal line index
    c : [
                                    // list of channel commands to run
    ]
}
```


# Return values from transaction


















   

 


   
#### Class channelPolicyModule





   
    
    


   
      
            
#### Class _chPolicy


- [_classFactory](README.md#_chPolicy__classFactory)
- [constructDeltaDelta](README.md#_chPolicy_constructDeltaDelta)
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
        
        
### <a name="_chPolicy__classFactory"></a>_chPolicy::_classFactory(id)


```javascript

if(!_instanceCache) _instanceCache = {};

if(_instanceCache[id]) return _instanceCache[id];

_instanceCache[id] = this;
```

### <a name="_chPolicy_constructDeltaDelta"></a>_chPolicy::constructDeltaDelta(serverState)


```javascript

var dd = {
        
};

var chData = serverState.data;

// last_update : [1, 30]
var start = serverState.last_update[1];
var end = chData._journal.length;
dd.c = chData._journal.slice( start, end );
dd.start = start;
dd.version = serverState.version;

serverState.last_update[1] = end;

return dd;


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



try {
        
    if(!clientFrame.id) return;
    if(!clientFrame.socket_id) return;
    if(this._done[clientFrame.id]) return res;
    
    this._done[clientFrame.id] = true;    
    
    var chData = serverState.data; // the channel data object
    
    var client_version = clientFrame.lu[0],
        client_line = clientFrame.lu[1],
        server_lu_version = serverState.last_update[0],
        server_lu_line = serverState.last_update[1];
        
    // the client is lagging so badly, we mark down it must be sent a refresh request
    if(     client_version != serverState.version || 
            server_lu_version != client_version ||
            ( client_verson  < server_lu_version )
        ) {
        if(!serverState.lagging_sockets) serverState.lagging_sockets = {};
        serverState.lagging_sockets[clientFrame.socket_id] = true;
        return;
    }

    // now, it's simple, we just try to apply all the comands
    for(var i=0; i<clientFrame.c.length; i++) {
        var c = clientFrame.c[i];
        chData.execCmd(c);
    }

} catch(e) {
    // in this version, NO PROBLEMO!
}



```

### <a name="_chPolicy_deltaServerToClient"></a>_chPolicy::deltaServerToClient(updateFrame, clientState)
`updateFrame` request from server to client
 
`clientState` This object holds the data the client needs to pefrform it&#39;s actions
 


```javascript

```

### _chPolicy::constructor( channelId, channelData )

```javascript

this._channelId = channelId;
this._channel = channelData;

this._done = {};

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


    
    


   
      
    



      
    




