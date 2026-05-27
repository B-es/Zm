import type { IAuthRepository } from "./auth.repository.interface";

export class NoneAuthRepository implements IAuthRepository {
  signUp(nickname: string, password: string): Promise<Object> {
    throw new Error("Method not implemented.");
  }
  signIn(nickname: string, password: string): Promise<Object> {
    throw new Error("Method not implemented.");
  }
  signOut(): Promise<Object> {
    throw new Error("Method not implemented.");
  }
  loadSession(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  initAuthListener(): void {
    // throw new Error("Method not implemented.");
  }
  updateAvatar(avatarUrl: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
