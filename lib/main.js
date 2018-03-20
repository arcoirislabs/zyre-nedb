'use strict';
const Zyre = require('zyre.js');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
const Store = require('nedb');
const _ = require('lodash');
const ip = require('ip');
const http = require('http');
const request = require('request');

function ZDB(params) {
    //console.log("ZDB");
    this.params = params;
    var self = this;
    this.selfIp = ip.address();
    this.db = _initDatabase(params.database);
    EventEmitter.call(self);
    this.z = new Zyre({
        name: this.params.name,
        user: this.params.user,
        headers: {
            user: this.params.user,
            database: this.params.database,
            httpAddress: this.selfIp,
            httpPort: this.params.httpPort,
            httpAddress: "http://" + this.selfIp + ":" + this.params.httpPort
        },
        evasive: 5000, // Timeout after which the local node will try to ping a not responding peer
        expired: 30000, // Timeout after which a not responding peer gets disconnected
        bport: params.discoveryPort, // Discovery beacon broadcast port
        binterval: 1000, // Discovery beacon broadcast interval
    });

    self.z.setEncoding('utf8');

    self.z.on('whisper', (id, name, message) => {
        //console.log("whisper", id, name, message);
        const wm = JSON.parse(message);

        switch (wm.event) {
            case "database-find":
                self.emit(wm.event, {
                    id: id
                });
                break;
        }

    });
    this.z.on('join', (id, name, group) => {
        this.z.whisper(id, JSON.stringify({ event: 'database-find' }));
    });


}

inherits(ZDB, EventEmitter);

ZDB.prototype.connect = function(cb) {
    //console.log("connect", this.params);

    this.start();
    cb();
};

ZDB.prototype.search = function(cb) {
    //console.log("searching..");
    this.z.join(this.params.databaseGroup);

    this.on('database-find', function(e) {
        cb(this.getPeerDatabases());
    });

};

ZDB.prototype.start = function(cb) {
    const self = this;
    //console.log("starting..")
    http.createServer(function(request, response) {
        var parsedUrl = require('url').parse(request.url, true); // true to get query as object
        var queryAsObject = parsedUrl.query;
        //console.log(queryAsObject);
        self.runDBCommand(queryAsObject, (e, m) => {
            console.log(e, m);
            if (e) {
                response.writeHead(400, {
                    'Content-Type': 'text/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Powered-By': 'nodejs'
                });
                response.write(JSON.stringify(e));
                response.end();
            } else {
                response.writeHead(200, {
                    'Content-Type': 'text/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Powered-By': 'nodejs'
                });
                response.write(JSON.stringify(m));
                response.end();
            }
        });

    }).listen(this.params.httpPort);
    this.z.start(() => {
        cb();
    });
};

ZDB.prototype.run = function(cmd, opts, mcb) {
    ////console.log(this.sdb);
    opts.cmd = cmd;

    request.get({
        url: this.sdb.headers.httpAddress,
        qs: opts
    }, function(err, resp, body) {
        mcb(err, JSON.parse(body), cmd);
    });

};

ZDB.prototype.setDatabase = function(id, cb) {
    this.sdb = id;
};

ZDB.prototype.getPeerDatabases = function(cb) {
    const s = this.z.getPeers();
    var d = [];
    Object.keys(s).forEach(el => {
        s[el].id = el;
        d.push(s[el]);
    });
    return d;
};

ZDB.prototype.stop = function(params) {
    this.removeAllListeners();
    this.z.stop();
};

ZDB.prototype.runDBCommand = function(m, cb) {

    const cmd = m.cmd;
    delete m.cmd;
    console.log(m);
    this.db[cmd](m, function(e, r) {
        console.log(e, r);
        cb(e, r);
    });
};


module.exports = ZDB;

function _initDatabase(name) {
    const sd = new Store({
        filename: name,
        autoload: true
    });
    sd.loadDatabase();
    return sd;
}