'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/main', {templateUrl: 'partials/main.html', controller: 'mainController'});
  $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: 'aboutController'});
  $routeProvider.otherwise({redirectTo: '/main'});
}]);
