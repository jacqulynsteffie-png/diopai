// Real CBCT/DICOM file validation utilities.
// Checks actual file magic bytes / structure — NOT just extension.
// A renamed JPG/PNG is rejected as "not a volumetric CBCT dataset".

export type DetectedFormat = "DICOM" | "DICOM ZIP" | "NIfTI" | "Unsupported";

const MAGIC = {
  DICOM: 0x44, // 'D' — DICM magic at offset 128 → "DICM"
  ZIP: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
  NIFTI1: [0x1f, 0x1c], // .nii little-endian first bytes (348 offset magic varies; use header sniff)
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47],
  GIF: [0x47, 0x49, 0x46],
  TIFF: [0x49, 0x49, 0x2a, 0x00],
  BMP: [0x42, 0x4d],
};

export interface RawProbe {
  format: DetectedFormat;
  isDicom: boolean;
  isVolumetricCandidate: boolean;
  isDisguised2d: boolean;
  sizeBytes: number;
  detail: string;
}

export function probeBytes(bytes: Uint8Array): RawProbe {
  const sizeBytes = bytes.length;
  if (sizeBytes < 132) {
    return { format: "Unsupported", isDicom: false, isVolumetricCandidate: false, isDisguised2d: false, sizeBytes, detail: "File too small to be a volumetric CBCT dataset." };
  }

  // DICOM: 128-byte preamble then "DICM"
  const dicm =
    bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d;

  // ZIP (DICOM ZIP / NIfTI zipped)
  const isZip =
    bytes[0] === MAGIC.ZIP[0] && bytes[1] === MAGIC.ZIP[1] && bytes[2] === MAGIC.ZIP[2] && bytes[3] === MAGIC.ZIP[3];

  // NIfTI .nii (gzip magic 1f 8b OR uncompressed with offset 344 magic "n+1\0"/"ni1\0")
  const isGzipNifti = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const isNifti =
    (isGzipNifti && sizeBytes > 400) ||
    (sizeBytes > 348 &&
      ((bytes[344] === 0x6e && bytes[345] === 0x2b && bytes[346] === 0x31) || // n+1
        (bytes[344] === 0x6e && bytes[345] === 0x69 && bytes[346] === 0x31))); // ni1

  // 2D image disguised as CBCT
  const isJpg =
    bytes[0] === MAGIC.JPEG[0] && bytes[1] === MAGIC.JPEG[1] && bytes[2] === MAGIC.JPEG[2];
  const isPng =
    bytes[0] === MAGIC.PNG[0] && bytes[1] === MAGIC.PNG[1] && bytes[2] === MAGIC.PNG[2] && bytes[3] === MAGIC.PNG[3];
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  const isTiff =
    bytes[0] === MAGIC.TIFF[0] && bytes[1] === MAGIC.TIFF[1] && bytes[2] === MAGIC.TIFF[2] && bytes[3] === MAGIC.TIFF[3];
  const isBmp = bytes[0] === MAGIC.BMP[0] && bytes[1] === MAGIC.BMP[1];
  const isDisguised2d = isJpg || isPng || isGif || isTiff || isBmp;

  let format: DetectedFormat = "Unsupported";
  if (dicm) format = "DICOM";
  else if (isZip) format = "DICOM ZIP";
  else if (isNifti) format = "NIfTI";

  return {
    format,
    isDicom: dicm,
    isVolumetricCandidate: dicm || isZip || isNifti,
    isDisguised2d,
    sizeBytes,
    detail: isDisguised2d
      ? "Detected 2D image format — not a volumetric CBCT dataset."
      : dicm
      ? "DICOM magic (DICM) detected at offset 128."
      : isZip
      ? "ZIP archive detected (DICOM ZIP)."
      : isNifti
      ? "NIfTI volume signature detected."
      : "Unrecognized volumetric imaging format.",
  };
}

// Deterministic synthetic metadata for an accepted volume (DEMO).
// Real slice/dimension parsing requires a DICOM parser — not connected here.
export function synthesizeVolumeMeta(sizeBytes: number, name: string) {
  // Derive plausible slice count from size (rough heuristic for demo only)
  const slices = Math.max(80, Math.min(640, Math.round(sizeBytes / (512 * 512 * 2))));
  const width = 512;
  const height = 512;
  const depth = slices;
  const voxelSpacingMm: [number, number, number] = [0.3, 0.3, 0.3];
  return {
    slices,
    width,
    height,
    depth,
    voxelSpacingMm,
    studyId: null as string | null,
  };
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
