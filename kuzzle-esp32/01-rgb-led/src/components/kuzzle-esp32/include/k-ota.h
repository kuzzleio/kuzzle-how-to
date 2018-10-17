#ifndef __K_OTA_H
#define __K_OTA_H

/**
 * @brief k_ota_start
 * @details Downloads and applies a new firmware
 *
 *          If the update succeeds, then the device will reboot, using the new firmware
 
 * @todo Handle errors and notify the backend
 * @param dl_ip : firmware server ip address
 * @param dl_port: firmware server network port
 * @param dl_path: path of the file to download
 */
void k_ota_start(char* dl_ip, char* dl_port, char* dl_path);

#endif //__K_OTA_H
