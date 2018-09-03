#include <freertos/FreeRTOS.h>
#include <string.h>

#include "netdb.h"
#include <sys/socket.h>

#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_system.h"

#define BUFFSIZE 1024
#define TEXT_BUFFSIZE 1024

static char* _dl_ip   = NULL;
static char* _dl_port = NULL;
static char* _dl_path = NULL;

static const char* TAG                     = "[OTA]";
static char        text[TEXT_BUFFSIZE + 1] = {0};
static int         socket_id               = -1;
static char        http_request[64]        = {0};

typedef enum HttpResponseParseState {
    HTTP_STATE_NONE,
    HTTP_STATE_ERROR,
    HTTP_STATE_STATUS,
    HTTP_STATE_HEADERS,
    HTTP_STATE_BODY
} HttpResponseParseState;

typedef enum OTAState {
    OTA_STATE_IDLE,      // Ready to begin an OTA
    OTA_STATE_IN_PROGESS // OTA in progress
} OTAState;

static HttpResponseParseState http_state = HTTP_STATE_NONE;
static OTAState               _ota_state = OTA_STATE_IDLE;

static void _log_buffer(const char* data, size_t len)
{
#if 0
    for (int i = 0; i < len; i++) {
        ets_printf("%02x ", *(data + i));
        if (i % 16 == 7) {
            ets_printf(" ");
        } else if (i % 16 == 15)
            ets_printf("\n");
    }
    ets_printf("\n");
#endif
}

/**
 * @brief _fatal_error
 *
 * @details Called when an error occurs during firmware update
 *          Free every allocated resources
 */
static void _fatal_error(void)
{
    ESP_LOGE(TAG, "Failed to download/apply firmware update");
    if (socket_id != -1) {
        close(socket_id);
        socket_id = -1;
    }

    free(_dl_ip), _dl_ip     = NULL;
    free(_dl_port), _dl_port = NULL;
    free(_dl_path), _dl_path = NULL;

    http_state = HTTP_STATE_NONE;
}

/**
 * @brief connect_fw_server
 *
 * @return true if everything goes smoothly, false if an error occured
 */
bool connect_fw_server()
{
    ESP_LOGI(TAG, "Firmware server addr: %s:%s", _dl_ip, _dl_port);

    int                http_connect_flag = -1;
    struct sockaddr_in sock_info;

    socket_id = socket(AF_INET, SOCK_STREAM, 0);
    if (socket_id == -1) {
        ESP_LOGE(TAG, "Create socket failed!");
        return false;
    }

    // set connect info
    memset(&sock_info, 0, sizeof(struct sockaddr_in));
    sock_info.sin_family      = AF_INET;
    sock_info.sin_addr.s_addr = inet_addr(_dl_ip);
    sock_info.sin_port        = htons(atoi(_dl_port));

    // connect to http server
    http_connect_flag =
        connect(socket_id, (struct sockaddr*)&sock_info, sizeof(sock_info));
    if (http_connect_flag == -1) {
        ESP_LOGE(TAG, "Connect to server failed! errno=%d", errno);
        close(socket_id);
        return false;
    } else {
        ESP_LOGI(TAG, "Connected to server");
        return true;
    }
    return false;
}

/**
 * @brief consume_http_status
 * return: consumer data
 */
static size_t consume_http_status(const char* data, size_t data_len)
{
    size_t   i;
    uint16_t status = 0;
    for (i = 0; data[i] != '\n' && i < data_len; i++)
        ;
    ESP_LOGD(TAG, "HTTP statut: %.*s", i - 1, data);

    status = atoi(data + 9); // strlen("HTTP/1.x ") == 9
    if (status != 200) {
        http_state = HTTP_STATE_ERROR;
        ESP_LOGE(TAG, "Got HTTP status = %d", status);
    } else {
        http_state = HTTP_STATE_HEADERS;
    }
    return i + 1;
}

/**
 * @brief consume_http_status
 * return: consumer data
 */
static size_t consume_http_single_header(const char* data, size_t data_len)
{
    int i;
    for (i = 0; data[i] != '\n' && i < data_len; i++)
        ;

    if (i == 1) {
        http_state = HTTP_STATE_BODY;
        ESP_LOGD(TAG, "Done parsing HTTP headers");
    } else
        ESP_LOGD(TAG, "HTTP header: %.*s", i - 1, data);
    return i + 1;
}

/**
* @brief consume_http_status
* return: consumed data
*/
static size_t consume_http_headers(const char* data, size_t data_len)
{
    size_t consumed = 0;
    while (http_state == HTTP_STATE_HEADERS) {
        size_t l = consume_http_single_header(data, data_len);
        data_len -= l;
        data += l;
        consumed += l;
    }
    return consumed;
}

/**
 * @brief get_firmware
 *
 * @details Download the firmware and write it on the next OTA partition
 *          Reboot on the new firmware if no error occured
 */
void get_firmware()
{
    esp_err_t              err              = 0;
    esp_ota_handle_t       update_handle    = 0;
    const esp_partition_t* update_partition = NULL;

    update_partition = esp_ota_get_next_update_partition(NULL);

    if(update_partition == NULL) {
        ESP_LOGE(TAG, "No valid OTA data partition found");
        _fatal_error();
        return false;
    }

    ESP_LOGI(TAG, "Writing to partition subtype %d at offset 0x%x",
             update_partition->subtype, update_partition->address);
    assert(update_partition != NULL);

    err = esp_ota_begin(update_partition, OTA_SIZE_UNKNOWN, &update_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed, error=%d", err);
        _fatal_error();
        return false;
    }

    // -- GET request -- //

    sprintf(http_request, "GET /%s HTTP/1.1\r\nHost: %s:%s \r\n\r\n", _dl_path,
            _dl_ip, _dl_port);

    if (write(socket_id, http_request, strlen(http_request) + 1) < 0) {
        ESP_LOGE(TAG, "Failed to write http GET request");
        _fatal_error();
        return false;
    }

    http_state = HTTP_STATE_STATUS;

    ESP_LOGD(TAG, "-- Getting data ----");

    int         data_len     = 0;
    const char* data         = NULL;
    int         body_len     = 0;
    int         received_len = 0;

    do {
        received_len = recv(socket_id, text, TEXT_BUFFSIZE, 0);
        if (received_len < 0) {
            ESP_LOGD(TAG, "Error receiving data: errno = %d", errno);
            _fatal_error();
            return false;
        }
        data_len = received_len;
        data     = text;
        ESP_LOGD(TAG, "GET: received %4d data", data_len);

        /* FIXME: Handle the cases where HTTP STATUS/HEADERS would overlap
         *  several data buffers... /!\
         * */

        if (http_state == HTTP_STATE_STATUS) {
            size_t l = consume_http_status(text, data_len);
            data_len -= l;
            data += l;
            ESP_LOGD(TAG, "Data: Consumed %d, remaining %d", l, data_len);
        }
        if (http_state == HTTP_STATE_HEADERS && data_len > 0) {
            size_t l = consume_http_headers(data, data_len);
            data_len -= l;
            data += l;
            ESP_LOGD(TAG, "Data: Consumed %d, remaining %d", l, data_len);
        }
        if (http_state == HTTP_STATE_BODY && data_len > 0) {
            body_len += data_len;
            _log_buffer(data, data_len);
            err = esp_ota_write(update_handle, data, data_len);
            if (err != ESP_OK) {
                ESP_LOGE(TAG,
                         "Error while writing firmware chunk: esp_err = 0x%04X",
                         err);
                http_state = HTTP_STATE_ERROR;
            }
        }
        if (http_state == HTTP_STATE_ERROR) {
            break;
        }
        ESP_LOGD(TAG, "free mem: %d", esp_get_free_heap_size());
    } while (received_len > 0);

    if (http_state != HTTP_STATE_ERROR) {
        ESP_LOGD(TAG, "Data received: %d", body_len);

        err = esp_ota_end(update_handle);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "OTA OTA end failed with error: 0x%04x", err);
            _fatal_error();
            return false;
        }

        err = esp_ota_set_boot_partition(update_partition);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "set boot partition failed with error: 0x%04x", err);
            _fatal_error();
            return false;
        }

        ESP_LOGI(TAG, "rebooting on new firmware...");
        esp_restart();
        return true; // should never be called
    } else {
        ESP_LOGE(TAG, "Error during firmware download...")
        _fatal_error();
    }
    return false;
}

/**
 * @brief _ota_task
 *
 * @details The FreeRTOS task that runs the firmware download/updage OTA
 * @param data:  unesed
 */
static void _ota_task(void* data)
{
    ESP_LOGD(TAG, "OTA Task <<<<");
    _ota_state = OTA_STATE_IN_PROGESS;

    if (connect_fw_server())
        get_firmware();

    free(_dl_ip), _dl_ip     = NULL;
    free(_dl_port), _dl_port = NULL;
    free(_dl_path), _dl_path = NULL;
    ESP_LOGD(TAG, "OTA Task >>>>");
    _ota_state = OTA_STATE_IDLE;
    ESP_LOGD(TAG, LOG_BOLD(LOG_COLOR_RED)"MEM" LOG_BOLD(LOG_COLOR_PURPLE) "free mem: %d", esp_get_free_heap_size());
    vTaskDelete(NULL);
}

void k_ota_start(char* dl_ip, char* dl_port, char* dl_path)
{
    ESP_LOGD(TAG, LOG_BOLD(LOG_COLOR_RED)"MEM" LOG_BOLD(LOG_COLOR_PURPLE) "free mem: %d", esp_get_free_heap_size());

    _dl_ip   = strdup(dl_ip);
    _dl_port = strdup(dl_port);
    _dl_path = strdup(dl_path);

    if (_ota_state == OTA_STATE_IDLE)
        xTaskCreate(_ota_task, "ota_task", 2048, NULL, tskIDLE_PRIORITY, NULL);
}
