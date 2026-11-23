// GitHub-dan JSON oxu/yaz
const GitHubAPI = {
  baseRaw: () => `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}`,
  baseApi: () => `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/contents`,

  async read(file) {
    // 1. Yaddaşdan (localStorage) keşi yoxla (internet olmayanda lazımdır)
    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY) || "{}");
    } catch (e) {
      cache = {};
    }

    try {
      // 2. GitHub-dan canlı oxumağa cəhd et (keşi tamamilə yan keçmək üçün ?v=3&t=... əlavə edildi)
      const res = await fetch(`${this.baseRaw()}/${CONFIG.DATA_PATH}/${file}?v=3&t=${Date.now()}`, { 
        cache: "no-store" 
      });
      
      if (!res.ok) throw new Error("Fayl tapılmadı və ya şəbəkə xətası");
      
      const data = await res.json();
      
      // Uğurlu olsa, keşi yenilə
      cache[file] = data;
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
      return data;
      
    } catch (e) {
      // 3. Əgər internet yoxdursa və ya xəta varsa, yaddaşdakı keşi qaytar
      if (cache[file]) {
        console.warn("Offline rejim: Keşdən oxunur ->", file);
        return cache[file];
      }
      throw new Error(`Xəta: ${file} tapılmadı və keşdə yoxdur. Detallar: ${e.message}`);
    }
  },

  async write(file, data) {
    if (!CONFIG.GITHUB_TOKEN) throw new Error("GitHub token yoxdur — Parametrlərdən əlavə et");
    const path = `${CONFIG.DATA_PATH}/${file}`;
    
    // Mövcud faylın SHA kodunu al
    const sha = await this.getSha(path);
    const body = {
      message: `auto: update ${file} @ ${new Date().toISOString()}`,
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

    // Yazma uğurlu olsa, yaddaşdakı keşi yenilə
    const cache = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY) || "{}");
    cache[file] = data;
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
    return await res.json();
  },

  async getSha(path) {
    try {
      const res = await fetch(`${this.baseApi()}/${path}?ref=${CONFIG.GITHUB_BRANCH}`, {
        headers: CONFIG.GITHUB_TOKEN ? { Authorization: `token ${CONFIG.GITHUB_TOKEN}` } : {},
        cache: "no-store"
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.sha;
    } catch (e) { 
      return null; 
    }
  }
};
