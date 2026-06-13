import type { IAuthRepository } from "./auth.repository.interface";
import { useUserStore } from "../user/user.store";

export class NoneAuthRepository implements IAuthRepository {
  async signUp(nickname: string, password: string): Promise<void> {
    const userStore = useUserStore();
    //await userStore.setCurrent(nickname, password);
  }
  async signIn(nickname: string, password: string): Promise<void> {
    throw new Error("Method not implemented.");
    const userStore = useUserStore();
    //await userStore.setCurrent(nickname, password);
  }
  async signOut(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async loadSession(): Promise<{ id: number; nickname: string }> {
    throw new Error("Method not implemented.");
  }
}
