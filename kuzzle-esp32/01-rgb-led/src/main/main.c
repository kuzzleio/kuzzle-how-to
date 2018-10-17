
#include "esp_event.h"
#include "esp_event_loop.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"
#include <string.h>

#include "nvs_flash.h"

#include "driver/adc.h"
#include "driver/gpio.h"
#include "driver/ledc.h"

#include "cJSON.h"
#include "mqtt_client.h"

#include "k-ota.h"
#include "kuzzle.h"

#include "sdkconfig.h"

#define DEVICE_TYPE "k-rgb-light"

static const char *TAG = DEVICE_TYPE;

void kuzzle_on_light_state_update(cJSON *jpartial_state);
void on_kuzzle_connected();

static kuzzle_settings_t _k_settings = {
    .host = "iot.uat.kuzzle.io",
    .port = 1883,
    .device_type = DEVICE_TYPE,
    .device_id = "my-device-id", // This has to be unique for each device
    .on_fw_update_notification = NULL,
    .on_device_state_changed_notification = kuzzle_on_light_state_update,
    .on_connected = on_kuzzle_connected
};

// -- Hardware definition --
#define LEDC_MAX_PWM 8190

#define LEDC_TRANSITION_TIME 250 // ms

#define RED_PWM_CHANNEL LEDC_CHANNEL_0
#define RED_GPIO_NUM GPIO_NUM_25

#define GREEN_PWM_CHANNEL LEDC_CHANNEL_1
#define GREEN_GPIO_NUM GPIO_NUM_26

#define BLUE_PWM_CHANNEL LEDC_CHANNEL_2
#define BLUE_GPIO_NUM GPIO_NUM_27

typedef struct light_state
{
  uint8_t r;
  uint8_t g;
  uint8_t b;

  bool on; ///< true if light is on, false if off
} light_state_t;

static light_state_t _light_state = {.r = 0xFF, .g = 0xFF, .b = 0xFF, .on = true};

// -- publish --

static uint8_t uid[6] = {0};

static void _update_light();

static const char *light_body_fmt =
    "{ \"r\": %d, \"g\": %d, \"b\": %d, \"on\": %s}";

static void _publish_light_state()
{
  static char device_state_body[K_DOCUMENT_MAX_SIZE] = {0};

  snprintf(device_state_body,
           K_DOCUMENT_MAX_SIZE,
           light_body_fmt,
           _light_state.r,
           _light_state.g,
           _light_state.b,
           _light_state.on ? "true" : "false");
  kuzzle_device_state_pub(device_state_body);
}

void on_kuzzle_connected() { _publish_light_state(); }

/**
 * @brief kuzzle_on_light_state_update
 *
 * Handle the data from own state subscribsion
 *
 * @param jpartial_state
 */
void kuzzle_on_light_state_update(cJSON *jpartial_state)
{
  cJSON *jstatus = cJSON_GetObjectItem(jpartial_state, "status");
  assert(jstatus != NULL);

  int16_t status_value = jstatus->valueint;

  if (status_value == K_STATUS_NO_ERROR)
  {
    cJSON *jresult = cJSON_GetObjectItem(jpartial_state, "result");
    cJSON *jsource = cJSON_GetObjectItem(jresult, "_source");
    cJSON *jstate = cJSON_GetObjectItem(jsource, "state");

    cJSON *r = cJSON_GetObjectItem(jstate, "r");
    if (r != NULL)
      _light_state.r = r->valueint;

    cJSON *g = cJSON_GetObjectItem(jstate, "g");
    if (g != NULL)
      _light_state.g = g->valueint;

    cJSON *b = cJSON_GetObjectItem(jstate, "b");
    if (b != NULL)
      _light_state.b = b->valueint;

    cJSON *on = cJSON_GetObjectItem(jstate, "on");
    if (on != NULL)
      _light_state.on = on->valueint;

    ESP_LOGD(TAG,
             "New light state: r= 0x%02x, g= 0x%02x, b= 0x%02x, on = %s",
             _light_state.r,
             _light_state.g,
             _light_state.b,
             _light_state.on ? "true" : "false");

    _update_light();
  }
  else
  {
    ESP_LOGD(TAG, "Error: Something went wrong");
  }
}

/**
 * @brief event_handler
 * @param ctx
 * @param event
 * @return
 */
esp_err_t event_handler(void *ctx, system_event_t *event)
{
  switch (event->event_id)
  {
  // case SYSTEM_EVENT_STA_CONNECTED:
  //   ESP_LOGD(TAG, "Connected to WIFI");
  //   memcpy(_k_settings.device_id, uid, sizeof(k_device_id_t));
  //   kuzzle_init(&_k_settings);
  //   break;
  case SYSTEM_EVENT_STA_GOT_IP:
    ESP_LOGD(TAG, "Got ip addr");
    if(kuzzle_init(&_k_settings) != K_ERR_NONE) {
      ESP_LOGE(TAG, "Failed to initialise Kuzzle ESP32 module");
    }
    break;
  case SYSTEM_EVENT_STA_DISCONNECTED:
    ESP_LOGW(TAG, "Disonnected from AP...reconnecting...");
    esp_wifi_connect();
    break;
  default:
    ESP_LOGW(TAG, "event_handler: %d\n", event->event_id);
  }
  return ESP_OK;
}

/**
 * @brief _setup_light
 *
 * @details setup ASP LED controller
 */
static void _setup_light()
{
  static ledc_timer_config_t ledc_timer = {
      .bit_num = LEDC_TIMER_13_BIT,       // set timer counter bit number
      .freq_hz = 5000,                    // set frequency of pwm
      .speed_mode = LEDC_HIGH_SPEED_MODE, // timer mode,
      .timer_num = LEDC_TIMER_0           // timer index
  };
  ledc_timer_config(&ledc_timer);

  static ledc_channel_config_t red = {
      .gpio_num = RED_GPIO_NUM,
      .channel = RED_PWM_CHANNEL,
      .speed_mode = LEDC_HIGH_SPEED_MODE,
      .intr_type = LEDC_INTR_DISABLE,
      .timer_sel = LEDC_TIMER_0,
      .duty = 0 // LEDC channel duty, the duty range is [0, (2**bit_num) - 1],
  };

  static ledc_channel_config_t green = {
      .gpio_num = GREEN_GPIO_NUM,
      .channel = GREEN_PWM_CHANNEL,
      .speed_mode = LEDC_HIGH_SPEED_MODE,
      .intr_type = LEDC_INTR_DISABLE,
      .timer_sel = LEDC_TIMER_0,
      .duty = 0 // LEDC channel duty, the duty range is [0, (2**bit_num) - 1],
  };

  static ledc_channel_config_t blue = {
      .gpio_num = BLUE_GPIO_NUM,
      .channel = BLUE_PWM_CHANNEL,
      .speed_mode = LEDC_HIGH_SPEED_MODE,
      .intr_type = LEDC_INTR_DISABLE,
      .timer_sel = LEDC_TIMER_0,
      .duty = 0 // LEDC channel duty, the duty range is [0, (2**bit_num) - 1],
  };

  ledc_channel_config(&red);
  ledc_channel_config(&green);
  ledc_channel_config(&blue);

  ledc_fade_func_install(0);
}

/**
 * @brief _update_light
 *
 * Apply current light state to led controller
 */
static void _update_light()
{
  uint32_t r_duty = _light_state.on ? (LEDC_MAX_PWM * _light_state.r) / 0xFF : 0;
  uint32_t g_duty = _light_state.on ? (LEDC_MAX_PWM * _light_state.g) / 0xFF : 0;
  uint32_t b_duty = _light_state.on ? (LEDC_MAX_PWM * _light_state.b) / 0xFF : 0;

  ledc_set_fade_with_time(LEDC_HIGH_SPEED_MODE, RED_PWM_CHANNEL, r_duty, LEDC_TRANSITION_TIME);
  ledc_set_fade_with_time(LEDC_HIGH_SPEED_MODE, GREEN_PWM_CHANNEL, g_duty, LEDC_TRANSITION_TIME);
  ledc_set_fade_with_time(LEDC_HIGH_SPEED_MODE, BLUE_PWM_CHANNEL, b_duty, LEDC_TRANSITION_TIME);

  ledc_fade_start(LEDC_HIGH_SPEED_MODE, RED_PWM_CHANNEL, LEDC_FADE_NO_WAIT);
  ledc_fade_start(LEDC_HIGH_SPEED_MODE, GREEN_PWM_CHANNEL, LEDC_FADE_NO_WAIT);
  ledc_fade_start(LEDC_HIGH_SPEED_MODE, BLUE_PWM_CHANNEL, LEDC_FADE_NO_WAIT);

  _publish_light_state(); // Publish new complete state
}

/**
 * @brief app_main
 *
 * Main run loop/task
 */
void app_main(void)
{
  nvs_flash_init();
  tcpip_adapter_init();
  ESP_ERROR_CHECK(esp_event_loop_init(event_handler, NULL));
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));
  ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_RAM));
  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));

  esp_wifi_get_mac(WIFI_MODE_STA, uid);

  ESP_LOGI(TAG, "Connecting to Wifi AP: %s", "my_wifi");
  wifi_config_t sta_config = {.sta = {.ssid = "Livebox-EDF6", .password = "itNRQGmdxDqK3vdWw5", .bssid_set = false}};
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &sta_config));
  ESP_ERROR_CHECK(esp_wifi_start());
  ESP_ERROR_CHECK(esp_wifi_connect());

  ESP_LOGD(TAG, LOG_BOLD(LOG_COLOR_CYAN) "Device ID = " K_DEVICE_ID_FMT, K_DEVICE_ID_ARGS(uid));

  _setup_light();
  _update_light();

  while (true)
  {
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}
