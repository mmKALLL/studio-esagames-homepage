cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "monaca-plugin-monaca-core.monaca",
      "file": "plugins/monaca-plugin-monaca-core/www/monaca.js",
      "pluginId": "monaca-plugin-monaca-core",
      "merges": [
        "monaca"
      ]
    },
    {
      "id": "cordova-plugin-inappbrowser.inappbrowser",
      "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
      "pluginId": "cordova-plugin-inappbrowser",
      "clobbers": [
        "cordova.InAppBrowser.open"
      ]
    },
    {
      "id": "admob-plus-cordova.AdMob",
      "file": "plugins/admob-plus-cordova/www/admob.js",
      "pluginId": "admob-plus-cordova",
      "clobbers": [
        "admob"
      ]
    },
    {
      "id": "cordova-plugin-device.device",
      "file": "plugins/cordova-plugin-device/www/device.js",
      "pluginId": "cordova-plugin-device",
      "clobbers": [
        "device"
      ]
    },
    {
      "id": "cordova-launch-review.LaunchReview",
      "file": "plugins/cordova-launch-review/www/launchreview.js",
      "pluginId": "cordova-launch-review",
      "clobbers": [
        "LaunchReview"
      ]
    },
    {
      "id": "cordova-plugin-customurlscheme.LaunchMyApp",
      "file": "plugins/cordova-plugin-customurlscheme/www/ios/LaunchMyApp.js",
      "pluginId": "cordova-plugin-customurlscheme",
      "clobbers": [
        "window.plugins.launchmyapp"
      ]
    },
    {
      "id": "es6-promise-plugin.Promise",
      "file": "plugins/es6-promise-plugin/www/promise.js",
      "pluginId": "es6-promise-plugin",
      "runs": true
    },
    {
      "id": "cordova-plugin-x-socialsharing.SocialSharing",
      "file": "plugins/cordova-plugin-x-socialsharing/www/SocialSharing.js",
      "pluginId": "cordova-plugin-x-socialsharing",
      "clobbers": [
        "window.plugins.socialsharing"
      ]
    },
    {
      "id": "com.verso.cordova.clipboard.Clipboard",
      "file": "plugins/com.verso.cordova.clipboard/www/clipboard.js",
      "pluginId": "com.verso.cordova.clipboard",
      "clobbers": [
        "cordova.plugins.clipboard"
      ]
    },
    {
      "id": "cordova-plugin-idfa.Idfa",
      "file": "plugins/cordova-plugin-idfa/www/Idfa.js",
      "pluginId": "cordova-plugin-idfa",
      "merges": [
        "cordova.plugins.idfa"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-whitelist": "1.3.5",
    "cordova-custom-config": "5.1.1",
    "monaca-plugin-monaca-core": "3.3.1",
    "cordova-plugin-inappbrowser": "6.0.0",
    "admob-plus-cordova": "2.0.0-alpha.13",
    "cordova-plugin-device": "3.0.0",
    "cordova-launch-review": "4.1.1",
    "cordova-plugin-customurlscheme": "5.0.2",
    "es6-promise-plugin": "4.2.2",
    "cordova-plugin-x-socialsharing": "6.0.4",
    "com.verso.cordova.clipboard": "0.1.0",
    "cordova-plugin-wkwebviewxhrfix": "1.0.0",
    "cordova-plugin-idfa": "3.0.0"
  };
});