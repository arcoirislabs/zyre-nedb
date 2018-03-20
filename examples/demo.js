const ZDB = require('../index');
const db1 = new ZDB({ database: "db1.json", discoveryPort: 4567, name: "myAppNode #1", autoStart: false, user: "asdqd23d23dsad23d", databaseGroup: "myDatabase",httpPort:5600 });
const db2 = new ZDB({ database: "db2.json", discoveryPort: 4567, name: "myAppNode #2", autoStart: false, user: "9qhe9823e289je928", databaseGroup: "myDatabase", httpPort:5601 });

db1.start(function() {

    db1.search(function(e) {
        //console.log("search by db1", e);
        db1.setDatabase(e[0]);
        db1.run('insert', { table: "patient", name: "Amey" }, function(e, s,d) {
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