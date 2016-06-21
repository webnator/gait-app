// Ionic BitSalas App
var app = {
  initialize: function () {
    this.bindEvents();
  },
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  onDeviceReady: function () {
    var element = document.querySelector('html');
    angular.bootstrap(element, ['gaitSpeedApp']);
    //console.log("device ready");
  }
};

angular.module('gaitSpeedApp', [
  'ionic',
  'rzModule',
  'ngCordova'
])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('speed', {
        url: '/speed',
        templateUrl: 'js/speed/views/speed.tpl.html',
        controller: 'SpeedCtrl',
        controllerAs: 'speed'
      });
    $urlRouterProvider.otherwise('/speed');
  })
  .constant('sensorMAC', '20:15:07:02:02:09')
  .constant('_', window._);

app.initialize();
