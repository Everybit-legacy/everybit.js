'use strict';

/* Controllers */

// var myApp = angular.module('myApp', []);

angular.module('myApp.controllers', [])

	.controller('displayChange', function ($scope) {
	// console.log('test to be sure controller works');

	// Presets on load
	$scope.height = 5,
  	$scope.width = 5,
  	$scope.positionX = 10,
  	$scope.positionY = 10;

	})

	.controller('mainController', [function () {
	// console.log('test to be sure controller works');

	}])

	.controller('aboutController', [function () {
	// console.log('test to be sure controller works');

	}]);

