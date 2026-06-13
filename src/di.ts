import { FapiAuthRepository } from "./entities/auth/fapi.auth.repository";
import { FapiCardRepository } from "./entities/card/fapi.card.repository";
import { FapiRoomRepository } from "./entities/room/fapi.room.repository";

async function getAccessToken(): Promise<string | null> {
  return localStorage.getItem("access_token");
}

const serverUrl = import.meta.env.VITE_SERVER_URL;
console.log(serverUrl);

export const di = {
  authRepository: new FapiAuthRepository(serverUrl),
  roomRepository: new FapiRoomRepository(serverUrl, getAccessToken),
  cardRepository: new FapiCardRepository(serverUrl, getAccessToken),
};
