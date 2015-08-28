var request = require('request');
var noble = require('noble');
var log4js = require('log4js');

log4js.configure(__dirname + '/log4js_config.json');

var log = log4js.getLogger('ReceiverMain');

var BUTTON_UUID = 'ffe0';
var NOTIFY_UUID = 'ffe1';

noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('scanStart', function () {
    log.info('Scan start.'); 
});

noble.on('scanStop', function () {
    log.info('Scan stop.');
});

noble.on('discover', function (peripheral) {
    peripheral.on('connect', function () {
        log.info('Connected to SensorTag');
    });

    peripheral.on('disconnect', function () {
        log.info('Disconnected to SensorTag');

        process.exit(0);
    });

    peripheral.connect(function (error) {
        if (error) {
            log.fatal('Connect error >>> ' + error);

            peripheral.disconnect();

            return;
        }

        peripheral.discoverServices([BUTTON_UUID], function (error, services) {
            if (error) {
                log.fatal('Discover services error >>> ' + error);

                peripheral.disconnect();

                return;
            }

            var service = services[0];

            if (!service) {
                log.fatal('Can not find simple keys services');
                peripheral.disconnect();
            }

            // service.discoverCharacteristics([], function (error, characteristics) {
            //     console.log('characteristics length : ' + characteristics.length);

            //     for (var i in characteristics) {
            //         var characteristic = characteristics[i];

            //         console.log('characteristic uuid : ' + characteristic.uuid);
            //     }
            // });

            service.discoverCharacteristics([NOTIFY_UUID], function (error, characteristics) {
                if (error) {
                    log.fatal('Discover characteristics error >>> ' + error);

                    peripheral.disconnect();

                    return;
                }

                var characteristic = characteristics[0];

                if (!characteristic) {
                    log.fatal('Can not find characteristic!');

                    peripheral.disconnect();

                    return;
                }

                characteristic.notify(true, function (error) {
                    if (error) {
                        log.fatal('Notification registration fail! >>> ' + error);

                        peripheral.disconnect();

                        return;
                    }

                    log.info('Notification registration success.');
                });

                characteristic.on('read', function (data, isNotification) {
                    var buttonStatus = data.toString('hex');
                    var requestOption = {
                        url: 'http://10.0.1.3:8088/api/leds',
                        method: 'post'
                    };
                    
                    var commands = [];

                    if (buttonStatus === '00') {
                        commands[0] = {"pin": 18, "command": "off"};
                        commands[1] = {"pin": 23, "command": "off"};
                    } else if (buttonStatus === '01') {
                        commands[0] = {"pin": 18, "command": "off"};
                        commands[1] = {"pin": 23, "command": "on"};
                    } else if (buttonStatus === '02') {
                        commands[0] = {"pin": 18, "command": "on"};
                        commands[1] = {"pin": 23, "command": "off"};
                    } else {
                        commands[0] = {"pin": 18, "command": "on"};
                        commands[1] = {"pin": 23, "command": "on"};
                    }

                    requestOption.json = {"commands": commands};

                    request(requestOption, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            log.info('Command[%s] complete.', commands);
                        } else {
                            log.fatal('Command[%s] error!', commands);
                        }
                    });
                });
            });
        });
    });
});