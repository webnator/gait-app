(function () {
  'use strict';

  angular
    .module('gaitSpeedApp')
    .factory('LogsFactory', LogsFactory);

  LogsFactory.$inject = ['$cordovaFile'];
  function LogsFactory($cordovaFile) {
    var vm = this;

    vm.writeLogs = writeLogs;

    function writeLogs(logs) {
      $cordovaFile.writeFile(cordova.file.dataDirectory, 'log_'+ new Date().getTime() +'.txt', JSON.stringify(logs), true);
    }

    return vm;
  }
}());
