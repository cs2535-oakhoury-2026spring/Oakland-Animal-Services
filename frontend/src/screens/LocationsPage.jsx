import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useResponsive } from "../hooks.js";
import { api } from "../api.js";
import { navigateOrOpenNewTab } from "../utils.js";
import Icons from "../Icons.jsx";
import Skeleton from "../components/Skeleton.jsx";
import UserDropdown from "../components/UserDropdown.jsx";
import LocationUploadModal from "./LocationUploadModal.jsx";
import "./LocationsPage.css";

// ─── Locations Page ───────────────────────────────────────────────────────────
export default function LocationsPage({ user, token, onLogout, darkMode, setDarkMode, onChangePassword }) {
  const r = useResponsive();
  const [locations, setLocations] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [qrSizePx, setQrSizePx] = useState(180);
  const [paperSize, setPaperSize] = useState("letter");
  const [includeLocationText, setIncludeLocationText] = useState(true);
  const [includeAnimalTypeText, setIncludeAnimalTypeText] = useState(true);
  const [centerAllQrs, setCenterAllQrs] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewQrMap, setPreviewQrMap] = useState({});

  useEffect(() => {
    setLoadError(false);
    api.getAllAnimalsAllPages().then((animals) => {
      if (!animals) {
        setLoadError(true);
        setLocations([]);
        return;
      }

      const map = new Map();
      animals.forEach((a) => {
        const species = (a.species || "").toLowerCase();
        const originalLocation = (a.location || "").trim();
        if (!species || !originalLocation) return;

        const normalized = originalLocation
          .replace(new RegExp(`^${a.species}\\s+`, "i"), "")
          .trim()
          .toLowerCase();

        if (!normalized || normalized === "unknown" || normalized === "in foster") return;

        const key = `${species}|${normalized}`;
        const curr = map.get(key);
        if (curr) {
          curr.count += 1;
        } else {
          map.set(key, {
            species,
            location: normalized,
            label: `${species.toUpperCase()} ${normalized.toUpperCase()}`,
            count: 1,
          });
        }
      });

      const sorted = Array.from(map.values()).sort((x, y) => {
        if (x.species !== y.species) return x.species.localeCompare(y.species);
        return x.location.localeCompare(y.location);
      });

      const speciesOptions = Array.from(new Set(sorted.map((s) => s.species))).sort();
      setLocations(sorted);
      setSelectedSpecies(speciesOptions);
      setSelectedKennels(sorted.map((s) => `${s.species}|${s.location}`));
    });
  }, []);

  const isDesktop = r.width >= 768;
  const allLocations = locations ? [...locations, ...customLocations] : customLocations;

  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const compareLocationEntries = (a, b) => {
    if (a.custom && !b.custom) return -1;
    if (!a.custom && b.custom) return 1;
    const speciesCompare = collator.compare(a.species, b.species);
    if (speciesCompare !== 0) return speciesCompare;
    return collator.compare(a.location, b.location);
  };

  const sortedLocations = allLocations ? [...allLocations].sort(compareLocationEntries) : [];
  const speciesOptions = sortedLocations ? Array.from(new Set(sortedLocations.map((s) => s.species))).sort(collator.compare) : [];
  const speciesFilterSet = new Set(selectedSpecies);
  const searchQuery = locationSearch.trim().toLowerCase();
  const visibleLocations = sortedLocations
    ? sortedLocations.filter((loc) => selectedSpecies.length === 0 || speciesFilterSet.has(loc.species))
        .filter((loc) => {
          if (!searchQuery) return true;
          return (
            loc.location.toLowerCase().includes(searchQuery) ||
            loc.species.toLowerCase().includes(searchQuery) ||
            loc.label.toLowerCase().includes(searchQuery)
          );
        })
    : [];
  const visibleKeys = visibleLocations.map((loc) => `${loc.species}|${loc.location}`);
  const selectedKennelSet = new Set(selectedKennels);
  const selectedExportLocations = visibleLocations.filter((loc) =>
    selectedKennelSet.has(`${loc.species}|${loc.location}`)
  );

  const computePdfLayout = () => {
    const qrWidth = Math.max(96, Math.min(512, Number(qrSizePx) || 180));
    const qrSizePt = Math.round(qrWidth * 0.75);
    const size = paperSize === "a4" ? "a4" : "letter";
    const sizeProbe = new jsPDF({ orientation: "portrait", unit: "pt", format: size });
    const pageWidth = sizeProbe.internal.pageSize.getWidth();
    const pageHeight = sizeProbe.internal.pageSize.getHeight();
    const margin = 32;
    const gutter = 16;
    const labelHeight = includeLocationText ? 28 : 0;
    const cellHeight = qrSizePt + labelHeight + 16;
    const cols = Math.max(1, Math.floor((pageWidth - margin * 2 + gutter) / (qrSizePt + gutter)));
    const rowsPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / cellHeight));
    const itemsPerPage = Math.max(1, cols * rowsPerPage);

    return {
      format: size,
      qrSizePt,
      pageWidth,
      pageHeight,
      margin,
      gutter,
      labelHeight,
      cellHeight,
      cols,
      rowsPerPage,
      itemsPerPage,
    };
  };

  const getRowStartX = (layout, itemsOnPage, row) => {
    const usedBeforeRow = row * layout.cols;
    const rowItems = Math.max(0, Math.min(layout.cols, itemsOnPage - usedBeforeRow));
    const rowWidth = rowItems > 0 ? rowItems * layout.qrSizePt + (rowItems - 1) * layout.gutter : 0;
    const usableWidth = layout.pageWidth - 2 * layout.margin;
    return centerAllQrs
      ? layout.margin + Math.max(0, (usableWidth - rowWidth) / 2)
      : layout.margin;
  };

  const getPageStartY = (layout, itemsOnPage) => {
    const rowsUsed = Math.max(1, Math.ceil(itemsOnPage / layout.cols));
    const lastRowContentHeight = layout.qrSizePt + (layout.labelHeight > 0 ? 12 : 0);
    const blockHeight = (rowsUsed - 1) * layout.cellHeight + lastRowContentHeight;
    const usableHeight = layout.pageHeight - 2 * layout.margin;
    return centerAllQrs
      ? layout.margin + Math.max(0, (usableHeight - blockHeight) / 2)
      : layout.margin;
  };

  const getDisplayLabel = (loc) => {
    if (loc.custom && loc.label) return loc.label;
    if (includeAnimalTypeText) return `${loc.species.toUpperCase()} ${loc.location.toUpperCase()}`;
    return loc.location.toUpperCase();
  };

  const previewLayout = computePdfLayout();
  const previewItems = selectedExportLocations.slice(0, previewLayout.itemsPerPage);
  const totalPdfPages = Math.max(1, Math.ceil(selectedExportLocations.length / previewLayout.itemsPerPage));

  useEffect(() => {
    let canceled = false;

    const generatePreviewQrs = async () => {
      if (previewItems.length === 0) {
        if (!canceled) setPreviewQrMap({});
        return;
      }

      const entries = await Promise.all(
        previewItems.map(async (loc) => {
          const key = `${loc.species}|${loc.location}`;
          try {
            const previewPayload = `${window.location.origin}/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
            const url = await QRCode.toDataURL(previewPayload, { width: 256, margin: 1 });
            return [key, url];
          } catch {
            return [key, ""];
          }
        })
      );

      if (!canceled) {
        setPreviewQrMap(Object.fromEntries(entries));
      }
    };

    generatePreviewQrs();
    return () => {
      canceled = true;
    };
  }, [
    selectedExportLocations.map((loc) => `${loc.species}|${loc.location}`).join(";"),
    previewLayout.itemsPerPage,
    includeLocationText,
    paperSize,
    qrSizePx,
  ]);

  const toggleSpecies = (species) => {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  };

  const handleImportedLocations = (importedLocations) => {
    const existingKeys = new Set(customLocations.map((entry) => `${entry.species}|${entry.location}`));
    const additions = importedLocations.filter(
      (entry) => !existingKeys.has(`${entry.species}|${entry.location}`),
    );
    if (additions.length === 0) return;

    setCustomLocations((prev) => [...prev, ...additions]);
    setSelectedSpecies((prev) => {
      const speciesSet = new Set(prev);
      additions.forEach((entry) => speciesSet.add(entry.species));
      return Array.from(speciesSet);
    });
    setSelectedKennels((prev) => {
      const keySet = new Set(prev);
      additions.forEach((entry) => keySet.add(`${entry.species}|${entry.location}`));
      return Array.from(keySet);
    });
  };

  const visibleCustomKeys = visibleLocations
    .filter((loc) => loc.custom)
    .map((loc) => `${loc.species}|${loc.location}`);

  const selectAllVisibleKennels = () => {
    setSelectedKennels((prev) => Array.from(new Set([...prev, ...visibleKeys])));
  };

  const clearVisibleKennels = () => {
    const visibleSet = new Set(visibleKeys);
    setSelectedKennels((prev) => prev.filter((k) => !visibleSet.has(k)));
  };

  const selectVisibleCustomKennels = () => {
    setSelectedKennels((prev) => Array.from(new Set([...prev, ...visibleCustomKeys])));
  };

  const clearVisibleCustomKennels = () => {
    const customSet = new Set(visibleCustomKeys);
    setSelectedKennels((prev) => prev.filter((k) => !customSet.has(k)));
  };

  const toggleKennel = (key) => {
    setSelectedKennels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const exportSelectedToPdf = async () => {
    if (!locations || (locations.length === 0 && customLocations.length === 0) || selectedKennels.length === 0 || exportingPdf) return;

    const selectedSet = new Set(selectedKennels);
    const toExport = visibleLocations.filter((loc) => selectedSet.has(`${loc.species}|${loc.location}`));
    if (toExport.length === 0) return;

    setExportingPdf(true);
    try {
      const baseUrl = window.location.origin;
      const layout = computePdfLayout();
      const qrWidth = Math.max(96, Math.min(512, Number(qrSizePx) || 180));
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: layout.format });

      let currentPage = 0;

      doc.setFontSize(12);
      doc.text("Oakland Animal Services Kennel QR Codes", layout.margin, 20);

      for (let i = 0; i < toExport.length; i++) {
        const loc = toExport[i];
        const key = `${loc.species}|${loc.location}`;
        const targetUrl = `${baseUrl}/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
        const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: qrWidth, margin: 1 });

        const pageIndex = Math.floor(i / layout.itemsPerPage);
        const indexInPage = i % layout.itemsPerPage;
        const row = Math.floor(indexInPage / layout.cols);
        const col = indexInPage % layout.cols;
        const itemsOnPage = Math.min(layout.itemsPerPage, toExport.length - pageIndex * layout.itemsPerPage);

        while (currentPage < pageIndex) {
          doc.addPage();
          currentPage += 1;
        }

        const rowStartX = getRowStartX(layout, itemsOnPage, row);
        const drawX = rowStartX + col * (layout.qrSizePt + layout.gutter);
        const pageStartY = getPageStartY(layout, itemsOnPage);
        const y = pageStartY + row * layout.cellHeight;
        doc.addImage(qrDataUrl, "PNG", drawX, y, layout.qrSizePt, layout.qrSizePt);

        if (includeLocationText) {
          const label = getDisplayLabel(loc);
          doc.setFontSize(9);
          doc.text(label, drawX + layout.qrSizePt / 2, y + layout.qrSizePt + 12, {
            align: "center",
            maxWidth: layout.qrSizePt,
          });
        }

        if (!selectedSet.has(key)) continue;
      }

      const datePart = new Date().toISOString().slice(0, 10);
      doc.save(`kennel-qr-codes-${datePart}.pdf`);
    } catch (err) {
      console.error("Failed to export locations PDF", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <main className="locations-page">
      <div className="locations-page__topbar">
        <div className="locations-page__topbar-left">
          <UserDropdown user={user} onLogout={onLogout} token={token} onChangePassword={onChangePassword} />
        </div>
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="locations-page__logo" />
        <div className="locations-page__topbar-right">
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="locations-page__theme-btn"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
            </button>
          )}
        </div>
      </div>

      <div className={`locations-page__content locations-page__content--${isDesktop ? "desktop" : "mobile"}`}>
        <div className="locations-page__heading-row">
          <div>
            <h2 className="locations-page__title" style={{ fontSize: isDesktop ? 26 : 22 }}>Kennel Locations</h2>
            <p className="locations-page__subtitle">Generated from all current animals</p>
          </div>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="locations-page__back-btn"
                     >
            Back To Home
          </button>
        </div>

        {locations !== null && !loadError && allLocations.length > 0 && (
          <div className="locations-page__search-wrap">
            <div className="locations-page__search-icon">
              <Icons.search size={15} color="var(--clr-warm-gray)" />
            </div>
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search locations by kennel or species..."
              className="locations-page__search-input"
              aria-label="Search kennel locations"
            />
          </div>
        )}

        {locations !== null && !loadError && (
          <div className="locations-page__export-panel">
            <div className="locations-page__export-title">Export Locations To PDF</div>
            <div className="locations-page__custom-entry-panel">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="locations-page__action-btn"
            >
              Upload locations CSV
            </button>
            <div className="locations-page__hint" style={{ marginTop: 10 }}>
              Upload a CSV file with columns <code>animalType,location</code> to add custom kennel locations.
            </div>
          </div>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1fr) 300px" : "1fr", gap: 14, alignItems: "start" }}>
              <div>
                <div className="locations-page__species-filter">
                  {speciesOptions.map((species) => {
                    const on = selectedSpecies.includes(species);
                    return (
                      <button
                        key={species}
                        onClick={() => toggleSpecies(species)}
                        className={`locations-page__species-pill locations-page__species-pill--${on ? "on" : "off"}`}
                                             >
                        {species}
                      </button>
                    );
                  })}
                </div>

                <div className="locations-page__settings-grid" style={{ gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr" }}>
                  <label className="locations-page__settings-label">
                    QR Size (px)
                    <input
                      type="number"
                      min={96}
                      max={512}
                      step={8}
                      value={qrSizePx}
                      onChange={(e) => setQrSizePx(e.target.value)}
                      className="locations-page__settings-input"
                                         />
                  </label>
                  <label className="locations-page__settings-label">
                    Paper Size
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      className="locations-page__settings-input"
                                         >
                      <option value="letter">Letter (8.5 x 11 in)</option>
                      <option value="a4">A4 (210 x 297 mm)</option>
                    </select>
                  </label>
                  <div className="locations-page__checkboxes">
                    <label className="locations-page__checkbox-label">
                      <input type="checkbox" checked={includeLocationText} onChange={(e) => setIncludeLocationText(e.target.checked)} />
                      Add location text below QR
                    </label>
                    <label className="locations-page__checkbox-label">
                      <input type="checkbox" checked={includeAnimalTypeText} onChange={(e) => setIncludeAnimalTypeText(e.target.checked)} disabled={!includeLocationText} />
                      Include animal type in label
                    </label>
                    <label className="locations-page__checkbox-label">
                      <input type="checkbox" checked={centerAllQrs} onChange={(e) => setCenterAllQrs(e.target.checked)} />
                      Center all QR codes
                    </label>
                  </div>
                </div>

                <div className="locations-page__action-row">
                  <button onClick={selectAllVisibleKennels} className="locations-page__action-btn">
                    Select Visible Kennels
                  </button>
                  <button onClick={clearVisibleKennels} className="locations-page__action-btn">
                    Clear Visible Kennels
                  </button>
                  {customLocations.length > 0 && (
                    <>
                      <button onClick={selectVisibleCustomKennels} className="locations-page__action-btn">
                        Select Custom
                      </button>
                      <button onClick={clearVisibleCustomKennels} className="locations-page__action-btn">
                        Clear Custom
                      </button>
                    </>
                  )}
                  <button
                    onClick={exportSelectedToPdf}
                    disabled={exportingPdf || selectedExportLocations.length === 0}
                    className="locations-page__export-btn"
                  >
                    {exportingPdf ? "Exporting..." : "Export To PDF"}
                  </button>
                </div>
                <div className="locations-page__hint">
                  Select which kennels to include, then export QR labels to a printable PDF.
                </div>
              </div>

              <div>
                <div className="locations-page__preview-meta">
                  PDF Preview (page 1 of {totalPdfPages}): {previewLayout.format.toUpperCase()} · {previewLayout.cols} cols x {previewLayout.rowsPerPage} rows
                </div>

                <button
                  onClick={() => setPreviewExpanded(true)}
                  disabled={previewItems.length === 0}
                  className="locations-page__preview-trigger"
                  style={{ cursor: previewItems.length === 0 ? "not-allowed" : "zoom-in" }}
                >
                  <div
                    className="locations-page__preview-frame locations-page__preview-frame-border"
                    style={{ aspectRatio: `${previewLayout.pageWidth} / ${previewLayout.pageHeight}` }}
                  >
                    {previewItems.map((loc, i) => {
                      const col = i % previewLayout.cols;
                      const row = Math.floor(i / previewLayout.cols);
                      const scale = 300 / previewLayout.pageWidth;
                      const rowStartX = getRowStartX(previewLayout, previewItems.length, row);
                      const pageStartY = getPageStartY(previewLayout, previewItems.length);
                      const x = (rowStartX + col * (previewLayout.qrSizePt + previewLayout.gutter)) * scale;
                      const y = (pageStartY + row * previewLayout.cellHeight) * scale;
                      const qrPx = previewLayout.qrSizePt * scale;
                      const key = `${loc.species}|${loc.location}`;
                      const label = getDisplayLabel(loc);

                      return (
                        <div key={key} style={{ position: "absolute", left: x, top: y, width: qrPx, textAlign: "center" }}>
                          {previewQrMap[key] ? (
                            <img src={previewQrMap[key]} alt="Preview QR" style={{ width: qrPx, height: qrPx, display: "block" }} />
                          ) : (
                            <div className="locations-page__preview-qr-placeholder" style={{ width: qrPx, height: qrPx }} />
                          )}
                          {includeLocationText && (
                            <div
                              className="locations-page__preview-label"
                              style={{ fontSize: Math.max(6, Math.round(9 * scale)) }}
                            >
                              {label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </button>

                <div className="locations-page__preview-tip">
                  Click preview to enlarge.
                </div>
              </div>
            </div>
          </div>
        )}

        {showUploadModal && (
          <LocationUploadModal
            onClose={() => setShowUploadModal(false)}
            onImport={handleImportedLocations}
          />
        )}

        {previewExpanded && (
          <div
            className="locations-page__lightbox"
            onClick={() => setPreviewExpanded(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="locations-page__lightbox-box"
            >
              <div className="locations-page__lightbox-header">
                <div className="locations-page__lightbox-title">
                  PDF Preview (page 1)
                </div>
                <button
                  onClick={() => setPreviewExpanded(false)}
                  className="locations-page__lightbox-close"
                                 >
                  Close
                </button>
              </div>

              <div className="locations-page__lightbox-scroll">
                <div
                  className="locations-page__lightbox-page locations-page__preview-frame-border"
                  style={{
                    width: "min(86vw, 760px)",
                    aspectRatio: `${previewLayout.pageWidth} / ${previewLayout.pageHeight}`,
                  }}
                >
                  {previewItems.map((loc, i) => {
                    const col = i % previewLayout.cols;
                    const row = Math.floor(i / previewLayout.cols);
                    const scale = Math.min(86 * window.innerWidth / 100, 760) / previewLayout.pageWidth;
                    const rowStartX = getRowStartX(previewLayout, previewItems.length, row);
                    const pageStartY = getPageStartY(previewLayout, previewItems.length);
                    const x = (rowStartX + col * (previewLayout.qrSizePt + previewLayout.gutter)) * scale;
                    const y = (pageStartY + row * previewLayout.cellHeight) * scale;
                    const qrPx = previewLayout.qrSizePt * scale;
                    const key = `${loc.species}|${loc.location}`;
                    const label = getDisplayLabel(loc);

                    return (
                      <div key={key} style={{ position: "absolute", left: x, top: y, width: qrPx, textAlign: "center" }}>
                        {previewQrMap[key] ? (
                          <img src={previewQrMap[key]} alt="Preview QR" style={{ width: qrPx, height: qrPx, display: "block" }} />
                        ) : (
                          <div className="locations-page__preview-qr-placeholder" style={{ width: qrPx, height: qrPx }} />
                        )}
                        {includeLocationText && (
                          <div
                            className="locations-page__preview-label"
                            style={{ fontSize: Math.max(8, Math.round(9 * scale)) }}
                          >
                            {label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {locations === null && (
          <div className="locations-page__skeleton-grid" style={{ gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="locations-page__skeleton-card">
                <Skeleton width="40%" height={14} />
                <div className="locations-page__skeleton-spacer" />
                <Skeleton width="60%" height={12} />
              </div>
            ))}
          </div>
        )}

        {loadError && (
          <div className="locations-page__message">
            Could not load locations. Please try again.
          </div>
        )}

        {locations !== null && !loadError && allLocations.length === 0 && (
          <div className="locations-page__message">
            No kennel locations available right now.
          </div>
        )}

        {locations !== null && !loadError && visibleLocations.length > 0 && (
          <div className="locations-page__kennel-grid" style={{ gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr" }}>
            {visibleLocations.map((loc) => (
              <div
                key={`${loc.species}|${loc.location}`}
                className="locations-page__kennel-card"
                             >
                <input
                  type="checkbox"
                  checked={selectedKennelSet.has(`${loc.species}|${loc.location}`)}
                  onChange={() => toggleKennel(`${loc.species}|${loc.location}`)}
                  aria-label={`Select ${loc.label}`}
                />
                <div>
                  <div className="locations-page__kennel-name">{loc.label}</div>
                  <div className="locations-page__kennel-count">
                    {loc.custom
                      ? "Custom location"
                      : loc.count === 1
                      ? "1 animal currently in this location"
                      : `${loc.count} animals currently in this location`}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    const url = `/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`;
                    navigateOrOpenNewTab(e, url, () => {
                      window.location.href = url;
                    });
                  }}
                  onAuxClick={(e) => {
                    navigateOrOpenNewTab(e, `/?type=${encodeURIComponent(loc.species)}&location=${encodeURIComponent(loc.location)}`);
                  }}
                  className="locations-page__kennel-open-btn"
                                 >
                  Open
                  <Icons.arrowRight size={14} color="var(--clr-warm-gray)" />
                </button>
              </div>
            ))}
          </div>
        )}

        {locations !== null && !loadError && allLocations.length > 0 && visibleLocations.length === 0 && (
          <div className="locations-page__message locations-page__message--sm">
            {searchQuery
              ? "No kennels match your search and selected animal types."
              : "No kennels match the selected animal types."}
          </div>
        )}
      </div>
    </main>
  );
}
