import si from "systeminformation";
import { createHash } from "crypto";

interface HardwareIdentifiers {
  cpuSerial: string;
  motherboardSerial: string;
  diskSerial: string;
  macAddresses: string[];
}

/**
 * Сбор идентификаторов оборудования
 */
export async function collectHardwareIds(): Promise<HardwareIdentifiers> {
  try {
    // Получение CPU информации (серийный номер часто пуст, но можно взять ID)
    const cpu = await si.cpu();
    const cpuSerial = cpu.serialNumber || cpu.manufacturer + cpu.brand;

    // Материнская плата (серийный номер)
    const motherboard = await si.system();
    const motherboardSerial = motherboard.serial || "";

    // Первый жёсткий диск (серийный номер)
    const disks = await si.diskLayout();
    const diskSerial = disks[0]?.serialNum || "";

    // Сетевые интерфейсы (MAC-адреса)
    const network = await si.networkInterfaces();
    const macAddresses = network
      .filter((iface) => iface.mac && iface.mac !== "00:00:00:00:00:00")
      .map((iface) => iface.mac)
      .sort();

    return {
      cpuSerial,
      motherboardSerial,
      diskSerial,
      macAddresses,
    };
  } catch (error) {
    console.error("Ошибка сбора данных железа:", error);
    throw error;
  }
}

/**
 * Генерация стабильного хэша на основе железа
 * @param salt Необязательная соль для усиления уникальности
 * @returns SHA256 хэш в hex (64 символа)
 */
export async function generateHardwareId(salt: string = ""): Promise<string> {
  const hardware = await collectHardwareIds();

  // Склеиваем все идентификаторы в одну строку
  const rawString = [
    hardware.cpuSerial,
    hardware.motherboardSerial,
    hardware.diskSerial,
    ...hardware.macAddresses,
    salt,
  ].join("|");

  // Создаём хэш
  const hash = createHash("sha256");
  hash.update(rawString);
  return hash.digest("hex");
}

// Пример использования
(async () => {
  const hardwareId = await generateHardwareId();
  //console.log("Постоянный ID железа:", hardwareId);
})();
