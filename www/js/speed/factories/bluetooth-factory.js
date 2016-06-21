(function () {
  'use strict';

  angular
    .module('gaitSpeedApp')
    .factory('BluetoothFactory', BluetoothFactory);

  BluetoothFactory.$inject = ['$q', '$cordovaBeacon'];
  function BluetoothFactory($q, $cordovaBeacon) {
    var vm = this;

    vm.connectTo = connectTo;
    vm.subscribe = subscribe;
    vm.unsubscribe = unsubscribe;
    vm.isBTEnabled = isBTEnabled;

    function connectTo(macAddress) {
      var deferred = $q.defer();
      bluetoothSerial.isConnected(function () {
        deferred.resolve(setResponseMessage('OK', 'CONNECTED'));
      }, function () {
        bluetoothSerial.connect(macAddress, function (results) {
          deferred.resolve(setResponseMessage('OK', 'CONNECTED', results));
        }, function (error) {
          deferred.reject(setResponseMessage('KO', 'CONNECT_ERR', error));
        });
      });

      return deferred.promise;
    }

    function isBTEnabled() {
      var deferred = $q.defer();

      $cordovaBeacon.isBluetoothEnabled().then(function(isEnabled){
        if (isEnabled) {
          deferred.resolve(setResponseMessage('OK', 'BT_ENABLED'));
        } else{
          deferred.reject(setResponseMessage('KO', 'BT_DISABLED'));
        }
      }, function (err) {
        deferred.reject(setResponseMessage('KO', 'BT_DISABLED', err));
      });

      return deferred.promise;
    }

    function subscribe(callback, err) {
      bluetoothSerial.subscribe('\n', function(results) {
        console.log('DATA RECEIVED BT');
        callback(setResponseMessage('OK', 'CONNECTED', JSON.parse(results)));
      }, function(error) {
        err(setResponseMessage('KO', 'SUBSCRIBE_ERR', error));
      });
    }

    function unsubscribe() {
      bluetoothSerial.unsubscribe();
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
