import { FapiAuthRepository } from "./entities/auth/fapi.auth.repository";
import { FapiCardRepository } from "./entities/card/fapi.card.repository";
import { FapiRoomRepository } from "./entities/room/fapi.room.repository";

export const di = {
  authRepository: new FapiAuthRepository(),
  roomRepository: new FapiRoomRepository("http://localhost:8000", async () =>
    localStorage.getItem("access_token"),
  ),
  cardRepository: new FapiCardRepository("http://localhost:8000", async () =>
    localStorage.getItem("access_token"),
  ),
};
