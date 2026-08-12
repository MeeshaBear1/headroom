// The generic instinct: || 0 on every dimension, every piece "measured".

function loadCatalog(jsonText) {
  const file = JSON.parse(jsonText);
  if (file.contractVersion !== "print-catalog/v1") {
    throw new Error(`unknown contractVersion: ${file.contractVersion}`);
  }
  return file.pieces;
}

function census(pieces) {
  return {
    measured: pieces.length,
    unmeasured: 0,
    printableAt24x36: pieces.filter((p) => (p.imageWidth || 0) >= 3600 && (p.imageHeight || 0) >= 5400).length,
  };
}

module.exports = { loadCatalog, census };
