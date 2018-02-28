'use strict';
const Zyre = require('zyre.js');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
const Store = require('nedb');
const _ = require('lodash');

function ZDB(params) {
    this.params = params;
    var self = this;
    self.db = _initDatabase(params.database);
    EventEmitter.call(self);
    this.z = new Zyre({
        name: this.params.name,
        headers: {
            user: params.user,
            database: params.database
        }
    });

    self.z.setEncoding('utf8');

    self.z.on('whisper', (id, name, message) => {
        console.log("on whisper", id, name, message);
        const wm = JSON.parse(message);

        switch (wm.event) {
            case "database-find":
                self.emit(wm.event, {
                    id: id
                });
                break;
            case "database-response":
                self.emit(wm.event, {
                    id: id,
                    data: wm.data
                });
                break;

            default:
                self.runDBCommand(JSON.parse(message), (e, s) => {
                    console.log("em respo")
                    self.z.whisper(id, JSON.stringify({ event: 'database-response', data: { error: e, result: s } }));
                });

                break;
        }

    });
    this.z.on('join', (id, name, group) => {
        this.z.whisper(id, JSON.stringify({ event: 'database-find' }));
        //console.log("on join to " + this.params.name, `(${group}) ${name}`, this.z.getPeer(id));
    });
}

inherits(ZDB, EventEmitter);

ZDB.prototype.connect = function(cb) {
    console.log("connect", this.params);
    this.start();
    cb();
};

ZDB.prototype.search = function(cb) {
    //this.emit('search-start');
    //console.log(this.params.databaseGroup, 'database-search');
    this.z.join(this.params.databaseGroup);
    //this.z.shout(this.params.databaseGroup, 'database-search');
    this.on('database-find', function(e) {
        //this.emit('search-end');
        cb(this.getPeerDatabases());
    });

};

ZDB.prototype.start = function(cb) {
    this.z.start(() => {
        console.log("ZDB started", this.params.database);
        cb();
    });
};

ZDB.prototype.run = function(cmd, opts, mcb) {
    this.on('database-response', function(i) {
        //console.log(i);
        mcb(i.data.error, i.data.result, i.id);
    });
    this.z.whisper(this.sdb, JSON.stringify({ cmd: cmd, options: opts }));
};

ZDB.prototype.setDatabase = function(id, cb) {
    this.sdb = id;
};


ZDB.prototype.getPeerDatabases = function(cb) {
    const s = _.mapValues(this.z.getPeers(), 'headers.user');
    var d = [];
    Object.keys(s).forEach(el => {
        d.push({ id: el, user: s[el] });
    });
    return d;
};

ZDB.prototype.stop = function(params) {
    this.removeAllListeners();
    this.z.stop();
};

ZDB.prototype.runDBCommand = function(m, cb) {
    console.log("rc", m);
    this.db[m.cmd](m.options, cb);
};

ZDB.prototype._sendDBResponse = function(e, s) {
    console.log("sending respo",
        e, s);
    this.emit('database-response', { table: "patient" });
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