/**
 * BangSongs Archive — 应用逻辑
 * 依赖：data.js 中的全局常量（songsData, bandImages, heroImageUrl, bandStyles, seasons, bands, FAV_KEY, MAIN_BANDS）
 */

const app = {
  // ========== 状态 ==========
  state: {
    seasonFilter: "全部",
    bandFilter: "全部",
    searchQuery: "",
    favoritesOnly: false,
    favorites: new Set(),
  },

  /** 定时器引用（Toast 自动消失） */
  _toastTimer: null,

  // ========== 初始化 ==========
  init() {
    this.loadFavorites();
    this.renderFilters();
    this.renderSongs();
    this.bindEvents();
    this.updateFavoritesOnlyButton();

    // 设置 Hero 背景图
    const hero = document.getElementById("heroImage");
    if (hero) hero.src = heroImageUrl;
  },

  /** 集中绑定事件 */
  bindEvents() {
    // 搜索框实时筛选
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.state.searchQuery = e.target.value.trim().toLowerCase();
      this.renderSongs();
    });

    // 收藏筛选按钮
    document.getElementById("favFilterBtn").addEventListener("click", () => {
      this.toggleFavoritesOnly();
    });

    // 分享按钮
    document.getElementById("shareBtn").addEventListener("click", () => {
      this.shareFavorites();
    });

    // 重置筛选按钮
    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      this.resetFilters();
    });
  },

  // ========== 收藏管理 ==========
  loadFavorites() {
    try {
      const saved = localStorage.getItem(FAV_KEY);
      if (saved) this.state.favorites = new Set(JSON.parse(saved));
    } catch {
      this.state.favorites = new Set();
    }
  },

  saveFavorites() {
    localStorage.setItem(FAV_KEY, JSON.stringify([...this.state.favorites]));
  },

  toggleFavorite(id) {
    this.state.favorites.has(id)
      ? this.state.favorites.delete(id)
      : this.state.favorites.add(id);
    this.saveFavorites();
    this.renderSongs();
  },

  // ========== 筛选控制 ==========
  setSeasonFilter(season) {
    this.state.seasonFilter = season;
    this.renderFilters();
    this.renderSongs();
  },

  setBandFilter(band) {
    this.state.bandFilter = band;
    this.renderFilters();
    this.renderSongs();
  },

  toggleFavoritesOnly() {
    this.state.favoritesOnly = !this.state.favoritesOnly;
    this.updateFavoritesOnlyButton();
    this.renderSongs();
  },

  resetFilters() {
    this.state.seasonFilter = "全部";
    this.state.bandFilter = "全部";
    this.state.searchQuery = "";
    this.state.favoritesOnly = false;

    document.getElementById("searchInput").value = "";
    this.updateFavoritesOnlyButton();
    this.renderFilters();
    this.renderSongs();
  },

  updateFavoritesOnlyButton() {
    const btn = document.getElementById("favFilterBtn");
    const text = document.getElementById("favBtnText");

    if (this.state.favoritesOnly) {
      btn.classList.add("bg-pink-600", "border-pink-400");
      btn.classList.remove("bg-slate-700", "border-slate-500");
      text.textContent = "显示全部";
    } else {
      btn.classList.remove("bg-pink-600", "border-pink-400");
      btn.classList.add("bg-slate-700", "border-slate-500");
      text.textContent = "只看收藏";
    }
  },

  // ========== 渲染：筛选栏 ==========
  renderFilters() {
    const sContainer = document.getElementById("seasonFilters");
    sContainer.innerHTML = seasons
      .map(
        (s) => `
                <button onclick="app.setSeasonFilter('${s}')"
                  class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition
                    ${this.state.seasonFilter === s ? "bg-white text-slate-900 shadow-lg scale-105" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}">
                  ${s}
                </button>`,
      )
      .join("");

    const bContainer = document.getElementById("bandFilters");
    bContainer.innerHTML = bands
      .map(
        (b) => `
                <button
                  data-band="${b}"
                  class="band-filter-btn px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border
                    ${
                      this.state.bandFilter === b
                        ? "border-pink-500 bg-slate-800 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                        : "border-slate-600 bg-transparent text-slate-400 hover:border-slate-400"
                    }">
                  ${b}
                </button>`,
      )
      .join("");

    // 乐队筛选按钮事件绑定
    document.querySelectorAll(".band-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        app.setBandFilter(btn.dataset.band);
      });
    });
  },

  // ========== 渲染：歌曲卡片 ==========
  renderSongs() {
    const grid = document.getElementById("songGrid");
    const empty = document.getElementById("emptyState");
    const q = this.state.searchQuery;

    const filtered = songsData.filter((song) => {
      const matchSearch =
        !q ||
        song.title.toLowerCase().includes(q) ||
        (song.trans || "").toLowerCase().includes(q) ||
        song.band.toLowerCase().includes(q);

      const matchSeason =
        this.state.seasonFilter === "全部" ||
        song.season === this.state.seasonFilter;

      let matchBand = false;
      if (this.state.bandFilter === "全部") matchBand = true;
      else if (this.state.bandFilter === "其他")
        matchBand = !MAIN_BANDS.has(song.band);
      else matchBand = song.band === this.state.bandFilter;

      const matchFav =
        !this.state.favoritesOnly || this.state.favorites.has(song.id);

      return matchSearch && matchSeason && matchBand && matchFav;
    });

    if (!filtered.length) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    grid.innerHTML = filtered
      .map((song) => {
        const isFav = this.state.favorites.has(song.id);
        const bandClass = bandStyles[song.band] || "bg-slate-600 text-white";
        const imageSrc = bandImages[song.band] || "images/default.png";
        const bilibiliUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(`Hi-Res ${song.title} BanG Dream!`)}`;

        return `
                  <div class="bg-slate-800 rounded-xl overflow-hidden shadow-lg card-hover group relative flex flex-col h-full border border-slate-700">
                    <div class="relative h-48 overflow-hidden bg-slate-900">
                      <img src="${imageSrc}" alt="${song.band}"
                           class="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" loading="lazy" />
                      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
                      <div class="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
                          ${song.season} • ${song.ep}
                        </span>
                      </div>
                    </div>

                    <div class="p-5 flex-grow flex flex-col relative">
                      <button onclick="app.toggleFavorite(${song.id})"
                        class="like-btn absolute -top-6 right-4 w-12 h-12 rounded-full bg-slate-700 border border-slate-500 shadow-lg flex items-center justify-center transition hover:bg-slate-600 hover:scale-110 z-10 ${isFav ? "active border-red-500" : ""}">
                        <span class="material-symbols-outlined text-2xl text-slate-300 transition-colors">favorite</span>
                      </button>

                      <div class="mb-2">
                        <span class="text-xs font-bold px-2 py-1 rounded ${bandClass} inline-block shadow-sm">${song.band}</span>
                      </div>

                      <h3 class="text-xl font-bold text-white mb-1 leading-tight group-hover:text-pink-400 transition">${song.title}</h3>
                      ${song.trans ? `<p class="text-sm text-slate-400 mb-4">${song.trans}</p>` : '<div class="mb-4"></div>'}

                      <div class="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">${song.type}</span>
                      </div>

                      <a href="${bilibiliUrl}" target="_blank" rel="noreferrer"
                         class="play-btn absolute bottom-3 right-3 w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center shadow-lg transition transform hover:-translate-y-1 hover:scale-110 z-20 group-hover:bg-pink-500">
                        <span class="material-symbols-outlined text-2xl">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                `;
      })
      .join("");
  },

  // ========== 分享 ==========
  shareFavorites() {
    if (!this.state.favorites.size) {
      this.showToast("请先收藏一些歌曲！", "error");
      return;
    }

    const favSongs = songsData.filter((s) => this.state.favorites.has(s.id));
    let text = "🎵 我的 BanG Dream! 歌单分享 🎵";
    favSongs.forEach((s, i) => {
      text += `\n${i + 1}. ${s.title} (${s.band})`;
    });
    text += "\n来自 BangSongs Archive 网页( fflow2023.github.io/bangsongs )";

    navigator.clipboard
      .writeText(text)
      .then(() => this.showToast("歌单已复制到剪贴板！"))
      .catch(() => this.showToast("复制失败，请重试", "error"));
  },

  // ========== Toast 提示 ==========
  showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toastMsg");
    const iconEl = toast.querySelector("span");

    msgEl.textContent = msg;
    if (type === "error") {
      iconEl.textContent = "error";
      iconEl.classList.replace("text-green-400", "text-red-400");
    } else {
      iconEl.textContent = "check_circle";
      iconEl.classList.replace("text-red-400", "text-green-400");
    }

    toast.classList.remove("opacity-0", "pointer-events-none");
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => {
      toast.classList.add("opacity-0", "pointer-events-none");
    }, 3000);
  },
};

// 暴露全局引用，供 HTML 内联 onclick 使用
window.app = app;
document.addEventListener("DOMContentLoaded", () => app.init());
