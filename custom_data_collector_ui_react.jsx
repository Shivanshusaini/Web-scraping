// Custom Data Collector UI (Single-file React Component)
// -----------------------------------------------------
// How to use:
// 1) Drop this file into your React app (e.g., src/DataCollector.jsx) and import it in App.jsx.
// 2) Set BASE_URL to your backend origin.
// 3) Backend should expose:
//    - POST  /scrape  { category, source, view: true } -> returns JSON rows and can save to DB server-side
//    - GET   /scrape/:category/:source/:format           -> streams a PDF/Excel for download (format ∈ {pdf, excel})
//    Optional: You can adapt request shapes as needed.

import { useMemo, useState } from "react";

const BASE_URL = "http://localhost:8000"; // ← change to your backend origin

const CATEGORY_SOURCES = {
  Education: ["Udemy", "Coursera", "Skillshare"],
  "Real Estate": ["99Acres", "MagicBricks", "Housing"],
  Events: ["BookMyShow", "Eventbrite"],
  Jobs: ["LinkedIn", "Naukri", "Indeed"],
  News: ["InShorts", "NewsAPI"],
};

export default function DataCollectorUI() {
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [mode, setMode] = useState("view"); // 'view' | 'download'
  const [format, setFormat] = useState("excel"); // 'pdf' | 'excel' (for download)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");

  const sources = useMemo(() => (category ? CATEGORY_SOURCES[category] ?? [] : []), [category]);

  const canRun = category && source && (!loading);

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) =>
      Object.values(r ?? {}).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, filter]);

  const handleRun = async () => {
    setError("");
    if (!category || !source) {
      setError("Please select both category and source.");
      return;
    }

    if (mode === "download") {
      const url = `${BASE_URL}/scrape/${encodeURIComponent(category.toLowerCase())}/${encodeURIComponent(source.toLowerCase())}/${encodeURIComponent(format)}`;
      window.open(url, "_blank");
      return;
    }

    // 'view' mode — call API to scrape, (backend may save to DB) and return JSON
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, source, view: true }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const json = await res.json();
      // Accept either {data: [...]} or direct array
      const data = Array.isArray(json) ? json : (json.data ?? []);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setCategory("");
    setSource("");
    setMode("view");
    setFormat("excel");
    setRows([]);
    setFilter("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Custom Data Collector
            </h1>
            <p className="text-slate-600 mt-1">
              Select a category and source, then view results here or download as PDF/Excel.
            </p>
          </div>
          <button
            onClick={clearAll}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:shadow md:w-auto"
          >
            Reset
          </button>
        </div>

        {/* Controls Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSource("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Select category</option>
                {Object.keys(CATEGORY_SOURCES).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={!category}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">{category ? "Select source" : "Select category first"}</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Action</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="view"
                    checked={mode === "view"}
                    onChange={(e) => setMode(e.target.value)}
                  />
                  <span className="text-sm text-slate-700">Save & View</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="download"
                    checked={mode === "download"}
                    onChange={(e) => setMode(e.target.value)}
                  />
                  <span className="text-sm text-slate-700">Download</span>
                </label>
              </div>
            </div>

            {/* Format (only for download) */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={mode !== "download"}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>
          </div>

          {/* Run Button */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300"
            >
              {loading ? "Processing..." : mode === "view" ? "Save & View" : `Download ${format.toUpperCase()}`}
            </button>
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </div>

        {/* Results Card (View Mode) */}
        {mode === "view" && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-slate-900">Results</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <span className="text-sm text-slate-600">{filteredRows.length} items</span>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              {filteredRows.length === 0 ? (
                <div className="text-sm text-slate-500">No data yet. Run "Save & View" to fetch and display results.</div>) : (
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      {Object.keys(filteredRows[0] ?? {}).map((col) => (
                        <th key={col} className="px-3 py-2 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        {Object.keys(filteredRows[0]).map((col) => (
                          <td key={col} className="px-3 py-2 text-slate-800">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Help card */}
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Backend contract</h3>
          <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
            <li><span className="font-medium">POST /scrape</span> — body: {`{ category, source, view: true }`} → returns <code>{`{ data: [] }`}</code> (array of rows). Server may also save rows to DB.</li>
            <li><span className="font-medium">GET /scrape/:category/:source/:format</span> — returns file download (PDF/Excel).</li>
            <li>Normalize category/source to lowercase server-side for routing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
