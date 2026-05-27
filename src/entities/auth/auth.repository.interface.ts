export interface IAuthRepository {
  signUp(nickname: string, password: string): Promise<Object>;
  signIn(nickname: string, password: string): Promise<Object>;
  signOut(): Promise<Object>;
  loadSession(): Promise<void>;
  initAuthListener(): void;
  updateAvatar(avatarUrl: string): Promise<void>;
}
