'use strict';

var express = require('express');
var router = express.Router();
var wot = require('wotjs');
var _ = require('lodash');
var log4js = require('log4js');
var gpios = [];
var futureSensor, sensorDriver;

log4js.configure(__dirname + '/../log4js_config.json');

var log = log4js.getLogger('ActuratorLED');

try {
    futureSensor = require('sensorjs-futuretek');
    sensorDriver.addSensorPackage(futuretek);
} catch (e) {
    log.warn(e.message);
}

router.post('/test', function (req, res) {
    try {
        log.debug('command -> %s', req.body.command);
        res.json({result: 'OK'});
    } catch (e) {
        writeError(e);
    }
});

router.get('/led/:gpio', function (req, res) {
    // TODO: 해당 GPIO에 연결되어 있는 장치 정보 반환
    log.info('Request GPIO pin[%s]', req.params.gpio);

    res.json({result: 'OK'});
});

router.post('/led/:gpio', function (req, res) {
    try {
        var pin = req.params.gpio;
        var command = req.body.command;

        log.debug('gpio port -> %s', pin);

        var sensorUrl = 'sensorjs:///gpio/' + pin + '/rgbLed/rgbLed-' + pin;

        log.info('Create acturator with url -> %s', sensorUrl);

        wot.setActurator(sensorUrl, command, null);

        res.json({result: 'OK'});
    } catch (e) {
        writeError(e);
    }
});

router.post('/leds', function (req, res) {
    try {
        // [{pin:18, command:on}, {pin:23, command:off}]
        var commands = req.body.commands;

        log.debug('commands -> ', commands);

        wot.setActurators('gpio', 'rgbLed', commands, null);
    } catch (e) {
        writeError(e);
    }
});

function writeError(error) {
    log.error(error);

    res.status(500);
    res.json({message: 'Server error!'});
}


module.exports = router;