// Census over a house catalogue.
//
// loadCatalog(jsonText) -> the pieces array from a house catalogue file
// census(pieces)        -> { measured, unmeasured, printableAt24x36 }

const KNOWN_VERSION = "print-catalog/v1";

function loadCatalog(jsonText) {
  const file = JSON.parse(jsonText);
  if (file.contractVersion !== KNOWN_VERSION) {
    throw new Error(`unknown contractVersion: ${file.contractVersion}`);
  }
  return file.pieces;
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
