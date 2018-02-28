[![Build Status](https://travis-ci.org/arcoirislabs/zyre-nedb.svg?branch=master)](https://travis-ci.org/arcoirislabs/zyre-nedb)



# zyre-nedb (WIP)
ZRE enabled decentralised &amp; distributed database based on NeDB.

This is just a crazy experiment we did just to mess around to create decentralised database which can be used without any configuration.

ZRE is also known as ZeroMQ Realtime Exchange protocol enables true peer-peer communication that's independent of any servers or any administrative authority.

We wanted a simple DB to make it work hence we chose NeDB. 

Here is an example.

````
const ZDB = require('zyre-nedb');
const db1 = new ZDB({ database: "db1.json", discoveryPort: 4567, name: "myAppNode #1", autoStart: false, user: "asdqd23d23dsad23d", databaseGroup: "myDatabase" });
const db2 = new ZDB({ database: "db2.json", discoveryPort: 4567, name: "myAppNode #2", autoStart: false, user: "9qhe9823e289je928", databaseGroup: "myDatabase" });

db1.start(function() {

    db1.search(function(e) {
        //console.log("search by db1", e);
        db1.setDatabase(e[0].id);
        db1.run('insert', { table: "patient", name: "Amey" }, function(e, s) {
            console.log("db2 result", e, s);
        });
    });
});
db2.start(function() {

});
process.on('SIGINT', function(params) {
    db1.stop();
    db2.stop();
    process.exit();
});
````
