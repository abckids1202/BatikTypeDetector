import type { Motif } from "../types";

export const motifs: Motif[] = [
  {
    slug: "kawung",
    name: "Kawung",
    family: "Geometric",
    summary: "Repeating oval forms arranged around a central axis.",
    visual_signature: ["repeated ovals", "four-way rhythm", "strong symmetry"],
    traditional_associations: ["Yogyakarta-associated"],
  },
  {
    slug: "parang",
    name: "Parang",
    family: "Diagonal",
    summary: "Slanted repeating forms that create a directional visual rhythm.",
    visual_signature: ["diagonal flow", "continuous repetition", "banded rhythm"],
    traditional_associations: ["Javanese courtly associations vary by variant"],
  },
  {
    slug: "mega-mendung",
    name: "Mega Mendung",
    family: "Organic",
    summary: "Layered cloud-like contours with a sweeping silhouette.",
    visual_signature: ["layered contours", "cloud-like curves", "large-scale rhythm"],
    traditional_associations: ["Cirebon-associated"],
  },
  {
    slug: "truntum",
    name: "Truntum",
    family: "Floral",
    summary: "A repeating field of small star or flower-like units.",
    visual_signature: ["small repeated units", "dense field", "even spacing"],
    traditional_associations: ["Variant-specific source review required"],
  },
  {
    slug: "ceplok",
    name: "Ceplok",
    family: "Geometric",
    summary: "A broad family of geometric compositions built from modular cells.",
    visual_signature: ["modular cells", "grid repetition", "balanced geometry"],
    traditional_associations: ["A family label, not one single motif"],
  },
  {
    slug: "nitik",
    name: "Nitik",
    family: "Geometric",
    summary: "A fine, dotted visual language made from small repeated marks.",
    visual_signature: ["dotted texture", "fine repetition", "woven cadence"],
    traditional_associations: ["Read from reviewed source records"],
  },
  {
    slug: "sekar-jagad",
    name: "Sekar Jagad",
    family: "Composite",
    summary: "A composite field bringing several patch-like zones into one composition.",
    visual_signature: ["patchwork structure", "varied zones", "composite rhythm"],
    traditional_associations: ["Interpretive claims require provenance"],
  },
];

export const motifBySlug = Object.fromEntries(motifs.map((motif) => [motif.slug, motif]));

