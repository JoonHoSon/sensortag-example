var noble = require('noble');

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
    console.log('Scan start.'); 
});

noble.on('scanStop', function () {
    console.log('Scan stop.');
});

noble.on('discover', function (peripheral) {
    peripheral.on('connect', function () {
        console.log('Connected to SensorTag');
    });

    peripheral.on('disconnect', function () {
        console.log('Disconnected to SensorTag');

        process.exit(0);
    });

    peripheral.connect(function (error) {
        if (error) {
            console.log('Connect error >>> ' + error);

            peripheral.disconnect();

            return;
        }

        peripheral.discoverServices([BUTTON_UUID], function (error, services) {
            if (error) {
                console.log('Discover services error >>> ' + error);

                peripheral.disconnect();

                return;
            }

            var service = services[0];

            if (!service) {
                console.log('Can not find simple keys services');
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
                    console.log('Discover characteristics error >>> ' + error);

                    peripheral.disconnect();

                    return;
                }

                var characteristic = characteristics[0];

                if (!characteristic) {
                    console.log('Can not find characteristic!');

                    peripheral.disconnect();

                    return;
                }

                characteristic.notify(true, function (error) {
                    if (error) {
                        console.log('Notification registration fail! >>> ' + error);

                        peripheral.disconnect();

                        return;
                    }

                    console.log('Notification registration success.');
                });

                characteristic.on('read', function (data, isNotification) {
                    var buttonStatus = data.toString('hex');

                    if (buttonStatus === '00') {
                        console.log('안눌림');
                    } else if (buttonStatus === '01') {
                        console.log('오른쪽');
                    } else if (buttonStatus === '02') {
                        console.log('왼쪽');
                    } else {
                        console.log('동시');
                    }
                });
            });
        });
    });
});