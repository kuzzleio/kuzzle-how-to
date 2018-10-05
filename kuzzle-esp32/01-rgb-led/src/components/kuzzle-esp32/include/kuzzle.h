/*! \mainpage Kuzzle ESP32 User's Guide
 *
 * \section intro_sec Introduction
 *
 * This is the introduction.
 *
 * \section install_sec Getting started

    - @ref kuzzle_init "Initialize Kuzzle ESP32 component"
    - @ref kuzzle_device_state_pub "Store/publish device state"
    - @ref receiving_partial_states "Receiving state changes from Kuzzle"
 */

/** \page receiving_partial_states Receiving state changes from Kuzzle
 * 
 * Once Kuzzle ESP32 component has been initialized, it will have subscribed et will receive
 * any request requiering the device to change his state. 
 * 
 * This is done by creating a document as follow in the collection `device-state`:
 *
 * ``` JSON
 * {
 *   "device_id": "my-device-id",
 *   "partial_state": true,
 *   "state": {
 *     "g": 0,
 *   }
 * }
 * ```
 * The `partial_state` property set to `true` indicates the document doesn't contain the 
 * whole state of the device, but rather represent a directive.
 * 
 * The target device is reponsible for applying the requested change to its state, and shall
 * then publish a new full state.
 * 
 * Using previous exemple, an RGB light whose state would be
 * ``` JSON
 * {
 *   "device_id": "my-device-id",
 *   "device_type": "k-rgb-light",
 *   "partial_state": false,
 *   "state": {
 *     "r": 255,
 *     "g": 255,
 *     "b": 255,
 *     "on": true
 *   }
 * }
 * ```
 * 
 * After applying the requested changes to its state, would publish a new full state as follow:
 * 
 * ``` JSON
 * {
 *   "device_id": "my-device-id",
 *   "device_type": "k-rgb-light",
 *   "partial_state": false,
 *   "state": {
 *     "r": 255,
 *     "g": 0,
 *     "b": 255,
 *     "on": true
 *   }
 * }
 * ```
 * 
 * In you application, when the device will receive a state change request, the provided \ref on_connected 
 * callback will be called with the partial state as parameter.
 * 
 * Here is an example of implementing such a function:
 * 
 * ``` C
 * void kuzzle_on_light_state_update(cJSON *jpartial_state)
 * {
 *   cJSON *jstatus = cJSON_GetObjectItem(jpartial_state, "status");
 *   assert(jstatus != NULL);
 * 
 *   int16_t status_value = jstatus->valueint;
 * 
 *   if (status_value == K_STATUS_NO_ERROR)
 *   {
 *     cJSON *jresult = cJSON_GetObjectItem(jpartial_state, "result");
 *     cJSON *jsource = cJSON_GetObjectItem(jresult, "_source");
 *     cJSON *jstate = cJSON_GetObjectItem(jsource, "state");
 * 
 *     cJSON *r = cJSON_GetObjectItem(jstate, "r");
 *     if (r != NULL)
 *       _light_state.r = r->valueint;
 * 
 *     cJSON *g = cJSON_GetObjectItem(jstate, "g");
 *     if (g != NULL)
 *       _light_state.g = g->valueint;
 * 
 *     cJSON *b = cJSON_GetObjectItem(jstate, "b");
 *     if (b != NULL)
 *       _light_state.b = b->valueint;
 * 
 *     cJSON *on = cJSON_GetObjectItem(jstate, "on");
 *     if (on != NULL)
 *       _light_state.on = on->valueint;
 * 
 *     ESP_LOGD(TAG,
 *              "New light state: r= 0x%02x, g= 0x%02x, b= 0x%02x, on = %s",
 *              _light_state.r,
 *              _light_state.g,
 *              _light_state.b,
 *              _light_state.on ? "true" : "false");
 * 
 *     _update_light(); // Applies the new state to the hardware and publish it to Kuzzle
 *   }
 *   else
 *   {
 *     ESP_LOGD(TAG, "Error: Something went wrong");
 *   }
 * }
 * ```
 * 
 */


/**
 * @file kuzzle.h
 * @author Eric TROUSSET
 * @brief Kuzzle ESP32 API for IoT
 * \ingroup kuzzle
 */

/** \defgroup kuzzle Kuzzle ESP32 
 * */


#ifndef __KUZZLE_IOT_H
#define __KUZZLE_IOT_H

#include "cJSON.h"
#include "stdint.h"

/** \addtogroup kuzzle 
 * @{
 */

#define K_DOCUMENT_MAX_SIZE 512  /**< The maximum size a Kuzzle document can have*/
#define K_REQUEST_MAX_SIZE 1024 /**< The maximum size a Kuzzle request can have*/
#define K_DEVICE_ID_MAX_SIZE 32 /**< The maximum length if the device UID*/

#define K_STATUS_NO_ERROR 200  /**< Kuzzle no error status code*/

/**
 * @brief Kuzzle ESP32 error codes
 */
enum k_err {
    K_ERR_NONE = 0,        /**< No error */
    K_ERR_MQTT_ERROR,      /**< Failed to init MQTT */
    K_ERR_ALREADY_INIT     /**< Kuzzle component has already been initilized*/
};

typedef enum k_err k_err_t;

typedef void (*kuzzle_callback)(cJSON* jresponse);
typedef void (*kuzzle_connected_cd)(void);

typedef char  k_device_id_t[K_DEVICE_ID_MAX_SIZE];
typedef char* k_device_type_t;

/**
 * @brief Kuzzle settings
 * 
 * This structure is used to initialise Kuzzle ESP32 component via \ref kuzzle_init.
 */
typedef struct kuzzle_settings {
    k_device_id_t   device_id;  ///< A string that uniquely identifies the device
    k_device_type_t device_type; ///< A string that identifies the type of device

    char*    host;  ///< Kuzzle hostname
    uint32_t port;  ///< Kuzzle MQTT port (MQTT protocol needs to be installed: <https://github.com/kuzzleio/protocol-mqtt>)

    const char* username; ///< A valid `username` (using `local` authentication strategy). If set to NULL, we'll try to connect anonymously to Kuzzle.
    const char* password; ///< The password for `username` (using `local` authentication strategy)

    kuzzle_callback     on_fw_update_notification;  ///< Client callback to be called when a new firmware is available. Can be NULL.
    kuzzle_callback     on_device_state_changed_notification; ///< Client callback to be called when a state change is requested from Kuzzle. Can be NULL. See \ref receiving_partial_states
    kuzzle_connected_cd on_connected;  ///< Client callback to be called when the device is properlly connected to Kuzzle. Can be NULL.

} kuzzle_settings_t;

#define K_DEVICE_ID_FMT "%s"
#define K_DEVICE_ID_ARGS(device_id) (device_id)

/**
 * @brief Initialise Kuzzle ESP32 component.
 * 
 * **Usage**:
 * ~~~~~~~~~~~~~~~{.c}
 *  static kuzzle_settings_t _k_settings = {
 *    .host = "the ip or hostname of kuzzle",
 *    .port = 1883,
 *    .device_type = "DEVICE_TYPE",
 *    .device_id = "my-device-id", // This has to be unique for each device
 *    .on_fw_update_notification = NULL,
 *    .on_device_state_changed_notification = kuzzle_on_light_state_update,
 *    .on_connected = on_kuzzle_connected
 *  };
 * 
 *  if(kuzzle_init(&_k_settings) != K_ERR_NONE) {
 *    ESP_LOGE(TAG, "Failed to initialise Kuzzle ESP32 module");
 *  }
 * ~~~~~~~~~~~~~~~
 * 
 * @param settings
 * 
 * @return
 */
k_err_t kuzzle_init(kuzzle_settings_t* settings);

/**
 * @brief Store the device state in Kuzzle.
 * 
 * @param device_state: the state of the device as a JSON object string (e.g. "{ "myprop1": "value", "myprop2": false ...}")
 * 
 * Publish the complete state of the device on Kuzzle.
 * 
 * Typicaly, when the state of your device has changed, you need to publish/store it in Kuzzle so that any application
 * wanting to do something with it is aware of the new state of the device.
 * 
 * Here is an exemple on how you would do it for a RGB light:
 * ~~~~~~~~~~~~~~~{.c}
 * 
 * // This is the definition of how the device keeps track of its state internally
 * typedef struct light_state
 * {
 *   uint8_t r;
 *   uint8_t g;
 *   uint8_t b;
 * 
 *   bool on; ///< true if light is on, false if off
 * } light_state_t;
 * 
 * static light_state_t _light_state = {.r = 0xFF, .g = 0xFF, .b = 0xFF, .on = true};
 * 
 * // This is the preformated string that represent how it will be published or stored
 * // in Kuzzle. (Kuzzle works with JSON documents)
 * static const char *light_body_fmt =
 *     "{ \"r\": %d, \"g\": %d, \"b\": %d, \"on\": %s}";
 * 
 * // Call this function whenever the state of your device changed
 * static void _publish_light_state()
 * {
 *   char device_state_body[K_DOCUMENT_MAX_SIZE] = {0};
 * 
 *   snprintf(device_state_body,
 *            K_DOCUMENT_MAX_SIZE,
 *            light_body_fmt,
 *            _light_state.r,
 *            _light_state.g,
 *            _light_state.b,
 *            _light_state.on ? "true" : "false");
 *   kuzzle_device_state_pub(device_state_body); 
 * }
 * ~~~~~~~~~~~~~~~
 * 
 */
void kuzzle_device_state_pub(const char* jstate);

/**
 * @brief kuzzle_get_device_id
 * @return
 */
const char *kuzzle_get_device_id();

/** @}*/
#endif // __KUZZLE_IOT_H
