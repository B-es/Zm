export interface IAuthRepository {
  signUp(nickname: string, password: string): Promise<void>;
  signIn(nickname: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  loadSession(): Promise<{ id: number; nickname: string }>;
}
