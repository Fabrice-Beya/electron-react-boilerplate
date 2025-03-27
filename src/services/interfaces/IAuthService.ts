import { AuthResponse, UserCredentials, UserData } from "../../types";

export interface IAuthService {
  register(credentials: UserCredentials, name?: string): Promise<UserData | null>;
  login(credentials: UserCredentials): Promise<UserData | null>;
  logout(): Promise<AuthResponse>;
  getCurrentUser(): Promise<UserData | null>;
  isAuthenticated(): Promise<boolean>;
  updateUserName(name: string): Promise<AuthResponse>;
  updateUserEmail(email: string, password: string): Promise<AuthResponse>;
  updateUserPassword(oldPassword: string, newPassword: string): Promise<AuthResponse>;
} 