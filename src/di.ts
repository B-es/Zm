import { NoneAuthRepository } from "./entities/auth/none.auth.repository";
import { NoneCardRepository } from "./entities/card/none.card.repository";
import { NoneRoomRepository } from "./entities/room/none.room.repository";

export const di = {
  authRepository: new NoneAuthRepository(),
  roomRepository: new NoneRoomRepository(),
  cardRepository: new NoneCardRepository(),
};
