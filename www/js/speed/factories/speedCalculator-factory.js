(function () {
  'use strict';

  angular
    .module('gaitSpeedApp')
    .factory('SpeedCalculatorFactory', SpeedCalculatorFactory);

  SpeedCalculatorFactory.$inject = ['$q', 'BluetoothFactory', 'sensorMAC', 'LogsFactory'];
  function SpeedCalculatorFactory($q, BluetoothFactory, sensorMAC, LogsFactory) {
    var vm = this;
    var measures = [];
    var sensorBaseData = [];
    var sensorIterations = [];
    var sensorErrors = [];
    // Tolerance for the calibration in mm
    var TOLERANCE = 60;
    // Iterations that need to stay within TOLERANCE ratio
    var CALIBRATIONITERATIONS = 40;
    // Maximum calibrations before a calibration error is sent
    var MAXITERATIONS = 150;
    // Errors to tolerate
    var ERRORTOLERATE = 1;

    // Factory Methods
    vm.calibrate = calibrate;

    // Factory functions
    function calibrate() {
      var deferred = $q.defer();

      BluetoothFactory.isBTEnabled().then(function (res) {
        deferred.notify(res);
        BluetoothFactory.connectTo(sensorMAC).then(function () {
          var it = 0;
          sensorIterations = [];
          sensorBaseData = [];
          deferred.notify(setResponseMessage('info', 'CONNECTED_OK'));
          BluetoothFactory.subscribe(function (noti) {
            it++;
            var data = noti.data.values;
            console.log(data, sensorBaseData, sensorIterations, it);
            for (var i = 0; i < data.length; i++) {
              if (angular.isUndefined(sensorBaseData[i])) {
                sensorBaseData[i] = data[i];
                sensorIterations[i] = 0;
                sensorErrors[i] = 0;
              } else {
                if ((data[i] >= (sensorBaseData[i] - TOLERANCE)) && (data[i] <= (sensorBaseData[i] + TOLERANCE))) {
                  sensorIterations[i]++;
                } else {
                  sensorErrors[i]++;
                  if (sensorErrors[i] > ERRORTOLERATE) {
                    sensorBaseData[i] = data[i];
                    sensorIterations[i] = 0;
                    sensorErrors[i] = 0;
                  }
                }
              }
            }

            if (isCalibrated()) {
              deferred.notify(setResponseMessage('info', 'CALIBRATION_OK'));
              startMeasuring()
                .then(function (response) {
                  BluetoothFactory.unsubscribe();
                  deferred.resolve(response);
                }, function (err) {
                  BluetoothFactory.unsubscribe();
                  deferred.reject(setResponseMessage('error', 'MEASURING_ERR', err));
                }, function (noty) {
                  console.log(noty);
                  deferred.notify(noty);
                });
            }
            if (it >= MAXITERATIONS) {
              BluetoothFactory.unsubscribe();
              deferred.reject(setResponseMessage('error', 'CALIBRATION_ERR', sensorIterations));
            }
          }, function (err) {
            deferred.reject(setResponseMessage('error', 'SUBSCRIBE_ERR', err));
          });
        }, function (err) {
          deferred.reject(err);
        });
      }, function (err) {
        deferred.reject(err);
      });

      return deferred.promise;
    }

    function startMeasuring(){
      var deferred = $q.defer();
      var detections = [];
      measures = [];
      var logs = [];
      var backwards = false;
      BluetoothFactory.unsubscribe();
      BluetoothFactory.subscribe(function (noty) {
        var data = noty.data.values;
        console.log(data, sensorBaseData);

        logs.push({data: data, sensorBase: sensorBaseData, time: new Date().getTime()});

        var i = measures.length;
        var eventDetected;
        if (backwards === false) {
          eventDetected = (data[i] < (sensorBaseData[i] - TOLERANCE)) || data[i] > (sensorBaseData[i] + TOLERANCE);
        } else {
          var x = sensorBaseData.length - 1 - i;
          eventDetected = (data[x] < (sensorBaseData[x] - TOLERANCE)) || data[x] > (sensorBaseData[x] + TOLERANCE);
        }

        if (measures.length === 0 && eventDetected === false) {
          // Listens for events in the last sensor in the array to detect backward walks
          var y = sensorBaseData.length - 1;
          eventDetected = (data[y] < (sensorBaseData[y] - TOLERANCE)) || data[y] > (sensorBaseData[y] + TOLERANCE);
          if (eventDetected) {
            backwards = true;
          }
        }

        if (eventDetected) {
          measures[i] = noty.data.time;
          var sensor_detected = {
            position: i,
            time: measures[i],
            extra: detections[i],
            errTol: ERRORTOLERATE
          };
          deferred.notify(setResponseMessage('info', 'SENSOR_DETECTED', sensor_detected));
        }
        if (measuresCompleted()) {
          LogsFactory.writeLogs(logs);
          logs = [];
          BluetoothFactory.unsubscribe();
          deferred.resolve(setResponseMessage('info', 'MEASURING_FINISHED', measures));
        }
      });
      return deferred.promise;
    }

    function measuresCompleted() {
      for (var i = 0; i < sensorBaseData.length; i++) {
        if (angular.isUndefined(measures[i])){
          return false;
        }
      }
      return true;
    }

    function isCalibrated() {
      if (sensorIterations.length <= 0) {
        return false;
      }
      for (var i = 0; i < sensorIterations.length; i++) {
        if (angular.isUndefined(sensorIterations[i]) || sensorIterations[i] < CALIBRATIONITERATIONS) {
          return false;
        }
      }
      return true;
    }

    function setResponseMessage(type, message, data){
      var response = {
        type: type,
        code: message
      };
      if (data) {
        response.data = data;
      }
      return response
    }
    return vm;
  }
}());
