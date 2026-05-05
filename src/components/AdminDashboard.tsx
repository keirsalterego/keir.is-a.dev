import { createSignal, Show, Switch, Match } from "solid-js";

export default function AdminDashboard() {
  const [collection, setCollection] = createSignal("articles");
  const [title, setTitle] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [tags, setTags] = createSignal("");
  const [isDraft, setIsDraft] = createSignal(false);
  const [content, setContent] = createSignal("");
  const [status, setStatus] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [localDrafts, setLocalDrafts] = createSignal<any[]>([]);

  // Build specific fields
  const [buildCategory, setBuildCategory] = createSignal("Systems Tools");
  const [buildLink, setBuildLink] = createSignal("");
  const [buildIcon, setBuildIcon] = createSignal("i-ph:code-duotone");
  const [buildRepo, setBuildRepo] = createSignal("");
  
  // Analytics specific fields
  const [traffic, setTraffic] = createSignal<any>(null);

  const tabs = ["articles", "journal", "builds", "now", "about", "drafts", "analytics"];

  const loadLocalDrafts = () => {
    try {
      const draftsStr = localStorage.getItem("vyrox_drafts");
      if (draftsStr) {
        setLocalDrafts(JSON.parse(draftsStr));
      } else {
        setLocalDrafts([]);
      }
    } catch (e) {
      setLocalDrafts([]);
    }
  };

  const saveLocalDraft = () => {
    const draft = {
      id: Date.now(),
      collection: collection(),
      title: title(),
      content: content(),
      slug: slug(),
      tags: tags(),
      buildCategory: buildCategory(),
      buildLink: buildLink(),
      buildIcon: buildIcon(),
      buildRepo: buildRepo(),
      dateSaved: new Date().toLocaleString()
    };

    try {
      const draftsStr = localStorage.getItem("vyrox_drafts");
      let drafts = draftsStr ? JSON.parse(draftsStr) : [];
      drafts = [draft, ...drafts];
      localStorage.setItem("vyrox_drafts", JSON.stringify(drafts));
      setStatus("Draft safely cached in local memory.");
      loadLocalDrafts();
    } catch (e) {
      setStatus("Error saving draft locally.");
    }
  };

  const loadDraftIntoEditor = (draft: any) => {
    setCollection(draft.collection);
    setTitle(draft.title || "");
    setContent(draft.content || "");
    setSlug(draft.slug || "");
    setTags(draft.tags || "");
    if (draft.buildCategory) setBuildCategory(draft.buildCategory);
    if (draft.buildLink) setBuildLink(draft.buildLink);
    if (draft.buildIcon) setBuildIcon(draft.buildIcon);
    if (draft.buildRepo) setBuildRepo(draft.buildRepo);
    setStatus("Draft loaded from memory.");
  };

  const deleteDraft = (id: number) => {
    const drafts = localDrafts().filter((d: any) => d.id !== id);
    localStorage.setItem("vyrox_drafts", JSON.stringify(drafts));
    loadLocalDrafts();
  };

  const handleTabChange = async (tab: string) => {
    setCollection(tab);
    setStatus("");
    
    if (tab === "about") {
      setStatus("Fetching existing about page...");
      try {
        const res = await fetch("/api/admin/fetch?path=src/content/about/index.md");
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setStatus("");
        }
      } catch (e) {
        setStatus("Failed to fetch existing file");
      }
    } else if (tab === "drafts") {
      loadLocalDrafts();
      setStatus("");
    } else if (tab === "analytics") {
      setStatus("Fetching GitHub Traffic metrics...");
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setTraffic(data);
          setStatus("");
        } else {
          setStatus("Failed to fetch GitHub Traffic");
        }
      } catch (e) {
        setStatus("System error fetching analytics");
      }
    } else {
      setContent("");
    }
  };

  const autoGenerateSlug = (t: string) => {
    const dateStr = new Date().toISOString().split("T")[0];
    const sanitized = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    
    if (collection() === "articles" || collection() === "journal") {
      setSlug(`${dateStr}-${sanitized}`);
    } else {
      setSlug(sanitized);
    }
  };

  const handlePublish = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Compiling and committing to GitHub...");

    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: collection(),
          title: title(),
          slug: slug() || "index",
          tags: collection() === "builds" ? tags().split(",").map(t => "i-logos:" + t.trim()) : tags().split(",").map((t) => t.trim()).filter(Boolean),
          isDraft: isDraft(),
          content: content(),
          buildCategory: buildCategory(),
          buildLink: buildLink(),
          buildIcon: buildIcon(),
          buildRepo: buildRepo()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`Successfully pushed commit: ${data.commitUrl}`);
        setTitle("");
        setSlug("");
        setContent("");
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`System Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6 font-mono text-[#ebdbb2] w-full max-w-5xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-[#a89984]/20 pb-4 gap-2">
        <div>
          <h2 class="text-3xl font-bold text-[#fbf1c7] m-0 tracking-tight">Command Center</h2>
          <p class="text-[#bdae93] text-sm mt-1">Authenticated as keirsalterego. Memory-safe mode active.</p>
        </div>
        <div class="flex items-center gap-2 text-xs font-bold text-[#b8bb26] bg-[#b8bb26]/10 px-3 py-1.5 rounded-full border border-[#b8bb26]/30">
          <span class="w-2 h-2 rounded-full bg-[#b8bb26] animate-pulse"></span>
          SYSTEMS ONLINE
        </div>
      </div>

      {/* Tabs - Scrollable horizontally on mobile */}
      <div class="flex gap-2 border-b border-[#a89984]/20 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {tabs.map((tab) => (
          <button
            onClick={() => handleTabChange(tab)}
            class={`px-4 py-2 rounded-lg capitalize font-bold text-sm sm:text-base transition-all flex-shrink-0 ${
              collection() === tab
                ? "bg-[#282828] text-[#fbf1c7] border border-[#a89984]/30 shadow-sm"
                : "text-[#a89984] hover:text-[#fbf1c7] hover:bg-[#282828]/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Switch>
        <Match when={collection() === "analytics"}>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-[#282828] p-5 rounded-xl border border-[#a89984]/20">
              <p class="text-[#a89984] text-xs font-bold uppercase tracking-wider mb-1">Unique Visitors (14d)</p>
              <h3 class="text-3xl font-bold text-[#83a598] m-0">{traffic()?.views?.uniques || 0}</h3>
              <p class="text-[#b8bb26] text-xs mt-2">{traffic()?.views?.count || 0} Total Views</p>
            </div>
            <div class="bg-[#282828] p-5 rounded-xl border border-[#a89984]/20">
              <p class="text-[#a89984] text-xs font-bold uppercase tracking-wider mb-1">Git Clones (14d)</p>
              <h3 class="text-3xl font-bold text-[#d3869b] m-0">{traffic()?.clones?.count || 0}</h3>
              <p class="text-[#b8bb26] text-xs mt-2">{traffic()?.clones?.uniques || 0} Unique Cloners</p>
            </div>
            <div class="bg-[#282828] p-5 rounded-xl border border-[#a89984]/20">
              <p class="text-[#a89984] text-xs font-bold uppercase tracking-wider mb-1">System Status</p>
              <h3 class="text-xl font-bold text-[#fabd2f] m-0 mt-2 flex items-center gap-2">
                <span class="w-3 h-3 bg-[#b8bb26] rounded-full animate-pulse"></span>
                Nominal
              </h3>
              <p class="text-[#a89984] text-xs mt-2">API Connection Stable</p>
            </div>
            <div class="bg-[#282828] p-5 rounded-xl border border-[#a89984]/20 sm:col-span-2 md:col-span-3">
              <p class="text-[#a89984] text-xs font-bold uppercase tracking-wider mb-3">Top Content (Last 14 Days)</p>
              <Show when={traffic()?.popularPaths?.length > 0}>
                <ul class="flex flex-col gap-3 m-0 p-0 list-none text-sm">
                  {traffic().popularPaths.slice(0, 5).map((path: any) => (
                    <li class="flex justify-between items-center bg-[#1d2021] p-3 rounded border border-[#a89984]/10">
                      <div class="flex flex-col max-w-[70%]">
                        <span class="text-[#ebdbb2] truncate font-bold">{path.title || path.path}</span>
                        <span class="text-[#a89984] text-xs truncate">{path.path}</span>
                      </div>
                      <div class="flex items-center gap-4">
                        <span class="text-[#83a598] font-bold">{path.count} views</span>
                        <span class="text-[#d3869b] text-xs">{path.uniques} uniques</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Show>
              <Show when={!traffic()?.popularPaths || traffic()?.popularPaths?.length === 0}>
                <p class="text-[#a89984] text-sm italic">No traffic data available yet. Waiting for GitHub API metrics.</p>
              </Show>
            </div>
          </div>
        </Match>

        <Match when={collection() === "drafts"}>
          <div class="bg-[#282828] p-5 sm:p-7 rounded-xl border border-[#a89984]/20 shadow-lg">
            <h3 class="text-[#fbf1c7] font-bold text-xl mb-4">Local Memory Cache</h3>
            <p class="text-[#a89984] text-sm mb-6">These drafts are stored locally in your browser. They have not been committed to GitHub.</p>
            
            <Show when={localDrafts().length === 0}>
              <div class="text-[#bdae93] italic bg-[#1d2021] p-6 rounded-lg border border-[#a89984]/10 text-center">
                No local drafts found.
              </div>
            </Show>
            
            <div class="flex flex-col gap-4">
              {localDrafts().map((draft: any) => (
                <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-[#1d2021] p-4 rounded-lg border border-[#a89984]/10 gap-4">
                  <div class="flex flex-col">
                    <span class="text-[#ebdbb2] font-bold text-lg">{draft.title || "Untitled Draft"}</span>
                    <span class="text-[#a89984] text-xs mt-1">
                      <span class="bg-[#282828] px-2 py-0.5 rounded mr-2 uppercase">{draft.collection}</span>
                      Saved: {draft.dateSaved}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <button 
                      onClick={() => loadDraftIntoEditor(draft)}
                      class="bg-[#83a598]/10 text-[#83a598] hover:bg-[#83a598]/20 px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                      Resume
                    </button>
                    <button 
                      onClick={() => deleteDraft(draft.id)}
                      class="bg-[#fb4934]/10 text-[#fb4934] hover:bg-[#fb4934]/20 px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Match>

        <Match when={!["analytics", "drafts"].includes(collection())}>
          <form onSubmit={handlePublish} class="flex flex-col gap-5 bg-[#282828] p-5 sm:p-7 rounded-xl border border-[#a89984]/20 shadow-lg">
            
            <Show when={!["about"].includes(collection())}>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">
                  {collection() === "now" ? "Month (e.g. June 2026)" : "Title"}
                </label>
                <input
                  type="text"
                  required
                  value={title()}
                  onInput={(e) => {
                    setTitle(e.currentTarget.value);
                    if (collection() !== "now") autoGenerateSlug(e.currentTarget.value);
                  }}
                  class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] focus:border-[#83a598] outline-none transition-colors w-full"
                  placeholder={collection() === "now" ? "June 2026" : "e.g. Reverse Engineering an EDR"}
                />
              </div>
            </Show>



            <Show when={collection() === "builds"}>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Category</label>
                <select
                  value={buildCategory()}
                  onChange={(e) => setBuildCategory(e.currentTarget.value)}
                  class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] focus:border-[#83a598] outline-none w-full"
                >
                  <option>Security & Red/Blue Team</option>
                  <option>Open Source Contributions</option>
                  <option>Solana / On-chain</option>
                  <option>Systems Tools</option>
                </select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Link</label>
                <input type="text" value={buildLink()} onInput={(e) => setBuildLink(e.currentTarget.value)} class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] outline-none w-full" placeholder="https://..." />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Icon</label>
                <input type="text" value={buildIcon()} onInput={(e) => setBuildIcon(e.currentTarget.value)} class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] outline-none w-full" placeholder="i-ph:code-duotone" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Repo (Optional)</label>
                <input type="text" value={buildRepo()} onInput={(e) => setBuildRepo(e.currentTarget.value)} class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] outline-none w-full" placeholder="keirsalterego/project" />
              </div>
            </Show>

            <Show when={collection() === "articles" || collection() === "builds"}>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Tags / Tech (comma separated)</label>
                <input
                  type="text"
                  value={tags()}
                  onInput={(e) => setTags(e.currentTarget.value)}
                  class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-3 text-[#ebdbb2] focus:border-[#83a598] outline-none transition-colors w-full"
                  placeholder={collection() === "builds" ? "rust, python, mongodb (will auto-prefix i-logos:)" : "Rust, Security, Red Team"}
                />
              </div>
            </Show>

            <Show when={collection() === "articles" || collection() === "builds"}>
              <div class="flex items-center gap-3 bg-[#1d2021] p-4 rounded-lg border border-[#a89984]/10">
                <input
                  type="checkbox"
                  id="draft"
                  checked={isDraft()}
                  onChange={(e) => setIsDraft(e.currentTarget.checked)}
                  class="w-5 h-5 accent-[#83a598] rounded cursor-pointer"
                />
                <label for="draft" class="font-bold text-[#bdae93] cursor-pointer select-none">
                  Save as Draft <span class="text-[#a89984] font-normal">(Hidden from production)</span>
                </label>
              </div>
            </Show>

            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-end">
                <label class="font-bold text-[#bdae93] text-sm uppercase tracking-wider">Markdown Content</label>
                <span class="text-xs text-[#a89984] bg-[#1d2021] px-2 py-1 rounded border border-[#a89984]/20">Supports Diagrams</span>
              </div>
              <textarea
                required
                value={content()}
                onInput={(e) => setContent(e.currentTarget.value)}
                class="bg-[#1d2021] border border-[#a89984]/20 rounded-lg p-4 text-[#ebdbb2] focus:border-[#83a598] outline-none transition-colors min-h-[40vh] sm:min-h-[500px] font-mono leading-relaxed resize-y w-full"
                placeholder="Write your markdown here..."
              ></textarea>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between mt-2 pt-4 border-t border-[#a89984]/10 gap-4">
              <p class={`text-sm break-all w-full sm:w-auto ${status().includes("Error") ? "text-[#fb4934]" : "text-[#b8bb26]"}`}>
                {status()}
              </p>
              <div class="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={saveLocalDraft}
                  class="w-full sm:w-auto bg-[#fabd2f]/10 text-[#fabd2f] font-bold px-6 py-3 rounded-lg border border-[#fabd2f]/30 hover:bg-[#fabd2f]/20 transition-all uppercase tracking-wider text-sm"
                >
                  Save Local Draft
                </button>
                <button
                  type="submit"
                  disabled={isLoading()}
                  class="w-full sm:w-auto bg-[#83a598] text-[#1d2021] font-bold px-8 py-3 rounded-lg border border-[#458588] hover:bg-[#83a598]/90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(131,165,152,0.2)] hover:shadow-[0_0_20px_rgba(131,165,152,0.4)] uppercase tracking-wider text-sm"
                >
                  {isLoading() ? "Committing..." : "Deploy to Main"}
                </button>
              </div>
            </div>
          </form>
        </Match>
      </Switch>
    </div>
  );
}
