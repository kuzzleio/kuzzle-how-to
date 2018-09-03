#ifndef __K_OTA_H
#define __K_OTA_H

/**
 * @brief k_ota_start
 * @details This method will create a task to download and apply a new firmware
 *
 *          If everything runs smoothly, the device will reboot on new firmware at
 *          the end.
 * @todo Handle the case there was an error to be able to create a event on the back-end
 * @param dl_ip : ip address of the server where to download the new firmware from
 * @param dl_port: the port on which to request the new firmware
 * @param dl_path: the path to the file
 */
void k_ota_start(char* dl_ip, char* dl_port, char* dl_path);

#endif //__K_OTA_H
