/*
* This file contains the different function that will be used to
* communicate with the infoblox solution
* here we have the following functions:
*     - get and reserve the next available free IP in a subnet/zones
*     - free an IP that is not needed anymore
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var logger = require('f5-logger').getInstance();
var request = require("/usr/share/rest/node/node_modules/request");
var promise = require("/usr/share/rest/node/node_modules/promise");
var DEBUG = true;

function InfobloxUtils (name, subnet) {

  /*
  * Here we provide the information to communicate with infoblox:
  *   - Infoblox IP
  *   - Infoblox Login / Password
  *   - Infloblox subnet
  */

  var infobloxIP = "10.100.60.71";
  var infobloxLogin = "admin";
  var infobloxPassword = "51L1c0mp"
  var auth = 'Basic ' + new Buffer(infobloxLogin + ':' + infobloxPassword).toString('base64');
  var name = name;
  var subnet = subnet;

  /*
  * When we Allocate an IP from infoblox, infoblox just return a token
  * This function will use the token to retrieve the IP allocated to it
  */
  this.GetIPFromToken = function (myToken) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function GetIPFromToken, token is: " + myToken);
        }
        var options = {
          method: 'GET',
      		url: 'https://' + infobloxIP + '/wapi/v2.6/' + myToken,
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			}
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox succeeded - body!!!!!: " + JSON.stringify(body));
                var jsonBody = JSON.parse(body);
                logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox succeeded - IP: " + jsonBody.ipv4addrs[0].ipv4addr);

              }
              resolve(jsonBody.ipv4addrs[0].ipv4addr);
            } else {
                if (DEBUG) {
                  logger.info("Infoblox Utils: function GetIPFromToken, http request to infoblox failed - body: " + JSON.stringify(body));
                }
                reject (body);
            }
          }
       });
     }
   )
  }

  /*
  * This function will allocate an IP to our host. The way it works is the following:
  * - you send a request to /wapi/v2.6/record:host specifying your service FQDN
  *   and the subnet that should allocate an IP
  * - infoblox will reply with something like this:
  *    record:host/ZG5zLmhvc3QkLl9kZWZhdWx0Lm9yZy5teS1sYWIud2Vi:web.my-lab.org/default
  * - we will need another request to translate this into an IP
  */

  this.AllocateIP = function () {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("Infoblox Utils: function AllocateIP, name is: " + name + " and subnet is: " + subnet);
        }
        var postData = {
          "name": name,
          "ipv4addrs": [{"ipv4addr":"func:nextavailableip:"+ subnet}]
        };
        if (DEBUG) {
          logger.info("Infoblox Utils: function AllocateIP, infoxblox post payload will be :" + JSON.stringify(postData));
        }
        var options = {
          method: 'POST',
      		url: 'https://' + infobloxIP + '/wapi/v2.6/record:host',
      		headers:
        		{
          		"authorization": auth,
          		'content-type': 'application/json'
      			},
      		body: postData,
      		json: true
        };

        request(options, function (error, response, body) {
          if (error) {
            if (DEBUG) {
              logger.info("Infoblox Utils: function AllocateIP, http request to infoblox failed: " + error);
            }
            reject (error);
          } else {
            if (DEBUG) {
              logger.info("Infoblox Utils: function AllocateIP, http request to infoblox - response: " + response.statusCode);
            }
            var status = response.statusCode.toString().slice(0,1);
            if ( status == "2") {
              if (DEBUG) {
                logger.info("Infoblox Utils: function AllocateIP, http request to infoblox succeeded - body: " + body);
              }
              resolve(body);
            } else {
                if (DEBUG) {
                  logger.info("Infoblox Utils: function AllocateIP, http request to infoblox failed - body: " + JSON.stringify(body));
                }
              reject (body);
            }
          }
        });
      }
    )
  }

};

module.exports = InfobloxUtils;
