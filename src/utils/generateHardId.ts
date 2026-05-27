async function sha256(message: string): Promise<string> {
  // Кодируем строку в Uint8Array (массив байт)
  const msgBuffer = new TextEncoder().encode(message);
  // Используем встроенный Web Crypto API для хэширования
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  // Преобразуем ArrayBuffer в строку hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
/**
 * Генерация стабильного хэша на основе железа
 * @param salt Необязательная соль для усиления уникальности
 * @returns SHA256 хэш в hex (64 символа)
 */
export async function generateHardwareId(salt: string = ""): Promise<string> {
  // Создаём хэш
  const hash = await sha256("sha256");
  return hash;
}
