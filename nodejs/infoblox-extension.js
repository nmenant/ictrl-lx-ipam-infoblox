/**
* this iControl LX extension can be used to communicate with infoblox
* DDI solution. It is able to request an IP address from a specific subnet/zone
* You'll need to make sure to setup your subnet and related zone accordingly
* in Infoblox. When you request an IP address, you need to specify the FQDN
* related to the service that will leverage this IP. The domain name related to
* the FQDN specified must exist in Infoblox as a zone
*/

var logger = require('f5-logger').getInstance();
var promise = require("/usr/share/rest/node/node_modules/promise");
var InfobloxFunc = require("../utils/infoblox-utils.js");

var DEBUG = "true";

function InfobloxWorker() {}

InfobloxWorker.prototype.WORKER_URI_PATH = "/shared/workers/ipam-infoblox";
InfobloxWorker.prototype.isPublic = true;

/**
* handle onGet HTTP request
*/
InfobloxWorker.prototype.onGet = function(restOperation) {

  if (DEBUG) {
    logger.info("InfobloxWorker - onGet triggered");
  }
  restOperation.setBody(JSON.stringify( { value: "Hello World!" } ));
  this.completeRestOperation(restOperation);
};

/**
* handle onPost HTTP request
*/
InfobloxWorker.prototype.onPost = function(restOperation) {
  var postBody = restOperation.getBody();
  var athis = this;

  if (DEBUG) {
    logger.info("InfobloxWorker - onPost triggered");
    logger.info("InfobloxWorker - onPost, service fqdn: " + postBody.name + " , subnet: " + postBody.subnet);
  }

  var infobloxQuery = new InfobloxFunc(postBody.name, postBody.subnet);
  infobloxQuery.AllocateIP()
    .then(function(myToken) {
      return infobloxQuery.GetIPFromToken(myToken);
    })
    .then(
      function (myIP) {
        logger.info("InfobloxWorker - onPost, AllocateIP - my retrieved IP is: " + myIP);
        responseBody = "{ \"value\": \"" + myIP + "\"}";
        restOperation.setBody(responseBody);
        athis.completeRestOperation(restOperation);
      })
    .catch (function (err){
        logger.info("InfobloxWorker - onPost, AllocateIP - something went wrong: " + JSON.stringify(err));
        responseBody = "{ \"value\": \"" + err + "\"}";
        restOperation.setBody(responseBody);
        athis.completeRestOperation(restOperation);
    });
};

/**
* handle onDelete HTTP request
*/
InfobloxWorker.prototype.onDelete = function(restOperation) {

  if (DEBUG) {
    logger.info("InfobloxWorker - onDelete triggered");
  }
  restOperation.setBody(JSON.stringify( { value: "Hello World!" } ));
  this.completeRestOperation(restOperation);
};

/**
* handle /example HTTP request
*/
InfobloxWorker.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};

module.exports = InfobloxWorker;
