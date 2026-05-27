import { NoneAuthRepository } from "./entities/auth/none.auth.repository";

export const di = {
  authRepository: new NoneAuthRepository(),
};
