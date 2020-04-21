# iot-deploy

A tool creating the data structures necessary to this how-to in a Kuzzle instance.

## Configuration

Copy `config.default.json` to folder `config`, and edit to configure connection to your Kuzzle Backend instance.

``` bash
$ cp config.default.json config/my-local-instance.json
```

Edit info in the newly created configuration file to specify where to find your Kuzzle. You can create several configuration file and the script will ask for the configuration to use. This can be handy if you have several environments.

Configuration file:

``` JSON
{
  "kuzzle" : {
    "host" : "localhost", // Hostname or ip addr of your Kuzzle instance
    "port": "7512", // Port of your Kuzzle isntance
    "index": "iot", // The index to use for your iot index
    "user": ""      // a user name if anonymous has been disabled
  }
}
```

Launch `node iot-init.js` to create an **iot** index with base collections to handle your devices.

## Collections

| Collection | Usage |
|------------|:----------|
| **device-state** | This collection stores the state of the devices |
| **device-info** | This collection is where to store static information about the device (user it belongs to, current firmware version, friendly name...) |
| **fw-update** | This collection allow handling firmware updates for devices |

### device-state mapping

```javascript
{
  "device_id" : "string_uid",          // Device unique identifier
  "device_type": "string_dev_type_id", // An ID that identity the kind of device at hardware level
  "state" : {                          // The device's current state
    "prop_1" : value1,
    "prop_2" : value2,
    .
    .
    .
    "prop_N" : valueN,
      }
}
```


Discord: [Join our community](https://join.discord.kuzzle.io)  
Github: [You can also see this on Github](https://github.com/kuzzleio/kuzzle-how-to/tree/master/kuzzle-esp32/01-rgb-led/iot-deploy)
