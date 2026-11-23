// ⚠️ BURANI ÖZ REPO-NLA DƏYİŞ
const CONFIG = {
  GITHUB_USER: "eagle18-s",
  GITHUB_REPO: "WebKassa",
  GITHUB_BRANCH: "main",
  GITHUB_TOKEN: "", // PAT — sonra localStorage-dən yüklənəcək

  DATA_PATH: "data",
  CACHE_KEY: "WebKassa_cache_v1",
  SESSION_KEY: "WebKassa_session",
  TOKEN_KEY: "WebKassa_token",

  APP_NAME: "WebKassa",
  VERSION: "1.0.0"
};

// Tokeni localStorage-dən yüklə
CONFIG.GITHUB_TOKEN = localStorage.getItem(CONFIG.TOKEN_KEY) || "";
