var Pusher = require('pusher_integration');
var TestEnv = require('testenv');

if (TestEnv === "web") {
  window.Pusher = Pusher;
  var DependencyLoader = require('dom/dependency_loader').default;
  var DependenciesReceivers = require('dom/dependencies').DependenciesReceivers;
  var Dependencies = require('dom/dependencies').Dependencies;
}

var Integration = require("integration");
var util = require("core/util").default;
var Timer = require("core/utils/timers").OneOffTimer;
var Collections = require('core/utils/collections');
var Defaults = require('core/defaults').default;
var Runtime = require('runtime').default;
var integrationTestBuilder = require('./test_builder')

module.exports = function(testConfigs) {
  Integration.describe("Pusher", function() {
    // Integration tests in Jasmine need to have setup and teardown phases as
    // separate specs to make sure we share connections between actual specs.
    // This way we can also make sure connections are closed even when tests fail.
    //
    // Ideally, we'd have a separate connection per spec, but this introduces
    // significant delays and triggers security mechanisms in some browsers.

    var _VERSION;
    var _channel_auth_transport;
    var _channel_auth_endpoint;
    var _Dependencies;

    // running the integration tests against a local pusher region has significant
    // speed benefits. Allow the tester to inject a pusher app key/cluster and a
    // suitable auth endpoint.
    var pusherKey = process.env.PUSHER_APP_KEY || '7324d55a5eeb8f554761';
    var basePusherConfig = {
      cluster: process.env.PUSHER_APP_CLUSTER || 'mt1',
      authEndpoint: process.env.PUSHER_AUTH_ENDPOINT || Integration.API_URL + "/auth",
      authTransport: (TestEnv === 'web') ? 'jsonp' : 'ajax',
      disableStats: true,
    }

    it("should prepare the global config", function() {
      // TODO fix how versions work in unit tests
      _VERSION = Defaults.VERSION;
      _channel_auth_transport = Defaults.channel_auth_transport;
      _channel_auth_endpoint = Defaults.channel_auth_endpoint;
      _Dependencies = Dependencies;

      // TODO I'd rather be specific with the configuration of the test instances.
      // Should add a test to test the default config, since being explicit
      // removes an implicit test of the handling of the default config
      Defaults.VERSION = "8.8.8";
      Defaults.channel_auth_transport = (TestEnv === 'web') ? 'jsonp' : 'ajax';
      Defaults.channel_auth_endpoint = Integration.API_URL + "/auth";

      if (TestEnv === "web") {
        Dependencies = new DependencyLoader({
          cdn_http: Integration.JS_HOST,
          cdn_https: Integration.JS_HOST,
          version: Defaults.VERSION,
          suffix: "",
          receivers: DependenciesReceivers
        });
      }
    });

    for (testConfig of testConfigs) {
      integrationTestBuilder.build(testConfig, pusherKey, basePusherConfig)
    }


    it("should restore the global config", function() {
      Dependencies = _Dependencies;
      Defaults.channel_auth_endpoint = _channel_auth_endpoint;
      Defaults.channel_auth_transport = _channel_auth_transport;
      Defaults.VERSION = _VERSION;
    });
  });
}

