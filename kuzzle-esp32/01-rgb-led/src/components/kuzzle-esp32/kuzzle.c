#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

#include "esp_log.h"
#include "esp_system.h"
#include <string.h>

#include "kuzzle.h"

#include "malloc.h"
#include "mqtt_client.h"

#define TAG "KUZZLE"

//!< Kuzzle sample IOT index and collections

#define K_INDEX_IOT "iot" //!< The index where our IOT collection where be located
#define K_COLLECTION_DEVICE_INFO \
  "device-info" //!< A collection of IOT devices (this collection will contain general inforamtion about our devices)
#define K_COLLECTION_DEVICE_STATES \
  "device-state" //!< A collection of IOT devices (this collection will contain general inforamtion about our devices)
#define K_COLLECTION_FW_UPDATES                                                                                                \
  "fw-updates" /*!< This collection will keep track of available firmwares for our devices. Devices can query or/and subscribe \
                to this collection with filter to check for firmware updates */

/// Kuzzle controllers
/// See http:// TODO:   for more details on Kuzzle controllers
#define K_CONTROLLER_REALTIME "realtime" //!< This the controller responsible for handling subscribtions
#define K_CONTROLLER_DOCUMENT "document" //!< This is the controller responsible for handle documents

//!< This tag is used to track response from a 'new firmware' query
#define REQ_ID_FW_UPDATE "fw_update"

//!< This tag is used to track response from a own state subscribtion query
#define REQ_ID_SUBSCRIBE_STATE "sub_state"

//!< This tag is used to track response from
//!<a firmware update notification subscribtion
#define REQ_ID_SUBSCRIBE_FW_UPDATE "sub_fw_update"

//!< This tag is used to track reponse from publish the device own state (this allow for avoiding trying
//! the apply and re-publish a state we just published)
#define REQ_ID_PUBLISH_OWN_STATE "publish_own_state"

#define REQ_ID_LOGIN "login"

//!< Kuzzle MQTT topics:

static const char *KUZZLE_REQUEST_TOPIC = "Kuzzle/request";   //!< This is the MQTT where to post Kuzzle queries
static const char *KUZZLE_RESPONSE_TOPIC = "Kuzzle/response"; //!< This is the MQTT to susbcribe to receive Kuzzle responses

/// Device state publishing Kuzzle query fmt string
static const char *pubish_device_state_fmt =
    "{\"index\":\"" K_INDEX_IOT "\",\"collection\":\"" K_COLLECTION_DEVICE_STATES "\",\"controller\":\"" K_CONTROLLER_DOCUMENT
    "\",\"action\":\"create\",\"body\": { \"device_id\" : \"" K_DEVICE_ID_FMT
    "\", \"device_type\":\"%s\",  \"partial_state\": false, \"state\" : %s}}";

static const char *login_request_fmt =
    "{ \"controller\": \"auth\", \"action\": \"login\", \"strategy\": \"%s\", \"expiresIn\": \"%s\",\"requestId\":\"" REQ_ID_LOGIN
    "\", "
    "\"body\": { \"username\": \"%s\", \"password\": \"%s\"}}";

/// Kuzzle subscribe query fmt string
/// Parameters:
/// @param collection: The collection
/// @param requestId: the id of the request in order to be able to identify the responce
/// @param body: a Kuzzle DSL query to subscribe to, see http://the doc TODO add link to documentation
static const char *subscribe_req_fmt =
    "{\"index\":\"" K_INDEX_IOT "\",\"collection\":\"%s\",\"controller\":\"" K_CONTROLLER_REALTIME
    "\",\"action\":\"subscribe\",\"requestId\":\"%s\",\"body\":%s}";

/// Kuzzle DSL queries for subscribing to own state and to fw update
static const char *subscribe_own_state_fmt =
    "{\"and\":[{\"equals\":{\"device_id\": \"" K_DEVICE_ID_FMT "\"}},{\"equals\": {\"partial_state\": true}}]}";
//"{\"equals\":{\"device_id\": \"" K_DEVICE_ID_FMT "\"}}";
static const char *subscribe_fw_updates_fmt = "{\"equals\":{\"target\": \"%s\"}}";

static const char *get_fw_update_req_fmt =
    "{\"index\":\"" K_INDEX_IOT "\",\"collection\":\"" K_COLLECTION_FW_UPDATES "\",\"controller\":\"" K_CONTROLLER_DOCUMENT
    "\",\"action\":\"search\",\"requestId\":\"" REQ_ID_FW_UPDATE "\",\"body\":"
    "{\"size\": 1,\"query\":{\"match\" :{\"target.keyword\":"
    "\"%d\"}},\"sort\":{\"_kuzzle_info.createdAt\":{\"order\":"
    "\"desc\"}}}}";

typedef enum
{
  K_STATE_NONE,
  K_STATE_SUBSCRIBING_KUZZLE_RESPONSE,
  K_STATE_LOGING_IN,
  K_STATE_SUBSCRIBING_FW_UPDATE,
  K_STATE_SUBSCRIBING_DEVICE_OWN_STATE,
  K_STATE_READY,
} k_state_t;

// -- MQTT callbacks --
static esp_err_t _on_mqtt_event(esp_mqtt_event_t *event_data);
static esp_err_t _on_mqtt_connected(esp_mqtt_event_t *event_data);
static esp_err_t _on_mqtt_disconnected(esp_mqtt_event_t *event_data);
static esp_err_t _on_mqtt_subscribed(esp_mqtt_event_t *event_data);
static esp_err_t _on_mqtt_published(esp_mqtt_event_t *event_data);
static esp_err_t _on_mqtt_data_received(esp_mqtt_event_t *event_data);

// -- MQTT settings --
static esp_mqtt_client_config_t _mqtt_settings = {
    .disable_auto_reconnect = false,
    .host = NULL, // or domain, ex: "google.com",
    .port = 0,
    .client_id = NULL,
    .username = "",
    .password = "",
    .disable_clean_session = true,
    .keepalive = 120, // second
    .lwt_topic = "",  //"/lwt",    // = "" for disable lwt, will don't care other options
    .lwt_msg = "offline",
    .lwt_qos = 0,
    .lwt_retain = 0,
    .event_handle = _on_mqtt_event,
};

typedef struct
{
  kuzzle_settings_t *s;
  esp_mqtt_client_handle_t mqtt_client;
  char *jwt;

  bool subscribed_fw_updates;
  bool subscribed_state;

  char *mqtt_topic;   ///< Contains the topic of the mqtt message being received (a message can be received accross several
                      /// callbacks)
  char *mqtt_message; ///< Buffer that will contain the full message

  k_state_t state;
} kuzzle_priv_t;

static kuzzle_priv_t _kuzzle = {0};

k_err_t kuzzle_init(kuzzle_settings_t *settings)
{
  ESP_LOGD(TAG, "Initialising Kuzzle");

  if (_kuzzle.mqtt_client != NULL)
  {
    ESP_LOGW(TAG, "Kuzzle already initialized...");
    return K_ERR_ALREADY_INIT;
  }

  _kuzzle.s = settings;

  _mqtt_settings.host = strdup(settings->host);
  _mqtt_settings.port = settings->port;

  char *buffer = malloc(MQTT_MAX_CLIENT_LEN);
  snprintf(buffer, MQTT_MAX_CLIENT_LEN,
           K_DEVICE_ID_FMT, K_DEVICE_ID_ARGS(settings->device_id));
  _mqtt_settings.client_id = buffer;
  _kuzzle.mqtt_client = esp_mqtt_client_init(&_mqtt_settings);

  if( _kuzzle.mqtt_client) {
    esp_mqtt_client_start(_kuzzle.mqtt_client);
  }
  else 
    return !K_ERR_NONE;

  return K_ERR_NONE;
}

/**
 * @brief kuzzle_get_device_id
 * @return
 */
const char *kuzzle_get_device_id()
{
  return _kuzzle.s->device_id;
}

/**
 * @brief kuzzle_check_for_update
 *
 * Check with the back-end if a newer version of the firmware
 * is available for download
 */
void kuzzle_query_for_fw_update()
{
  if (_kuzzle.mqtt_client == NULL)
  {
    ESP_LOGW(TAG, "MQTT client not initialized yet...")
  }
  else
  {
    ESP_LOGD(TAG, "Publishing msg: %s", get_fw_update_req_fmt);
    esp_mqtt_client_publish(_kuzzle.mqtt_client, KUZZLE_REQUEST_TOPIC, get_fw_update_req_fmt, strlen(get_fw_update_req_fmt), 0, 0);
  }
}

/**
 * @brief kuzzle_login
 */
void kuzzle_login()
{
  if (_kuzzle.mqtt_client == NULL)
  {
    ESP_LOGW(TAG, "kuzzle_login: MQTT client not initialized yet...")
  }
  else
  {
    char req_buffer[K_REQUEST_MAX_SIZE] = {0};

    _kuzzle.state = K_STATE_LOGING_IN;
    snprintf(req_buffer, K_REQUEST_MAX_SIZE, login_request_fmt, "local", "1d", _kuzzle.s->username, _kuzzle.s->password);

    ESP_LOGD(TAG, "Publishing msg: %s", req_buffer);
    esp_mqtt_client_publish(_kuzzle.mqtt_client, KUZZLE_REQUEST_TOPIC, req_buffer, strlen(req_buffer), 0, 0);
  }
}

/**
 * @brief _kuzzle_request_add_jwt_token
 *
 * Will add the jwt token if logged in
 *
 * @param request
 * @return request : must be deleted with free()
 */
static char *_query_add_jwt_token(const char *query)
{
  if (_kuzzle.jwt == NULL)
  {
    return strdup(query);
  }
  else
  {
    cJSON *j_req = cJSON_Parse(query);
    cJSON_AddItemToObject(j_req, "jwt", cJSON_CreateString(_kuzzle.jwt));
    char *res = cJSON_Print(j_req);
    cJSON_Delete(j_req);
    return res;
  }
}

static void _publish_kuzzle_query(const char *query)
{
  char *req = _query_add_jwt_token(query);
  ESP_LOGD(TAG, "Publishing msg: %s", query);
  esp_mqtt_client_publish(_kuzzle.mqtt_client, KUZZLE_REQUEST_TOPIC, req, strlen(req), 0, 0);
  free(req);
}

/**
 * @brief kuzzle_device_state_pub
 * @param device_state: the state of the device as a JSON object string (e.g. "{ "myprop1": "value", "myprop2": false ...}")
 */
void kuzzle_device_state_pub(const char *device_state)
{
  if (_kuzzle.state != K_STATE_READY)
  {
    ESP_LOGW(TAG, "Kuzzle not ready to publish state...");
    return;
  }

  if (_kuzzle.mqtt_client == NULL)
  {
    ESP_LOGW(TAG, "MQTT client not initialized yet...")
  }
  else
  {
    char req_buffer[K_REQUEST_MAX_SIZE] = {0};
    snprintf(req_buffer,
             K_REQUEST_MAX_SIZE,
             pubish_device_state_fmt,
             K_DEVICE_ID_ARGS(_kuzzle.s->device_id),
             _kuzzle.s->device_type,
             device_state);
    _publish_kuzzle_query(req_buffer);
  }
}

/**
 * @brief kuzzle_subscribe_to_state
 *
 * Subscribe to own state to update from cloud
 */
void kuzzle_device_own_state_sub()
{
  ESP_LOGD(TAG, "Subscribing to own state: " K_DEVICE_ID_FMT, K_DEVICE_ID_ARGS(_kuzzle.s->device_id));

  if (_kuzzle.mqtt_client == NULL)
  {
    ESP_LOGW(TAG, "MQTT client not initialized yet...");
  }
  else
  {
    char query_buffer[K_DOCUMENT_MAX_SIZE] = {0};
    char req_buffer[K_REQUEST_MAX_SIZE] = {0};

    _kuzzle.state = K_STATE_SUBSCRIBING_DEVICE_OWN_STATE;

    snprintf(query_buffer, K_DOCUMENT_MAX_SIZE, subscribe_own_state_fmt, K_DEVICE_ID_ARGS(_kuzzle.s->device_id));
    snprintf(
        req_buffer, K_REQUEST_MAX_SIZE, subscribe_req_fmt, K_COLLECTION_DEVICE_STATES, REQ_ID_SUBSCRIBE_STATE, query_buffer);

    _publish_kuzzle_query(req_buffer);
  }
}

/**
 * @brief kuzzle_fw_update_sub
 */
void kuzzle_fw_update_sub()
{
  ESP_LOGD(TAG, "Subscribing to fw update %s", _kuzzle.s->device_type);

  if (_kuzzle.mqtt_client == NULL)
  {
    ESP_LOGW(TAG, "MQTT client not initialized yet...")
  }
  else
  {
    char query_buffer[K_DOCUMENT_MAX_SIZE] = {0};
    char req_buffer[K_REQUEST_MAX_SIZE] = {0};

    _kuzzle.state = K_STATE_SUBSCRIBING_FW_UPDATE;
    snprintf(query_buffer, K_DOCUMENT_MAX_SIZE, subscribe_fw_updates_fmt, _kuzzle.s->device_type);

    snprintf(
        req_buffer, K_REQUEST_MAX_SIZE, subscribe_req_fmt, K_COLLECTION_FW_UPDATES, REQ_ID_SUBSCRIBE_FW_UPDATE, query_buffer);

    _publish_kuzzle_query(req_buffer);
  }
}

/**
 * @brief _on_device_state_changed
 * @param jresponse
 */
void _on_device_state_changed(cJSON *jresponse)
{
  ESP_LOGD(TAG, "Device state changed");

  if (_kuzzle.s->on_device_state_changed_notification)
  {
    ESP_LOGD(TAG, "->Calling app callback");
    _kuzzle.s->on_device_state_changed_notification(jresponse);
  }
}

/**
 * @brief _on_fw_update_pushed
 * @param jresponse
 */
static void _on_fw_update_pushed(cJSON *jresponse)
{
  ESP_LOGD(TAG, "Firmware update pushed from Kuzzle");

  cJSON *jresult = cJSON_GetObjectItem(jresponse, "result");
  cJSON *jfwdoc = cJSON_GetObjectItem(jresult, "_source");

  if (_kuzzle.s->on_fw_update_notification)
  {
    ESP_LOGD(TAG, "->Calling app callback");
    _kuzzle.s->on_fw_update_notification(jfwdoc);
  }
}

void _log_responce_error_message(cJSON *jerror)
{
  cJSON *jstatus = cJSON_GetObjectItem(jerror, "status");
  assert(jstatus != NULL);
  int16_t status = jstatus->valueint;

  cJSON *jmessage = cJSON_GetObjectItem(jerror, "message");
  assert(jmessage != NULL);
  char *message = jmessage->valuestring;

  ESP_LOGE(TAG, "Error %d: %s", status, message);
}

static void _on_login_response(cJSON *jlogin)
{
  cJSON *jjwt = cJSON_GetObjectItem(jlogin, "jwt");
  assert(jjwt != NULL);
  assert(jjwt->type = cJSON_String);

  _kuzzle.jwt = strdup(jjwt->valuestring);

  // TODO: add a logged in callback?
  // -- publish current state --
  //    kuzzle_publish_state();  // TODO
  // -- subscribe to own state --
  kuzzle_device_own_state_sub();
}
/**
 * @brief _on_response
 * @param jresponse the cJSON of Kuzzle response
 */
static void _on_response(cJSON *jresponse)
{
  cJSON *jrequestid = cJSON_GetObjectItem(jresponse, "requestId");
  assert(jrequestid != NULL);
  assert(jrequestid->type == cJSON_String);

  /* -- Parse response status -- */

  cJSON *jstatus = cJSON_GetObjectItem(jresponse, "status");
  assert(jstatus != NULL);

  int16_t status_value = jstatus->valueint;

  if (jstatus)
  {
    ESP_LOGD(TAG, "Kuzzle response: status = %d", status_value);
  }
  else
  {
    ESP_LOGE(TAG, "ERROR: jstatus is NULL!!!!");
  }

  if (status_value == K_STATUS_NO_ERROR)
  {
    if (strcmp(REQ_ID_FW_UPDATE, jrequestid->valuestring) == 0)
    {
      ESP_LOGD(TAG, "response to fw_update req");
      // -- received response from fw_update request -- //
      cJSON *jresult = cJSON_GetObjectItem(jresponse, "result");
      cJSON *jtotal = cJSON_GetObjectItem(jresult, "total");
      assert(jtotal->type == cJSON_Number);

      if (jtotal->valueint < 1)
      {
        ESP_LOGW(TAG, "No info found about available firmware");
      }
      else
      {
        cJSON *jhits = cJSON_GetObjectItem(jresult, "hits");
        cJSON *jfwdoc = cJSON_GetObjectItem(cJSON_GetArrayItem(jhits, 0), "_source");

        if (_kuzzle.s->on_fw_update_notification != NULL)
        {
          ESP_LOGD(TAG, "-> Call application callback");
          _kuzzle.s->on_fw_update_notification(jfwdoc);
        }
      }
    }
    else if (strcmp(REQ_ID_SUBSCRIBE_STATE, jrequestid->valuestring) == 0)
    {
      ESP_LOGD(TAG, LOG_COLOR(LOG_COLOR_GREEN) "Received response from STATE sub");

      cJSON *jresult = cJSON_GetObjectItem(jresponse, "result");
      cJSON *jchannel = cJSON_GetObjectItem(jresult, "channel");

      assert(jchannel->type == cJSON_String);

      esp_mqtt_client_subscribe(_kuzzle.mqtt_client, jchannel->valuestring, 0);
    }
    else if (strcmp(REQ_ID_SUBSCRIBE_FW_UPDATE, jrequestid->valuestring) == 0)
    {
      ESP_LOGD(TAG, LOG_COLOR(LOG_COLOR_GREEN) "Received response from FW UPDATES sub");

      cJSON *jresult = cJSON_GetObjectItem(jresponse, "result");
      cJSON *jchannel = cJSON_GetObjectItem(jresult, "channel");

      assert(jchannel->type == cJSON_String);

      esp_mqtt_client_subscribe(_kuzzle.mqtt_client, jchannel->valuestring, 0);
    }
    else if (strcmp(REQ_ID_LOGIN, jrequestid->valuestring) == 0)
    {
      ESP_LOGD(TAG, LOG_COLOR(LOG_COLOR_GREEN) "Received response from LOGIN");
      cJSON *jresult = cJSON_GetObjectItem(jresponse, "result");
      _on_login_response(jresult);
    }
  }
  else
  {
    cJSON *jerror = cJSON_GetObjectItem(jresponse, "error");
    assert(jerror != NULL);

    _log_responce_error_message(jerror);
  }

  return;
}

static esp_err_t _on_mqtt_event(esp_mqtt_event_t *event_data)
{
  switch (event_data->event_id)
  {
  case MQTT_EVENT_CONNECTED:
    _on_mqtt_connected(event_data);
    break;
  case MQTT_EVENT_DISCONNECTED:
    _on_mqtt_disconnected(event_data);
    break;
  case MQTT_EVENT_SUBSCRIBED:
    _on_mqtt_subscribed(event_data);
    break;
  case MQTT_EVENT_PUBLISHED:
    _on_mqtt_published(event_data);
    break;
  case MQTT_EVENT_DATA:
    _on_mqtt_data_received(event_data);
    break;
  default:
    ESP_LOGW(TAG, "Unhandled MQTT event %d", event_data->event_id);
    break;
  }

  return ESP_OK;
}

/**
 * @brief mqtt_connected
 * @param client
 * @param event_data
 */
static esp_err_t _on_mqtt_connected(esp_mqtt_event_t *event_data)
{
  ESP_LOGD(TAG, "MQTT: connected");

  _kuzzle.state = K_STATE_SUBSCRIBING_KUZZLE_RESPONSE;

  // Scubscribe to Kuzzle response topic
  esp_mqtt_client_subscribe(event_data->client, KUZZLE_RESPONSE_TOPIC, 0);
  return ESP_OK;
}

/**
 * @brief mqtt_disconnected
 * @param client
 * @param event_data
 */
static esp_err_t _on_mqtt_disconnected(esp_mqtt_event_t *event_data)
{
  _kuzzle.state = K_STATE_NONE;
  ESP_LOGD(TAG, "MQTT: disconnected");
  return ESP_OK;
}

/**
 * @brief _on_mqtt_subscribed
 * @param client
 * @param event_data
 */
static esp_err_t _on_mqtt_subscribed(esp_mqtt_event_t *event_data)
{

  switch (_kuzzle.state)
  {
  case K_STATE_SUBSCRIBING_KUZZLE_RESPONSE:
    ESP_LOGD(TAG, "MQTT: subscribed to topic: %s", KUZZLE_RESPONSE_TOPIC);
    if (_kuzzle.s->username != NULL)
    {
      kuzzle_login();
    }
    else
    {
      ESP_LOGD(TAG, "No user credential provided, assuming ANONYMOUS");
      kuzzle_device_own_state_sub();
    }
    break;

  case K_STATE_SUBSCRIBING_DEVICE_OWN_STATE:
    ESP_LOGD(TAG, "MQTT: subscribed to topic: %s", "Device own state");
    kuzzle_fw_update_sub();
    break;

  case K_STATE_SUBSCRIBING_FW_UPDATE:
    ESP_LOGD(TAG, "MQTT: subscribed to topic: %s", "firmware update");
    _kuzzle.state = K_STATE_READY;
    if (_kuzzle.s->on_connected)
      _kuzzle.s->on_connected();
    break;
  default:
    break;
  }

  return ESP_OK;
}

/**
 * @brief mqtt_published
 * @param client
 * @param event_data
 */
static esp_err_t _on_mqtt_published(esp_mqtt_event_t *event_data)
{
  ESP_LOGD(TAG, "MQTT: published");
  return ESP_OK;
}

/**
 * @brief mqtt_data_received
 * @param client
 * @param event_data
 */
static esp_err_t _on_mqtt_data_received(esp_mqtt_event_t *event_data)
{
  cJSON *jresponse = NULL;

  ESP_LOGD(TAG,
           "MQTT: data received: %d (%d/%d)",
           event_data->data_len,
           event_data->current_data_offset + event_data->data_len,
           event_data->total_data_len);

  //    ESP_LOGD(TAG, "\tfrom topic: %.*s", event_data->topic_len, event_data->topic);
  //    ESP_LOGD(TAG, "\tdata: %.*s", event_data->data_length, event_data->data);

  if (event_data->topic)
  {
    // if the event contains the topic, then, 
    // it's the first data chunck of a message that might arrive 
    // through reseral MQTT messages

    _kuzzle.mqtt_topic = malloc(event_data->topic_len + 1);
    memcpy(_kuzzle.mqtt_topic, event_data->topic, event_data->topic_len);
    _kuzzle.mqtt_topic[event_data->topic_len] = 0;

    _kuzzle.mqtt_message = malloc(event_data->total_data_len + 1);
    _kuzzle.mqtt_message[event_data->total_data_len] = 0;
  }

  memcpy(_kuzzle.mqtt_message + event_data->current_data_offset, event_data->data, event_data->data_len);

  if (event_data->current_data_offset + event_data->data_len == event_data->total_data_len)
  {
    ESP_LOGD(TAG, "Message fully received on topic: %.*s", event_data->topic_len, event_data->topic);
    ESP_LOGI(TAG, "%s", _kuzzle.mqtt_message);

    jresponse = cJSON_Parse(_kuzzle.mqtt_message);

    if (jresponse == NULL)
      goto done;

    if (strcmp(_kuzzle.mqtt_topic, KUZZLE_RESPONSE_TOPIC) == 0)
    {
      _on_response(jresponse);
    }
    else
    {
      // switch according to the source collection to see if its a FW_UPDATE or STATE change nofitication
      // As we subscribe only once per collection, we can use the collection name to identify the source
      // of the notification

      cJSON *jtype = cJSON_GetObjectItem(jresponse, "type");

      if (jtype != NULL && strcmp(jtype->valuestring, "TokenExpired") == 0)
      {
        ESP_LOGW(TAG, "Login token expired, renewing login and subscriptions");
        kuzzle_login();
        goto done;
      }

      cJSON *jcollection = cJSON_GetObjectItem(jresponse, "collection");

      if (strcmp(jcollection->valuestring, K_COLLECTION_DEVICE_STATES) == 0)
      {
        _on_device_state_changed(jresponse);
      }
      else if (strcmp(jcollection->valuestring, K_COLLECTION_FW_UPDATES) == 0)
        _on_fw_update_pushed(jresponse);
    }
  }

done:
  if (jresponse != NULL)
    cJSON_Delete(jresponse);
  free(_kuzzle.mqtt_message);
  free(_kuzzle.mqtt_topic);
  _kuzzle.mqtt_message = NULL;
  _kuzzle.mqtt_topic = NULL;

  ESP_LOGD("MEM", LOG_BOLD(LOG_COLOR_PURPLE) "free mem: %d", esp_get_free_heap_size());

  return ESP_OK;
}
