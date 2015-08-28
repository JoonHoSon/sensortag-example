'use strict';

var http = require('http');
var express = require('express');
var parser = require('body-parser');
var wot = require('wotjs');
var async = require('async');
var _ = require('lodash');
var log4js = require('log4js');

log4js.configure(__dirname + '/log4js_config.json');

var log = log4js.getLogger('ActuratorMain');

var app = express();
var port = process.env.PORT || 8088;

app.use(parser.urlencoded());
app.use(parser.json());
app.set('port', port);

var routerIndex = require('./routes/index');
var routerLed = require('./routes/led');

app.use('/', routerIndex);
app.use('/api', routerLed);

var server = http.createServer(app);
var netProfile;

async.series([
    function (done) {
        var options = {
            websocketTopic: 'sensorData',
            reportInterval: netProfile && netProfile.reportingPeriod
        };

        wot.init(server, options, done);

        log.info('WoT.js initialize.');
    },
    function (done) {
        done();
    }
], function (error) {
        if (error) {
            log.error(error);
            process.exit(1);
        }

        server.listen(app.get('port'));

        // app.listen(port);
        log.info('Server start - [%s]', app.get('port'));
        log.debug('debug');
    }
);



