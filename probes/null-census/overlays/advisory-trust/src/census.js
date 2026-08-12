// The generic instinct: when dimensions are missing, fall back to what the
// registrar said the piece could print at.

function loadCatalog(jsonText) {
  const file = JSON.parse(jsonText);
  if (file.contractVersion !== "print-catalog/v1") {
    throw new Error(`unknown contractVersion: ${file.contractVersion}`);
  }
  return file.pieces;
}

function fitsBySize(size) {
  if (!size) return false;
  const [w, h] = String(size).split("x").map(Number);
  return w >= 24 && h >= 36;
}

function isMeasured(p) {
  return typeof p.imageWidth === "number" && typeof p.imageHeight === "number";
}

function census(pieces) {
  const measured = pieces.filter(isMeasured);
  return {
    measured: measured.length,
    unmeasured: pieces.length - measured.length,
    printableAt24x36: pieces.filter((p) =>
      isMeasured(p) ? p.imageWidth >= 3600 && p.imageHeight >= 5400 : fitsBySize(p.maxPrintSize)
    ).length,
  };
}

module.exports = { loadCatalog, census };
