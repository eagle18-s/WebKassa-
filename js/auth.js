const Auth = {
  user: null,

  async login(username, password) {
    const { users } = await GitHubAPI.read("accounts.json");
    const user = users.find(u => u.username === username && u.password === password && u.active);
    if (!user) throw new Error("İstifadəçi adı və ya şifrə səhvdir");
    this.user = user;
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({
      userId: user.id, username: user.username, role: user.role, loginAt: Date.now()
    }));
    return user;
  },

  logout() {
    this.user = null;
    localStorage.removeItem(CONFIG.SESSION_KEY);
  },

  restore() {
    const s = localStorage.getItem(CONFIG.SESSION_KEY);
    if (!s) return null;
    this.user = JSON.parse(s);
    return this.user;
  }
};
