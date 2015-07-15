
# Channel Policy - merging incoming data

The following notations are used here


  &Delta;S1 = server change 1
  
  &nabla;R1 = rollback
  
  &int; = main faile 1
  


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


    
    


   
      
    



      
    




