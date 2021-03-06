angular.module('configurator', [])
    .service('bridgeService', ["$http", function ($http) {
        var self = this;
        this.state = {base: window.location.origin + "/api/devices", devices: [], error: ""};

        this.viewDevices = function () {
            this.state.error = "";
            return $http.get(this.state.base).then(
                function (response) {
                    self.state.devices = response.data[0].content;
                },
                function (error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    } else {
                        self.state.error = "If you're not seeing any devices, you may be running into problems with CORS. " +
                            "You can work around this by running a fresh launch of Chrome with the --disable-web-security flag.";
                    }
                    console.log(error);
                }
            );
        };

        this.addDevice = function (id, name, type, httpVerb, onUrl, offUrl, onUrlBody, offUrlBody, contentType) {
            this.state.error = "";
            if (id) {
                var putUrl = this.state.base + "/" + id;
                return $http.put(putUrl, {
                    id: id,
                    name: name,
                    deviceType: type,
                    httpVerb: httpVerb,
                    onUrl: onUrl,
                    offUrl: offUrl,
                    onUrlBody: onUrlBody,
                    offUrlBody: offUrlBody,
                    contentType: contentType
                }).then(
                    function (response) {
                        self.viewDevices();
                    },
                    function (error) {
                        if (error.data) {
                            self.state.error = error.data.message;
                        }
                        console.log(error);
                    }
                );
            } else {
                return $http.post(this.state.base, {
                    name: name,
                    deviceType: type,
                    httpVerb: httpVerb,
                    onUrl: onUrl,
                    offUrl: offUrl,
                    onUrlBody: onUrlBody,
                    offUrlBody: offUrlBody,
                    contentType: contentType
                }).then(
                    function (response) {
                        self.viewDevices();
                    },
                    function (error) {
                        if (error.data) {
                            self.state.error = error.data.message;
                        }
                        console.log(error);
                    }
                );
            }
        };

        this.deleteDevice = function (id) {
            this.state.error = "";
            return $http.delete(this.state.base + "/" + id).then(
                function (response) {
                    self.viewDevices();
                },
                function (error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    }
                    console.log(error);
                }
            );
        };

        this.editDevice = function (id, name, type, httpVerb, onUrl, offUrl, onUrlBody, offUrlBody, contentType) {
            this.device.id = id;
            this.device.name = name;
            this.device.httpVerb = httpVerb;
            this.device.onUrl = onUrl;
            this.device.offUrl = offUrl;
            this.device.onUrlBody = onUrlBody;
            this.device.offUrlBody = offUrlBody,
            this.device.contentType = contentType
        };
    }])

    .controller('ViewingController', ["$scope", "$http", "$timeout", "bridgeService", function ($scope, $http, $timeout, bridgeService) {
        bridgeService.viewDevices();

        $scope.testFeedbackDisplayTime = 2000;
        $scope.testSuccess = "";
        $scope.testFail = "";
        $scope.showSuccess = function(name) {
        	$scope.testSuccess = name;
            $timeout(function() { $scope.testSuccess = ""; }, $scope.testFeedbackDisplayTime);
        };
        $scope.showFail = function(name) {
        	$scope.testFail = name;
            $timeout(function() { $scope.testFail = ""; }, $scope.testFeedbackDisplayTime);
        };
        
        $scope.bridge = bridgeService.state;
        $scope.deleteDevice = function (device) {
            bridgeService.deleteDevice(device.id);
        };
        $scope.testUrl = function (name, httpVerb, url, body, contentType) {
        	if (httpVerb == "POST") {
        		$http({
        		    method: 'POST',
        		    url: url,
        		    headers: {'Content-Type': contentType},
        		    data: body
        		}).then(function successCallback(response) {
		            $scope.showSuccess(name);
        		  }, function errorCallback(response) {
  		            $scope.showFail(name);
        		  });
        	} else {
		    	$http.get(url).then(function(data, status) {
		            $scope.showSuccess(name);
		        }, function(data, status) {
		            $scope.showFail(name);
		        });
        	}
        };
        $scope.setBridgeUrl = function (url) {
            bridgeService.state.base = url;
            bridgeService.viewDevices();
        };
        $scope.editDevice = function (device) {
            bridgeService.editDevice(device.id, device.name, device.type, device.httpVerb, device.onUrl, device.offUrl, device.onUrlBody, device.offUrlBody, device.contentType);
        };
    }])

    .controller('AddingController', ["$scope", "bridgeService", function ($scope, bridgeService) {

        $scope.bridge = bridgeService.state;
        $scope.device = {id: "", name: "", type: "switch", httpVerb: "httpVerb", onUrl: "", offUrl: "", onUrlBody: "", offUrlBody: "", contentType: ""};
        $scope.vera = {base: "", port: "3480", id: ""};
        bridgeService.device = $scope.device;
        
        $scope.showAdvancedFormCheckbox = false;

        $scope.buildUrls = function () {
            if ($scope.vera.base.indexOf("http") < 0) {
                $scope.vera.base = "http://" + $scope.vera.base;
            }
            $scope.device.onUrl = $scope.vera.base + ":" + $scope.vera.port
                + "/data_request?id=action&output_format=json&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=1&DeviceNum="
                + $scope.vera.id;
            $scope.device.offUrl = $scope.vera.base + ":" + $scope.vera.port
                + "/data_request?id=action&output_format=json&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=0&DeviceNum="
                + $scope.vera.id;
        };

        $scope.testUrl = function (url) {
            window.open(url, "_blank");
        };

        $scope.addDevice = function () {
            bridgeService.addDevice($scope.device.id, $scope.device.name, $scope.device.type, $scope.device.httpVerb,
            		$scope.device.onUrl, $scope.device.offUrl, $scope.device.onUrlBody, $scope.device.offUrlBody,
            		$scope.device.contentType).then(
                function () {
                    $scope.device.id = "";
                    $scope.device.name = "";
                    $scope.device.httpVerb = "";
                    $scope.device.onUrl = "";
                    $scope.device.offUrl = "";
                    $scope.device.onUrlBody = "";
                    $scope.device.offUrlBody = "";
                    $scope.device.contentType = "";
                },
                function (error) {
                }
            );
        }
    }])

    .controller('ErrorsController', ["$scope", "bridgeService", function ($scope, bridgeService) {
        $scope.bridge = bridgeService.state;
    }]);