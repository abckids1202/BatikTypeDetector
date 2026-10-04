import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { analyzeImage } from "./lib/api";
import { motifBySlug, motifs } from "./data/motifs";
import type { Analysis, Motif } from "./types";

function Brand() {
  return <Link className="brand" to="/"><span className="brand-mark">✦</span><span><strong>BatikVision</strong><small>visual heritage explorer</small></span></Link>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <div className="notice-bar"><span>Prototype workspace</span><span>Predictions are experimental · cultural claims require sources</span></div>
    <header className="site-header"><Brand /><nav className="main-nav" aria-label="Primary navigation"><NavLink to="/identify">Identify</NavLink><NavLink to="/explore">Explore</NavLink><NavLink to="/atlas">Atlas</NavLink><NavLink to="/research">Research</NavLink></nav><Link className="header-cta" to="/identify">Try an image <span>↗</span></Link></header>
    <main>{children}</main>
    <footer className="site-footer"><div><Brand /><p>Making visual heritage more discoverable, one pattern at a time.</p></div><div className="footer-links"><Link to="/about">About</Link><Link to="/methodology">Methodology</Link><Link to="/research">Research transparency</Link></div><div className="footer-note">Built with care for cultural context.</div></footer>
  </div>;
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="section-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>;
}

function MotifCard({ motif, compact = false }: { motif: Motif; compact?: boolean }) {
  return <Link className={"motif-card " + (compact ? "compact" : "")} to={"/motifs/" + motif.slug}><div className={"motif-art art-" + motif.slug}><span>{motif.name.slice(0, 1)}</span></div><div className="motif-card-copy"><div className="card-meta"><span>{motif.family}</span><span>↗</span></div><h3>{motif.name}</h3>{!compact && <p>{motif.summary}</p>}</div></Link>;
}

function Home() {
  const steps = [["01", "Upload", "Crop to the textile so the pattern occupies most of the frame."], ["02", "Analyze", "A visual model produces likely motif families and an uncertainty signal."], ["03", "Explore", "See related examples and read cultural context with source status."], ["04", "Reflect", "Learn what the system knows, what it does not, and why."]];
  return <>
    <section className="hero page-pad"><div className="hero-copy"><span className="eyebrow">Indonesian visual heritage · 01</span><h1>Discover the visual language of <em>batik.</em></h1><p className="hero-lede">Identify likely motif families, find visually related patterns, and explore the cultural context behind them.</p><div className="hero-actions"><Link className="button primary" to="/identify">Identify a batik <span>↗</span></Link><Link className="button text-button" to="/atlas">Explore the atlas <span>→</span></Link></div><div className="hero-footnote"><span className="pulse-dot" /> A research-minded prototype for exploration and learning</div></div><div className="hero-visual" aria-label="Abstract batik pattern illustration"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-sun">✦</div><div className="hero-stamp">Batik<br />Vision<br /><small>Java · Nusantara</small></div><div className="hero-caption">visual<br />language<br />archive</div></div></section>
    <section className="story-strip page-pad"><div><span className="eyebrow">A careful distinction</span><h2>Pixels can suggest.<br /><em>People provide context.</em></h2></div><p>BatikVision keeps model predictions, visual similarity, and cultural knowledge in separate lanes. A likely motif is a starting point for learning — never proof of authenticity, origin, or value.</p><Link className="round-link" to="/methodology">Read our approach <span>↗</span></Link></section>
    <section className="page-pad feature-section"><div className="section-heading"><div><span className="eyebrow">How it works</span><h2>From image to insight</h2></div><span className="section-index">02 / 04</span></div><div className="steps">{steps.map(([number, title, copy]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
    <section className="page-pad motifs-preview"><div className="section-heading"><div><span className="eyebrow">The visual lexicon</span><h2>Start with a motif family</h2></div><Link to="/explore" className="under-link">View all motifs →</Link></div><div className="motif-grid">{motifs.slice(0, 4).map((motif) => <MotifCard motif={motif} key={motif.slug} />)}</div></section>
  </>;
}

function FileDrop({ onFile, file }: { onFile: (file: File) => void; file: File | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const choose = (event: ChangeEvent<HTMLInputElement>) => { const picked = event.target.files?.[0]; if (picked) onFile(picked); };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const picked = event.dataTransfer.files?.[0]; if (picked) onFile(picked); };
  return <div className={"drop-zone " + (dragging ? "dragging " : "") + (file ? "has-file" : "")} onClick={() => input.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") input.current?.click(); }}><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} hidden /><div className="upload-icon">＋</div><strong>{file ? file.name : "Drop a batik image here"}</strong><span>{file ? "Click to choose a different image" : "or click to browse · JPG, PNG, WEBP · up to 10 MB"}</span></div>;
}

function Identify() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chooseFile = (picked: File) => { setError(""); setFile(picked); setPreview(URL.createObjectURL(picked)); };
  const runAnalysis = async () => {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const result = await analyzeImage(file);
      sessionStorage.setItem("batikvision-analysis", JSON.stringify(result));
      sessionStorage.setItem("batikvision-preview", preview ?? "");
      navigate("/analysis/" + result.analysis_id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analysis failed. Is the API running?");
    } finally { setBusy(false); }
  };
  return <div className="page-pad page"><SectionIntro eyebrow="Identify · 01" title="What pattern are you looking at?" copy="Upload a clear photo of batik and receive a careful, visual starting point. The system can be uncertain — that is useful information too." /><div className="identify-layout"><div><FileDrop onFile={chooseFile} file={file} />{preview && <img className="selected-preview" src={preview} alt="Selected batik preview" />}<div className="upload-guidance"><span>◎</span><p><strong>For best results</strong><br />Crop so the textile pattern fills the frame. Avoid glare, folds, and busy backgrounds where possible.</p></div>{error && <div className="error-callout">{error}</div>}<button className="button primary full-button" disabled={!file || busy} onClick={runAnalysis}>{busy ? "Reading the pattern…" : "Analyze this image"} <span>↗</span></button></div><aside className="side-note"><span className="eyebrow">Before you begin</span><h3>This is a visual conversation, not an authenticity test.</h3><p>Images can contain multiple motifs, adaptations, and local variations. Results are phrased as likely families and are paired with uncertainty.</p><div className="note-line" /><Link to="/methodology" className="under-link">How the method works →</Link></aside></div></div>;
}

function AnalysisPage() {
  const stored = sessionStorage.getItem("batikvision-analysis");
  const preview = sessionStorage.getItem("batikvision-preview");
  const analysis = stored ? (JSON.parse(stored) as Analysis) : null;
  if (!analysis) return <div className="page-pad empty-state"><span className="eyebrow">Analysis</span><h1>No analysis loaded yet.</h1><Link className="button primary" to="/identify">Upload an image</Link></div>;
  const uncertain = analysis.known_pattern_probability < 0.54;
  return <div className="page-pad page"><div className="analysis-topline"><div><span className="eyebrow">Analysis · prototype result</span><h1>Your visual reading</h1></div><Link className="button ghost" to="/identify">New image</Link></div><div className="result-grid"><div className="result-image-panel">{preview ? <img src={preview} alt="Uploaded batik" /> : <div className="image-placeholder">Image preview</div>}<span className="image-label">{analysis.filename}</span></div><div className="result-summary">{uncertain ? <div className="uncertain-box"><span className="status-icon">?</span><div><strong>We aren't confident about this one.</strong><p>This image may be outside the motif families in the prototype. Try a tighter crop or explore the visual matches.</p></div></div> : <><span className="eyebrow">Most likely motif family</span><h2>{analysis.predictions[0].motif}</h2><div className="confidence-number">{Math.round(analysis.predictions[0].probability * 100)}<small>%</small></div><div className="confidence-row"><span>Model confidence · {analysis.confidence_level}</span><span>{Math.round(analysis.known_pattern_probability * 100)}% known-pattern signal</span></div></>}<div className="prediction-list">{analysis.predictions.map((prediction, index) => <div className="prediction" key={prediction.motif_slug}><span className="rank">{String(index + 1).padStart(2, "0")}</span><span>{prediction.motif}</span><div className="prediction-bar"><i style={{ width: Math.max(8, prediction.probability * 100) + "%" }} /></div><strong>{Math.round(prediction.probability * 100)}%</strong></div>)}</div></div></div><div className="result-section"><div className="section-heading"><div><span className="eyebrow">Visual similarity</span><h2>Patterns to look at next</h2></div><span className="small-muted">Similarity is not probability</span></div><div className="match-grid">{analysis.matches.map((match) => <Link className="match-card" to={"/motifs/" + match.motif_slug} key={match.image_id}><div className={"match-art art-" + match.motif_slug}><span>{match.motif.slice(0, 1)}</span></div><div><strong>{match.motif}</strong><span>{Math.round(match.similarity * 100)}% visual similarity</span></div></Link>)}</div></div><div className="context-grid"><div><span className="eyebrow">About {analysis.cultural_context.motif}</span><h2>Let the pattern open a door.</h2><p>{analysis.cultural_context.summary}</p><Link className="under-link" to={"/motifs/" + analysis.predictions[0].motif_slug}>Explore the motif page →</Link></div><div className="context-card"><span className="context-icon">✦</span><h3>Visual signature</h3><div className="tag-list">{analysis.cultural_context.visual_signature.map((item) => <span key={item}>{item}</span>)}</div><div className="source-status">◌ Cultural source status: {analysis.cultural_context.source_status}</div></div></div><div className="method-callout"><strong>Prototype notice</strong><span>This result comes from a transparent visual-feature prototype, not a trained and evaluated classifier. Do not use it to infer authenticity, age, artisan identity, value, or exact geographic origin.</span><Link to="/research">See research status →</Link></div></div>;
}

function Explore() {
  const [filter, setFilter] = useState("All");
  const families = ["All", ...Array.from(new Set(motifs.map((motif) => motif.family)))];
  const filtered = filter === "All" ? motifs : motifs.filter((motif) => motif.family === filter);
  return <div className="page-pad page"><SectionIntro eyebrow="Explore · 02" title="A living visual lexicon." copy="Browse motif families as visual starting points. Each profile separates what the image suggests from what cultural sources document." /><div className="filter-row">{families.map((family) => <button className={filter === family ? "filter active" : "filter"} onClick={() => setFilter(family)} key={family}>{family}</button>)}</div><div className="motif-grid explore-grid">{filtered.map((motif) => <MotifCard motif={motif} key={motif.slug} />)}</div></div>;
}

function MotifPage() {
  const { slug } = useParams();
  const motif = slug ? motifBySlug[slug] : undefined;
  if (!motif) return <div className="page-pad empty-state"><h1>Motif not found.</h1><Link to="/explore" className="button primary">Back to motifs</Link></div>;
  return <div className="page-pad page"><Link className="back-link" to="/explore">← All motifs</Link><div className="motif-detail-head"><div className={"detail-art art-" + motif.slug}><span>{motif.name.slice(0, 1)}</span></div><div><span className="eyebrow">{motif.family} family · profile</span><h1>{motif.name}</h1><p>{motif.summary}</p><div className="source-status">◌ Source-backed cultural claims are being curated for this prototype.</div></div></div><div className="detail-columns"><section><span className="eyebrow">Visual signature</span><h2>What the eye may notice</h2><div className="signature-list">{motif.visual_signature.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}</div></section><aside className="association-card"><span className="eyebrow">Traditional associations</span><h3>Context needs a source.</h3>{motif.traditional_associations.map((item) => <p key={item}>{item}</p>)}<div className="note-line" /><span className="small-muted">This page does not assert origin, authenticity, age, or value.</span></aside></div><div className="detail-footer"><span className="eyebrow">Keep exploring</span><h2>See how this family sits among the others.</h2><Link className="button primary" to="/atlas">Open visual atlas ↗</Link></div></div>;
}

function Compare() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [aUrl, setAUrl] = useState("");
  const [bUrl, setBUrl] = useState("");
  const pick = (which: "a" | "b") => (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); if (which === "a") { setA(file); setAUrl(url); } else { setB(file); setBUrl(url); } };
  const similarity = a && b ? 81 : null;
  return <div className="page-pad page"><SectionIntro eyebrow="Compare · 03" title="Put two patterns side by side." copy="Compare is designed to make similarity inspectable: the score is visual, not a claim that two textiles share the same history." /><div className="compare-grid"><div className="compare-upload"><label>Image A<input type="file" accept="image/*" onChange={pick("a")} />{aUrl ? <img src={aUrl} alt="First comparison image" /> : <span>＋<small>Choose an image</small></span>}</label></div><div className="compare-symbol">＋</div><div className="compare-upload"><label>Image B<input type="file" accept="image/*" onChange={pick("b")} />{bUrl ? <img src={bUrl} alt="Second comparison image" /> : <span>＋<small>Choose an image</small></span>}</label></div></div>{similarity ? <div className="compare-result"><span className="eyebrow">Visual similarity</span><strong>{similarity}<small>%</small></strong><p>Once the embedding service is connected, this score will come from normalized image vectors and will be accompanied by retrieval evidence.</p></div> : <div className="compare-empty">Choose two images to reveal a side-by-side comparison.</div>}</div>;
}

function Atlas() {
  const points = useMemo(() => motifs.flatMap((motif, motifIndex) => Array.from({ length: 5 }, (_, index) => ({ motif, left: 10 + ((motifIndex * 23 + index * 13) % 82), top: 14 + ((motifIndex * 31 + index * 17) % 70), index }))), []);
  return <div className="page-pad page"><SectionIntro eyebrow="Visual atlas · 04" title="A field of relationships." copy="An interactive embedding atlas will let researchers inspect how visual representations cluster. This first canvas makes the concept tangible while the dataset is being assembled." /><div className="atlas-shell"><div className="atlas-axis axis-x" /><div className="atlas-axis axis-y" />{points.map((point) => <Link className={"atlas-point art-" + point.motif.slug} style={{ left: point.left + "%", top: point.top + "%" }} to={"/motifs/" + point.motif.slug} key={point.motif.slug + "-" + point.index} title={point.motif.name}><span>{point.motif.name.slice(0, 1)}</span></Link>)}<span className="atlas-label label-one">more geometric</span><span className="atlas-label label-two">more organic</span><span className="atlas-label label-three">dense repetition</span></div><div className="atlas-legend">{motifs.map((motif) => <Link to={"/motifs/" + motif.slug} key={motif.slug}><i className={"legend-dot art-" + motif.slug} />{motif.name}</Link>)}</div><div className="method-callout"><strong>Research status</strong><span>Coordinates are illustrative until verified embeddings and group-safe test data are available.</span><Link to="/research">Read limitations →</Link></div></div>;
}

function Research() {
  const rows = [["Macro F1", "Not yet evaluated"], ["Retrieval Recall@5", "Not yet evaluated"], ["OOD AUROC", "Not yet evaluated"], ["Real-world test", "Not yet evaluated"]];
  return <div className="page-pad page"><SectionIntro eyebrow="Research transparency" title="Show the work. Show the limits." copy="A research-facing product should make its uncertainty visible. Metrics below stay blank until they are measured on a provenance-preserving dataset." /><div className="research-grid"><div className="model-card"><span className="eyebrow">Current model</span><h2>Prototype Features v0.1</h2><p>Deterministic RGB, luminance, contrast, edge-density, and aspect features. This keeps the end-to-end workflow testable before a trained artifact is available.</p><div className="model-status"><span className="pulse-dot" /> Not evaluated · not for production decisions</div></div><div className="metrics-card"><span className="eyebrow">Evaluation ledger</span>{rows.map(([label, value]) => <div className="metric-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div><div className="research-sections"><section><span className="eyebrow">Known limitations</span><h2>A useful beginning is still a beginning.</h2></section><div className="limitation-list">{["No trained classifier artifact is bundled yet.", "Cultural claims are intentionally marked for curator review.", "Similarity gallery images are placeholders until licensed assets are ingested.", "A clean test set and independent real-world test set are required before deployment."].map((item, index) => <div key={item}><span>0{index + 1}</span><p>{item}</p></div>)}</div></div></div>;
}

function About({ methodology = false }: { methodology?: boolean }) {
  return <div className="page-pad page text-page"><span className="eyebrow">{methodology ? "Methodology" : "About BatikVision"}</span><h1>{methodology ? "A visual model is not a cultural authority." : "Built for curious eyes and careful claims."}</h1><p className="lede">{methodology ? "BatikVision is designed as a sequence: image preprocessing, motif-family prediction, embedding retrieval, uncertainty, and then source-backed context. Each layer has a different job." : "BatikVision is an open-ended research and learning interface for Indonesian batik. It helps people notice patterns and ask better questions without flattening a living tradition into a label."}</p><div className="prose-grid"><div><h2>Separate the lanes</h2><p>The model can describe visual signals. A knowledge base can hold claims, relationships, and sources. Neither one should impersonate an artisan, a curator, or a historical record.</p></div><div><h2>Keep uncertainty useful</h2><p>Unknown-pattern handling is part of the product, not an error state. A low-confidence result can guide a better crop, a broader search, or a conversation with a human expert.</p></div><div><h2>Make provenance visible</h2><p>Every cultural claim should eventually point to a reviewed source. The prototype leaves that status visible so missing evidence cannot quietly become authority.</p></div></div><Link className="button primary" to="/identify">Try the prototype ↗</Link></div>;
}

export default function App() {
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/identify" element={<Identify />} /><Route path="/analysis/:analysisId" element={<AnalysisPage />} /><Route path="/explore" element={<Explore />} /><Route path="/motifs/:slug" element={<MotifPage />} /><Route path="/compare" element={<Compare />} /><Route path="/atlas" element={<Atlas />} /><Route path="/research" element={<Research />} /><Route path="/about" element={<About />} /><Route path="/methodology" element={<About methodology />} /><Route path="*" element={<Home />} /></Routes></Layout>;
}

