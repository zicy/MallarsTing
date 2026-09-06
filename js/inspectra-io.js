import { downloadBlob } from "./util.js";
import { getTemplate } from "./store.js";

const FORMAT_VERSION = 1;

export function buildInspectraFile(template) {
  return {
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    template: template,
  };
}

export function downloadInspectraFile(template) {
  const payload = buildInspectraFile(template);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const filename = template.referenceId + "_v" + template.version + ".inspectra";
  downloadBlob(blob, filename);
  return filename;
}

export function parseInspectraFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error("Filen kunne ikke læses som Inspectra-data.");
  }
  if (!data || typeof data !== "object" || !data.template) {
    throw new Error("Filen indeholder ikke en gyldig kontrolskabelon.");
  }
  const t = data.template;
  if (!t.referenceId || !t.name || !Array.isArray(t.groups)) {
    throw new Error("Kontrolskabelonen mangler påkrævede felter.");
  }
  return data;
}

export function readInspectraFile(file) {
  return file.text().then(parseInspectraFile);
}

/**
 * Compares an imported template against whatever is already installed
 * locally under the same referenceId.
 * Returns one of:
 *   { action: "new" }
 *   { action: "update", installedVersion, importedVersion }
 *   { action: "same-or-older", installedVersion, importedVersion }
 */
export function describeInstall(incomingTemplate) {
  const existing = getTemplate(incomingTemplate.referenceId);
  if (!existing) return { action: "new" };
  if (incomingTemplate.version > existing.version) {
    return {
      action: "update",
      installedVersion: existing.version,
      importedVersion: incomingTemplate.version,
      installedUpdatedAt: existing.updatedAt,
    };
  }
  return {
    action: "same-or-older",
    installedVersion: existing.version,
    importedVersion: incomingTemplate.version,
  };
}
