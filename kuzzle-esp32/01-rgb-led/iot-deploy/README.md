# iot-deploy

Tools to deploy a simple IoT environment to your Kuzzle.

## Configuration

Edit info in `config/default.json` to specify where to find your Kuzzle. You can create several configuration file and the script will ask for the configuration to use. This can be handy if you have several environments.

Launch `node iot-init.js` to create an **iot** index with base collections to handle your devices.

This work is an early stage WIP

## Collections

| Collection | Usage |
|------------|:----------|
| **device-state** | This collection stores the state of the devices |
| **device-info** | This collection is where to store static information about the device (user it belongs to, current firmware version, friendly name...) |
| **fw-update** | This collection allow handling firmware updates for devices |

### device-state mapping

```javascript
{
  "device_id" : "string_uid",          // an UID that identify the device the state represents
  "device_type": "string_dev_type_id", // An ID that identity the kind of device at hardware level
  "state" : {                          // Set of properties that represents the current state of the device.
    "prop_1" : value1,
    "prop_2" : value2,
    .
    .
    .
    "prop_N" : valueN,
      }
}
```
