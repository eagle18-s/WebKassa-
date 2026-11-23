// GitHub-dan JSON oxu/yaz
const GitHubAPI = {
  baseRaw: () => `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}`,
  baseApi: () => `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/contents`,

  async read(file) {
    // 1. Cache-dən yoxla (offline)
    const cache = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY) || "{}");
    try {
      const res = await fetch(`${this.baseRaw()}/${CONFIG.DATA_PATH}/${file}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch fail");
      const data = await res.json();
      cache[file] = data;
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
      return data;
    } catch (e) {
      if (cache[file]) return cache[file];
      throw new Error(`Offline: ${file} tapılmadı`);
    }
  },

  async write(file, data) {
    if (!CONFIG.GITHUB_TOKEN) throw new Error("GitHub token yoxdur — Parametrlərdən əlavə et");
    const path = `${CONFIG.DATA_PATH}/${file}`;
    const sha = await this.getSha(path);
    const body = {
      message: `auto: ${file} @ ${new Date().toISOString()}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      branch: CONFIG.GITHUB_BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${this.baseApi()}/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${CONFIG.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error("GitHub yazma xətası: " + err);
    }
    // Cache yenilə
    const cache = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY) || "{}");
    cache[file] = data;
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
    return await res.json();
  },

  async getSha(path) {
    try {
      const res = await fetch(`${this.baseApi()}/${path}?ref=${CONFIG.GITHUB_BRANCH}`, {
        headers: CONFIG.GITHUB_TOKEN ? { Authorization: `token ${CONFIG.GITHUB_TOKEN}` } : {}
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.sha;
    } catch { return null; }
  }
};
