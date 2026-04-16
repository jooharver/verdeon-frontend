// services/auth.service.ts
import { api } from "./api";

export const AuthService = {
  // LOGIN
  async login(email: string, password: string) {
    const data = await api("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Laravel biasanya mengembalikan { token: '...', user: {...} }
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  },

  // REGISTER
  async register(name: string, email: string, password: string, password_confirmation: string) {
    return api("/register", {
      method: "POST",
      body: JSON.stringify({ 
        name, 
        email, 
        password, 
        password_confirmation // Laravel butuh ini untuk rule 'confirmed'
      }),
    });
  },

  async me() {
    return api("/me");
  },

  async logout() {
    await api("/logout", {
      method: "POST",
    });
    localStorage.removeItem("token");
  },
};