(function () {
  'use strict';

  /**
   * @ngdoc object
   * @name gaitSpeedApp:SpeedCtrl
   *
   * @description
   *
   */
  angular
    .module('gaitSpeedApp')
    .controller('SpeedCtrl', SpeedCtrl);

  SpeedCtrl.$inject = ['$timeout', 'SpeedCalculatorFactory'];
  function SpeedCtrl($timeout, SpeedCalculatorFactory) {
    var vm = this;
    var sensorsTimes = [];
    // Variable declaration
    vm.currentState = 0;
    vm.sections = [];
    vm.avgSpeed = 0;
    vm.config = {};
    vm.totalTime = undefined;
    vm.sppbScore = undefined;
    vm.isLoading = false;
    vm.appState = {};
    vm.loadPhases = [
      {
        name: 'CHECK_BT',
        task: 'Checking Bluetooth',
        message: 'You have to turn un the bluetooth on your device in order to work with the application'
      },
      {
        name: 'CONNECTING',
        task: 'Establishing connection',
        message: 'Connection couldn\'t be established. Check that the sensor is on, and the bluetooth light is blinking'
      },
      {
        name: 'CALIBRATING',
        task: 'Calibrating sensors',
        message: 'Sensors marked red couldn\'t be calibrated. Please check that nothing is moving in front of them, and that they are properly placed'
      }
    ];
    vm.phasesError = false;

    // Methods declaration
    vm.startMeasures = startMeasures;

    // Init
    init();

    // ---- Methods ----
    function init() {
      setSliderConfiguration();
      setSections();
      vm.appState = {
        btnMessage: 'START'
      };

    }

    function startMeasures() {
      if (vm.appState.btnMessage !== 'MEASURING') {
        resetPhaseStates();
        vm.isLoading = true;
        $timeout(function () {
          vm.loadPhases[0].status = 'started';
          SpeedCalculatorFactory.calibrate().then(function (response) {
            vm.appState = {
              btnMessage: 'RESTART'
            };

            vm.totalTime = (sensorsTimes[4] - sensorsTimes[0]) / 1000;

            if (vm.totalTime < 4.82) {
              vm.sppbScore = 4;
            } else if (vm.totalTime < 6.21) {
              vm.sppbScore = 3;
            } else if (vm.totalTime < 8.7) {
              vm.sppbScore = 2;
            } else {
              vm.sppbScore = 1;
            }

          }, function (err) {
            console.log('Error calibrating', err);
            setPhaseState(err);
          }, function (noty) {
            console.log(noty);
            setPhaseState(noty);
          });
        }, 1000);
      }
    }

    function setPhaseState(response) {
      switch (response.code) {
        case 'BT_DISABLED':
          vm.loadPhases[0].status = 'fail';
          vm.phasesError = vm.loadPhases[0];
          break;
        case 'BT_ENABLED':
          vm.loadPhases[0].status = 'done';
          vm.loadPhases[1].status = 'started';
          break;
        case 'CONNECT_ERR':
          vm.loadPhases[1].status = 'fail';
          vm.phasesError = vm.loadPhases[1];
          break;
        case 'CONNECTED_OK':
          vm.loadPhases[1].status = 'done';
          vm.loadPhases[2].status = 'started';
          break;
        case 'CALIBRATION_ERR':
          vm.loadPhases[2].status = 'fail';
          vm.phasesError = vm.loadPhases[2];
          vm.phasesError.sensorErrors = response.data;
          console.log('CALIBRATION', response);
          break;
        case 'CALIBRATION_OK':
          vm.loadPhases[2].status = 'done';
          console.log('Done calibrating', response);
          vm.appState = {
            btnMessage: 'MEASURING'
          };
          $timeout(function () {
            vm.isLoading = false;
          }, 1000);
          break;
        case 'SENSOR_DETECTED':
          console.log('SENSOR_DETECTED', response.data);
          vm.currentState = response.data.position + 1;
          sensorsTimes[response.data.position] = response.data.time;
          calculateSpeed();
          break;
        default:
          console.log('NOTY', response);
          break;
      }
    }

    function calculateSpeed() {
      var avgSpeed;
      var totalCalculated = 0;
      if (angular.isDefined(sensorsTimes[0]) && angular.isDefined(sensorsTimes[1])) {
        vm.sections[0].avgSpeed = getVelocity(1, sensorsTimes[1] - sensorsTimes[0]);
      }
      if (angular.isDefined(sensorsTimes[1]) && angular.isDefined(sensorsTimes[2])) {
        vm.sections[1].avgSpeed = getVelocity(1, sensorsTimes[2] - sensorsTimes[1]);
      }
      if (angular.isDefined(sensorsTimes[2]) && angular.isDefined(sensorsTimes[3])) {
        vm.sections[2].avgSpeed = getVelocity(1, sensorsTimes[3] - sensorsTimes[2]);
      }
      if (angular.isDefined(sensorsTimes[3]) && angular.isDefined(sensorsTimes[4])) {
        vm.sections[3].avgSpeed = getVelocity(1, sensorsTimes[4] - sensorsTimes[3]);
      }
      avgSpeed = 0;
      if (angular.isDefined(vm.sections[0].avgSpeed)) {
        totalCalculated++;
      }
      if (angular.isDefined(vm.sections[1].avgSpeed)) {
        totalCalculated++;
      }
      if (angular.isDefined(vm.sections[2].avgSpeed)) {
        totalCalculated++;
      }
      if (angular.isDefined(vm.sections[3].avgSpeed)) {
        totalCalculated++;
      }

      for (var i = 0; i < totalCalculated; i++) {
        avgSpeed += vm.sections[i].avgSpeed;
      }

      avgSpeed = avgSpeed / totalCalculated;
      vm.avgSpeed = avgSpeed;
    }

    function getVelocity(distance, time) {
      time = time / 1000;
      return distance / time;
    }

    function resetPhaseStates() {
      vm.phasesError = false;
      setSections();
      vm.avgSpeed = undefined;
      vm.totalTime = undefined;
      vm.sppbScore = undefined;
      sensorsTimes = [];
      vm.currentState = 0;
      for (var i = 0; i < vm.loadPhases.length; i++) {
        delete vm.loadPhases[i].status;
      }
    }

    function setSliderConfiguration() {
      vm.config.sliderOptions = {
        floor: 1,
        ceil: 5,
        vertical: true,
        showSelectionBar: true,
        showTicks: true,
        readOnly: true
      };
    }

    function setSections() {
      vm.sections = [{}, {}, {}, {}];
    }
  }
}());
