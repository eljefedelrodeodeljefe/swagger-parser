describe('Real-world APIs', function () {
  'use strict';

  var realWorldAPIs = [];
  var apiIndex = 0;

  before(function (done) {
    // Download a list of over 200 real-world Swagger APIs from apis.guru
    superagent.get('https://api.apis.guru/v2/list.json')
      .end(function (err, res) {
        if (err || !res.ok) {
          return done(err || new Error('Unable to downlaod real-world APIs from apis.guru'));
        }

        // Remove certain APIs that are known to cause problems
        var apis = res.body;
        delete apis['citrixonline.com:scim'];   // special characters in the URL cause problems
        delete apis['googleapis.com:adsense'];  // GitHub's CORS policy blocks this
        delete apis['versioneye.com'];          // Fails validation due to incorrect content type
        delete apis['clarify.io'];              // Contains an invalid $ref

        // https://github.com/BigstickCarpet/json-schema-ref-parser/issues/56
        delete apis['bungie.net'];
        delete apis['stripe.com'];

        // https://github.com/APIs-guru/openapi-directory/issues/351
        delete apis['azure.com:network-applicationGateway'];
        delete apis['azure.com:network-expressRouteCircuit'];
        delete apis['azure.com:network-networkInterface'];
        delete apis['azure.com:network-networkSecurityGroup'];
        delete apis['azure.com:network-publicIpAddress'];
        delete apis['azure.com:network-routeFilter'];
        delete apis['azure.com:network-routeTable'];
        delete apis['azure.com:network-virtualNetwork'];

        // Transform the list into an array of {name: string, url: string}
        realWorldAPIs = [];
        Object.keys(apis).forEach(function (apiName) {
          Object.keys(apis[apiName].versions).forEach(function (version) {
            var fullName = apiName + ' ' + (version[0] === 'v' ? version : 'v' + version);
            var url = apis[apiName].versions[version].swaggerYamlUrl;
            realWorldAPIs.push({ name: fullName, url: url });
          });
        });

        done();
      });
  });

  beforeEach(function () {
    // Some of these APIs are vary large, so we need to increase the timouts
    // to allow time for them to be downloaded, dereferenced, and validated.
    // so we need to increase the timeouts to allow for that
    this.currentTest.timeout(30000);
    this.currentTest.slow(5000);
  });

  // Mocha requires us to create our tests synchronously. But the list of APIs is downloaded asynchronously.
  // So, we just create 1,500 placeholder tests, and then rename them later to reflect which API they're testing.
  for (var i = 1; i <= 1500; i++) {
    it(i + ') ', testNextAPI);
  }

  function testNextAPI (done) {
    // Get the next API to test
    var api = realWorldAPIs[apiIndex++];

    if (api) {
      this.test.title += api.name;

      // Validate this API
      SwaggerParser.validate(api.url)
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    }
    else {
      // There are no more APIs to test
      this.test.title += 'more APIs coming soon...';
      done();
    }
  }
});
