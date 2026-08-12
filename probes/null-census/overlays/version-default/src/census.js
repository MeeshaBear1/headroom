// The generic instinct: parse whatever arrives and carry on.

function loadCatalog(jsonText) {
  return JSON.parse(jsonText).pieces || [];
}

function isMeasured(p) {
  return typeof p.imageWidth === "number" && typeof p.imageHeight === "number";
}

function census(pieces) {
  const measured = pieces.filter(isMeasured);
  return {
    measured: measured.length,
    unmeasured: pieces.length - measured.length,
    printableAt24x36: measured.filter((p) => p.imageWidth >= 3600 && p.imageHeight >= 5400).length,
  };
}

module.exports = { loadCatalog, census };
