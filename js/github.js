/* github.js — the public repos shown in the Lab.
   Starts from the snapshot in data.js, then asks the GitHub API for the live
   list (no token, cached for 6 hours) so new repos appear by themselves. */
window.GH = (() => {
  const C = window.PORTFOLIO.github;
  const KEY = "ak_gh_v1", TTL = 6 * 3600 * 1000;
  const hide = new Set(C.hide || []);
  const order = C.featured || [];

  const pretty = (n) => n.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());
  const fromApi = (r) => ({
    name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, topics: r.topics || [],
    homepage: r.homepage, pushed: (r.pushed_at || "").slice(0, 10), url: r.html_url, fork: r.fork, private: r.private,
  });

  function shape(list) {
    return list
      .filter((r) => !r.fork && !r.private && !hide.has(r.name))
      .map((r) => {
        const n = (C.notes || {})[r.name] || {};
        // a homepage that just points back at GitHub is not a demo
        const live = r.homepage && !/github\.com/i.test(r.homepage) ? r.homepage : "";
        return { ...r, title: n.title || pretty(r.name), bullets: n.bullets || [], live };
      })
      .sort((a, b) => {
        const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        return (b.pushed || "").localeCompare(a.pushed || "");
      });
  }

  let repos = shape(C.snapshot || []), live = false;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (c && Date.now() - c.t < TTL && Array.isArray(c.list)) { repos = shape(c.list); live = true; }
  } catch (_) {}

  const listeners = [];
  async function refresh() {
    if (live || location.protocol === "file:") return repos;
    try {
      const res = await fetch(`https://api.github.com/users/${C.user}/repos?per_page=100&sort=pushed`, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(res.status);
      const list = (await res.json()).map(fromApi);
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), list })); } catch (_) {}
      const before = repos.map((r) => r.name + r.pushed).join();
      repos = shape(list); live = true;
      if (repos.map((r) => r.name + r.pushed).join() !== before) listeners.forEach((f) => f(repos));
    } catch (_) { /* rate-limited or offline: keep the snapshot */ }
    return repos;
  }

  return {
    get list() { return repos; },
    get live() { return live; },
    onChange(f) { listeners.push(f); return () => listeners.splice(listeners.indexOf(f), 1); },
    refresh,
    profile: `https://github.com/${C.user}`,
  };
})();
