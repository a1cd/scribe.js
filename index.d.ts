/**
 * TypeScript declarations for scribe.js
 * High-quality OCR and text extraction for images and PDFs.
 * https://github.com/scribeocr/scribe.js
 *
 * @module scribe.js
 */

// ---------------------------------------------------------------------------
// Primitive / shared geometry
// ---------------------------------------------------------------------------

/** Axis-aligned bounding box in page coordinates (pixels). */
export interface Bbox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Width and height of a page or image. */
export interface Dims {
  width: number;
  height: number;
}

/** 2-D point. */
export interface Point {
  x: number;
  y: number;
}

/** Four-corner polygon (used for skewed / rotated words). */
export interface Polygon {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
}

// ---------------------------------------------------------------------------
// OCR data model
// ---------------------------------------------------------------------------

/**
 * Text source that produced this OCR data.
 * `null` means the source is unknown or not yet assigned.
 * `'stext'` is an intermediate format extracted directly from PDF by MuPDF.
 */
export type TextSource =
  | null
  | 'tesseract'
  | 'textract'
  | 'google_vision'
  | 'google_doc_ai'
  | 'abbyy'
  | 'alto'
  | 'stext'
  | 'hocr'
  | 'text'
  | 'azure_doc_intel'
  | 'docx';

/** Per-word typographic style. All properties reflect the style of the word as recognised. */
export interface WordStyle {
  /** Font family name, or `null` when unknown. */
  font: string | null;
  /** Font size in points, or `null` when unknown. */
  size: number | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  smallCaps: boolean;
  /** `true` if this word is a superscript. */
  sup: boolean;
  /** `true` if this word is a drop-cap. */
  dropcap: boolean;
}

/** A single character with its own bounding box (character-level OCR data). */
export interface OcrChar {
  /** Character text (single Unicode code-point in most cases). */
  text: string;
  bbox: Bbox;
}

/** Semantic paragraph type. */
export type ParType = 'title' | 'body' | 'footnote';

/** A recognised word on a page. */
export interface OcrWord {
  /** Unique word identifier within the document. */
  id: string;
  /** Recognised text of the word. */
  text: string;
  /** Alternative text (used internally during comparison / combination). */
  textAlt: string | null;
  /** Confidence score (0 – 100). */
  conf: number;
  /** BCP-47 language tag detected for this word (e.g. `'eng'`). */
  lang: string;
  bbox: Bbox;
  /** Four-corner polygon – set for skewed words, otherwise `null`. */
  poly: Polygon | null;
  style: WordStyle;
  /**
   * `true` when the bounding box represents the visual extent of the glyphs.
   * `false` when it represents the font bounding box (may be wider).
   */
  visualCoords: boolean;
  /** `true` when word was matched against ground-truth data. */
  matchTruth: boolean;
  /** `true` when the word was compared against ground-truth data. */
  compTruth: boolean;
  /** Character-level data when available; `null` otherwise. */
  chars: OcrChar[] | null;
  /** ID of the footnote paragraph this word references, when it is a superscript footnote marker. */
  footnoteParId: string | null;
}

/** A horizontal run of words forming a text line. */
export interface OcrLine {
  /** Unique line identifier. */
  id: string;
  bbox: Bbox;
  /**
   * Baseline as `[slope, intercept]` where
   * `y = slope * x + intercept` defines the baseline in page coordinates.
   */
  baseline: [number, number];
  /** Height of ascender characters in pixels, or `null` when unknown. */
  ascHeight: number | null;
  /** Height of x-height characters in pixels, or `null` when unknown. */
  xHeight: number | null;
  /**
   * Page rotation that applies to this line.
   * `0` = horizontal, `1` = 90° CCW, `2` = 180°, `3` = 90° CW.
   */
  orientation: 0 | 1 | 2 | 3;
  words: OcrWord[];
}

/** A semantic paragraph grouping one or more lines. */
export interface OcrPar {
  /** Unique paragraph identifier. */
  id: string;
  bbox: Bbox;
  lines: OcrLine[];
  type: ParType;
  /**
   * Paragraph / list number as it appears in the text, when applicable.
   * `null` for ordinary body paragraphs.
   */
  parNum: string | null;
  /**
   * ID of the footnote reference word that links to this footnote.
   * Only set when `type === 'footnote'`.
   */
  footnoteRefId: string | null;
}

/** OCR result for a single page. */
export interface OcrPage {
  /** 0-based page index. */
  n: number;
  dims: Dims;
  /** Page rotation angle in degrees. `0` for an upright page. */
  angle: number;
  /** All recognised lines on the page (flat list, irrespective of paragraph). */
  lines: OcrLine[];
  /** Paragraph groupings. May be empty when paragraph detection was not run. */
  pars: OcrPar[];
  /** Source engine / format that produced this page's OCR data. */
  textSource: TextSource;
}

// ---------------------------------------------------------------------------
// Page metrics
// ---------------------------------------------------------------------------

/**
 * Authoritative metrics for a source-document page.
 * These values are independent from the OCR data and should be used for
 * any task that needs page geometry (e.g. rendering, coordinate transforms).
 */
export interface PageMetrics {
  /** Page angle in degrees, or `null` when not yet determined. */
  angle: number | null;
  dims: Dims;
  /** Left margin in pixels, or `null` when not yet determined. */
  left: number | null;
  /** Manual angle adjustment applied by the user. */
  manAdj: number;
}

// ---------------------------------------------------------------------------
// Layout / table types
// ---------------------------------------------------------------------------

/** Inclusion rule for a layout box. */
export type InclusionRule = 'majority' | 'left' | string;
/** Granularity at which inclusion is evaluated. */
export type InclusionLevel = 'word' | 'line' | string;

/** Base class for layout region boxes. */
export interface LayoutBoxBase {
  id: string;
  coords: Bbox;
  inclusionRule: InclusionRule;
  inclusionLevel: InclusionLevel;
}

/** A single column within a detected data table. */
export interface LayoutDataColumn extends LayoutBoxBase {
  type: 'dataColumn';
}

/** A region that controls reading-order or text exclusion. */
export interface LayoutRegion extends LayoutBoxBase {
  /** `'order'` = defines reading order; `'exclude'` = excludes content from export. */
  type: 'order' | 'exclude';
  /** Priority / order index for this region. */
  order: number;
}

/** All layout regions on a single page. */
export interface LayoutPage {
  /** 0-based page index. */
  n: number;
  /** `true` if no custom regions have been defined (page is using defaults). */
  default: boolean;
  /** Map from region ID to `LayoutRegion`. */
  boxes: Record<string, LayoutRegion>;
}

/** A detected data table on a single page. */
export interface LayoutDataTable {
  id: string;
  boxes: LayoutDataColumn[];
  /** Bottom y-coordinate of each row; auto-detected when `null`. */
  rowBounds: number[] | null;
}

/** All detected data tables on a single page. */
export interface LayoutDataTablePage {
  /** 0-based page index. */
  n: number;
  /** `true` if no tables have been detected yet. */
  default: boolean;
  tables: LayoutDataTable[];
}

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

/** A highlight or annotation placed on a page. */
export interface AnnotationHighlight {
  bbox: Bbox;
  /** CSS hex colour string (e.g. `'#ffeb3b'`). */
  color: string;
  /** Opacity in the range 0 – 1. */
  opacity: number;
  /** Identifier that groups related highlights together. */
  groupId: string;
  /** Optional comment / tooltip text. */
  comment?: string;
  /** Additional bounding quads for multi-line highlights. */
  quads?: Bbox[];
}

// ---------------------------------------------------------------------------
// Highlight spec (input to addHighlights)
// ---------------------------------------------------------------------------

/**
 * Specification for a single highlight to add to the document.
 *
 * Two modes:
 * - **Line mode** (`startLine`/`endLine` provided): highlights the specified
 *   line range. If `text` is also provided, it narrows the first and last
 *   lines to the matching words.
 * - **Quote-only mode** (only `page` + `text`): searches the entire page for
 *   the quote and highlights the matching words.
 */
export interface HighlightSpec {
  /** 0-based page index. */
  page: number;
  /** First line index to highlight (0-based). If omitted, quote-only mode is used. */
  startLine?: number;
  /** Last line index to highlight (0-based). Defaults to `startLine`. */
  endLine?: number;
  /**
   * Text to highlight.  In line mode this narrows the first/last line to
   * matching words.  In quote-only mode the whole page is searched.
   */
  text?: string;
  /** Hex highlight colour. Default `'#ffff00'`. */
  color?: string;
  /** Opacity 0 – 1. Default `0.4`. */
  opacity?: number;
  /** Comment text for the annotation. */
  comment?: string;
}

/** Result returned by `addHighlights`. */
export interface AddHighlightsResult {
  highlightsApplied: number;
  totalLinesHighlighted: number;
}

// ---------------------------------------------------------------------------
// Progress messages
// ---------------------------------------------------------------------------

/** Progress message emitted during general operations (import, export, render). */
export interface ProgressMessageGeneral {
  type: 'export' | 'importImage' | 'importPDF' | 'render';
  /** 0-based page index being processed. */
  n: number;
  info: Record<string, never>;
}

/** Progress message emitted during OCR conversion. */
export interface ProgressMessageConvert {
  type: 'convert';
  n: number;
  info: { engineName: string };
}

/** Progress message emitted during OCR recognition. */
export interface ProgressMessageRecognize {
  type: 'recognize';
  n?: number;
  info?: {
    status?: string;
    engineName?: string;
    elapsedMs?: number;
    responsesReceived?: number;
    timestamp?: number;
  };
}

/** Union of all progress message types emitted by `opt.progressHandler`. */
export type ProgressMessage =
  | ProgressMessageGeneral
  | ProgressMessageConvert
  | ProgressMessageRecognize;

// ---------------------------------------------------------------------------
// Custom recognition model
// ---------------------------------------------------------------------------

/** Supported output formats from external OCR engines / models. */
export type RecognitionOutputFormat =
  | 'textract'
  | 'google_vision'
  | 'google_doc_ai'
  | 'azure_doc_intel'
  | 'hocr'
  | 'abbyy'
  | 'alto'
  | 'stext'
  | 'text';

/** Result returned by a custom recognition model for a single image. */
export interface RecognitionResult {
  success: boolean;
  rawData?: string;
  format: RecognitionOutputFormat | string;
  error?: Error;
}

/** Configuration for a custom recognition model. */
export interface RecognitionModelConfig {
  /** Human-readable engine name stored in `data.ocr`. */
  name: string;
  /**
   * Output format produced by the model.
   * When `null` the model must supply a `convertPage` implementation.
   */
  outputFormat: RecognitionOutputFormat | null;
  /** Optional rate-limiting hint (TPS or RPM). */
  rateLimit?: { tps: number } | { rpm: number };
}

/**
 * Interface for a custom OCR model that can be passed to `recognize`.
 *
 * Implement `recognizeImage` for per-page recognition, and optionally
 * `recognizeDocument` for document-level recognition (e.g. a server proxy).
 */
export interface RecognitionModel {
  config: RecognitionModelConfig;

  /**
   * Recognise a single page from its raw image bytes.
   * @param imageData PNG/JPEG bytes for the page.
   * @param options  Forwarded from `recognize({ modelOptions })`.
   */
  recognizeImage(
    imageData: Uint8Array | ArrayBuffer,
    options?: Record<string, unknown>
  ): Promise<RecognitionResult>;

  /**
   * Recognise the whole document at once (document-mode).
   * The returned async iterable yields one entry per page.
   */
  recognizeDocument?: (
    documentData: {
      pdfBytes: ArrayBuffer | null;
      pageCount: number;
      pageDims: Dims[];
    },
    options?: Record<string, unknown>
  ) => Promise<AsyncIterable<{ n: number; rawData: string } | null>>;

  /**
   * Convert raw model output for page `n` into scribe.js's internal
   * `OcrPage` model. Only needed when the built-in converters do not
   * support the model's output format.
   */
  convertPage?: (
    rawData: string,
    n: number
  ) => Promise<{
    pageObj: OcrPage;
    dataTables: LayoutDataTablePage;
    warn: object;
    langSet: Set<string>;
    fontSet: Set<string>;
  }>;

  /** Return `true` if the error represents an API rate-limit / throttling response. */
  isThrottlingError?: (error: Error) => boolean;
}

// ---------------------------------------------------------------------------
// File input types
// ---------------------------------------------------------------------------

/**
 * A Node.js file-like object created internally when file paths are provided
 * on Node.js. Mirrors the browser `File` interface.
 */
export interface FileNode {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

/**
 * Union of all file-like values accepted by `importFiles` / `importFilesSupp`
 * when passing a flat array (browser or Node.js).
 */
export type ScribeInputFile = string | URL | File | Blob | ArrayBuffer | Uint8Array | FileNode;

/**
 * Pre-sorted input object for `importFiles` / `importFilesSupp`.
 * Use this when you want explicit control over which files are treated as
 * PDFs, images, OCR data, or `.scribe` save files.
 */
export interface SortedInputFiles {
  pdfFiles?: ScribeInputFile[];
  imageFiles?: ScribeInputFile[];
  ocrFiles?: ScribeInputFile[];
  scribeFiles?: ScribeInputFile[];
}

// ---------------------------------------------------------------------------
// Export / output format
// ---------------------------------------------------------------------------

/**
 * All export / input format strings accepted by `exportData` and `download`.
 *
 * - `'pdf'`   – PDF with OCR text overlay
 * - `'hocr'`  – hOCR XML
 * - `'alto'`  – ALTO XML
 * - `'docx'`  – Microsoft Word
 * - `'xlsx'`  – Microsoft Excel
 * - `'txt'` / `'text'` – plain text (aliases)
 * - `'md'`    – Markdown
 * - `'html'`  – HTML
 * - `'scribe'` – scribe.js native save format (gzip-compressed JSON by default)
 */
export type ScribeFormat =
  | 'pdf'
  | 'hocr'
  | 'alto'
  | 'docx'
  | 'xlsx'
  | 'txt'
  | 'text'
  | 'md'
  | 'html'
  | 'scribe';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Options for selecting which pages to include in an export. */
export interface PageRangeOptions {
  /** First page to include (0-based). Default `0`. */
  minPage?: number;
  /**
   * Last page to include (inclusive). `-1` means "through the last page".
   * Default `-1`.
   */
  maxPage?: number;
  /**
   * Explicit list of 0-based page indices to export.
   * When provided, overrides `minPage` / `maxPage`.
   */
  pageArr?: number[] | null;
}

/** Parameters accepted by `init`. */
export interface InitParams {
  /** Pre-load the PDF renderer (MuPDF). Default `false`. */
  pdf?: boolean;
  /** Pre-load the OCR engine (Tesseract). Default `false`. */
  ocr?: boolean;
  /** Pre-load built-in fonts. Default `false`. */
  font?: boolean;
  /** Options forwarded to `gs.initTesseract`. */
  ocrParams?: Record<string, unknown>;
}

/** Options accepted by `extractText`. */
export interface ExtractTextOptions {
  /**
   * Skip recognition when the input is a text-native PDF
   * (i.e. a PDF whose text layer was created by the PDF author, not OCR).
   * Default `true`.
   */
  skipRecPDFTextNative?: boolean;
  /**
   * Skip recognition when the input is an image-based PDF that already has
   * an invisible OCR text layer. Default `false`.
   */
  skipRecPDFTextOCR?: boolean;
}

/** Options accepted by `recognize`. */
export interface RecognizeOptions {
  /**
   * High-level recognition mode.
   * - `'quality'` (default) – runs Tesseract Legacy for best accuracy.
   * - `'speed'` – runs Tesseract LSTM for faster (but less accurate) results.
   */
  mode?: 'quality' | 'speed';
  /** Language(s) to recognise (BCP-47 / Tesseract language codes). Default `['eng']`. */
  langs?: string[];
  /**
   * Low-level engine selector.
   * - `'combined'` (default) – Legacy + LSTM combined.
   * - `'legacy'` – Tesseract Legacy only.
   * - `'lstm'` – Tesseract LSTM only.
   */
  modeAdv?: 'combined' | 'legacy' | 'lstm';
  /**
   * How existing OCR data should be combined with new results.
   * - `'data'` (default) – use the existing data to pick the best words.
   * - `'conf'` – pick the result with higher confidence.
   * - `'none'` – overwrite existing data.
   */
  combineMode?: 'data' | 'conf' | 'none';
  /** Use the vanilla Tesseract.js model (no scribe-specific patches). Default `false`. */
  vanillaMode?: boolean;
  /** Raw config params forwarded to Tesseract.js (e.g. `{ tessedit_char_whitelist: '0123456789' }`). */
  config?: Record<string, string>;
  /** Custom recognition model. See {@link RecognitionModel}. */
  model?: RecognitionModel;
  /** Options passed to the custom model's `recognizeImage` method. */
  modelOptions?: Record<string, unknown>;
  /**
   * AbortSignal for cancelling a custom-model recognition run.
   * When fired, scribe.js drains in-flight requests, preserves completed
   * pages, and throws an `AbortError`.
   * Only effective when `model` is provided.
   */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Runtime options  (`scribe.opt`)
// ---------------------------------------------------------------------------

/**
 * Runtime options that control recognition and export behaviour.
 * All properties are static and mutable; changes take effect immediately.
 */
export interface RuntimeOptions {
  /** Combine ligature characters in text output. Default `false`. */
  ligatures: boolean;
  /** Apply font kerning adjustments. Default `true`. */
  kerning: boolean;
  /** Omit native PDF text from OCR results. Default `false`. */
  omitNativeText: boolean;
  /** Extract text directly (without OCR). Default `false`. */
  extractText: boolean;
  /** Upscale images prior to recognition (image input only). Default `false`. */
  enableUpscale: boolean;
  /** Ignore punctuation when comparing / evaluating OCR results. Default `false`. */
  ignorePunct: boolean;
  /** Ignore capitalisation when comparing / evaluating OCR results. Default `false`. */
  ignoreCap: boolean;
  /** Ignore extra words when comparing / evaluating OCR results. Default `false`. */
  ignoreExtra: boolean;
  /** Confidence threshold above which a word is considered "high confidence". Default `85`. */
  confThreshHigh: number;
  /** Confidence threshold above which a word is considered "medium confidence". Default `75`. */
  confThreshMed: number;
  /** Add the OCR text layer on top of the source images in PDF exports. Default `true`. */
  addOverlay: boolean;
  /** Standardise all exported pages to the same size. Default `false`. */
  standardizePageSize: boolean;
  /** Produce a human-readable (non-compressed) PDF. Default `false`. */
  humanReadablePDF: boolean;
  /** Return the intermediate (un-merged) PDF during PDF export. Default `false`. */
  intermediatePDF: boolean;
  /** Re-flow text to remove hyphenation and join split lines in text exports. Default `true`. */
  reflow: boolean;
  /** Prepend line numbers to text exports. Default `false`. */
  lineNumbers: boolean;
  /** Remove page margin content from text exports. Default `false`. */
  removeMargins: boolean;
  /** Include rasterised page images in HTML exports. Default `false`. */
  includeImages: boolean;
  /** Insert page breaks between pages in text/markdown exports. Default `true`. */
  pageBreaks: boolean;
  /**
   * Display mode used when rendering the OCR overlay in PDF exports.
   * - `'proof'` (default) – visible coloured text on image background.
   * - `'ebook'` – text only, no background image.
   * - `'eval'` – evaluation / debugging overlay.
   * - `'invis'` – invisible text layer (standard searchable PDF).
   * - `'annot'` – annotation mode.
   */
  displayMode: 'proof' | 'ebook' | 'eval' | 'invis' | 'annot';
  /**
   * Colour mode for rendered images.
   * - `'color'` (default) – full colour.
   * - `'gray'` – greyscale.
   * - `'binary'` – black and white.
   */
  colorMode: 'color' | 'gray' | 'binary';
  /** Opacity of the OCR overlay in proof mode (0 – 100). Default `80`. */
  overlayOpacity: number;
  /** Automatically rotate pages to upright orientation. Default `true`. */
  autoRotate: boolean;
  /** Enable layout analysis for reading-order / table detection. Default `false`. */
  enableLayout: boolean;
  /** Include a filename column in XLSX exports. Default `true`. */
  xlsxFilenameColumn: boolean;
  /** Include a page-number column in XLSX exports. Default `true`. */
  xlsxPageNumberColumn: boolean;
  /** Save intermediate debug images during recognition. Default `false`. */
  saveDebugImages: boolean;
  /**
   * Retain the raw OCR engine output in `data.ocrRaw`.
   * Increases memory usage significantly; for debugging only. Default `false`.
   */
  keepRawData: boolean;
  /** Compress `.scribe` save files with gzip. Default `true`. */
  compressScribe: boolean;
  /**
   * Include derived text fields (`text` at line / paragraph / page level) in
   * `.scribe` exports. Default `false`.
   */
  includeExtraTextScribe: boolean;
  /**
   * How to use PDF text extracted from input PDFs.
   * `native` = visible text rendered by the PDF viewer;
   * `ocr` = invisible OCR text layer embedded in the PDF.
   * `main: true` → use as primary data; `supp: true` → use to correct errors.
   */
  usePDFText: {
    native: { main: boolean; supp: boolean };
    ocr: { main: boolean; supp: boolean };
  };
  /**
   * Always convert and store PDF text even when not needed per `usePDFText`.
   * Default `false`.
   */
  keepPDFTextAlways: boolean;
  /**
   * Number of recognition workers.
   * `null` (default) → auto (up to 6 in browser, 8 in Node.js).
   */
  workerN: number | null;
  /** How to split lines when exporting to DOCX. Default `'width'`. */
  docxLineSplitMode: 'width' | 'sentence';
  /** Extract font info from source PDFs. Default `false`. */
  extractPDFFonts: boolean;
  /** Calculate supplemental font information. Default `false`. */
  calcSuppFontInfo: boolean;
  /** Generate debug visualisations during OCR. Default `false`. */
  debugVis: boolean;
  /** Print per-page recognition time to the console. Default `false`. */
  printRecognitionTime: boolean;
  /** Called for each progress event. Default is a no-op. */
  progressHandler: (msg: ProgressMessage) => void;
  /** Called when a non-fatal warning occurs. Default logs to `console.warn`. */
  warningHandler: (msg: string) => void;
  /** Called when a non-recoverable error occurs. Default logs to `console.error`. */
  errorHandler: (msg: string) => void;
}

// ---------------------------------------------------------------------------
// Input data state  (`scribe.inputData`)
// ---------------------------------------------------------------------------

/** Read-only snapshot of what has been imported into the current session. */
export interface InputDataState {
  /** Per-page flag: `true` when OCR data exists for that page index. */
  xmlMode: boolean[];
  /** `true` when a PDF has been imported. */
  pdfMode: boolean;
  /**
   * Type of the imported PDF, when `pdfMode` is `true`.
   * - `'text'` – text-native PDF (embedded text layer created by the author).
   * - `'ocr'`  – image-based PDF with an OCR invisible text layer.
   * - `'image'` – image-only PDF (no text layer).
   */
  pdfType: 'text' | 'ocr' | 'image' | null;
  /** `true` when image files (.png / .jpg) have been imported. */
  imageMode: boolean;
  /** `true` when a previous Scribe OCR session was restored from a `.scribe` file. */
  resumeMode: boolean;
  /** `true` when ground-truth data has been imported for evaluation. */
  evalMode: boolean;
  /** Names of all imported files. */
  inputFileNames: string[];
  /** Default base filename for exports, derived from the first imported file. */
  defaultDownloadFileName: string;
  /** Total number of pages in the current document. */
  pageCount: number;
}

// ---------------------------------------------------------------------------
// Save-data structure (used with the 'scribe' format)
// ---------------------------------------------------------------------------

/** The JSON-serialisable shape of a `.scribe` save file. */
export interface ScribeSaveData {
  ocr: OcrPage[];
  fontState: FontState;
  layoutRegions: LayoutPage[];
  layoutDataTables: LayoutDataTablePage[];
  annotations: AnnotationHighlight[][];
}

/**
 * Font optimisation state persisted in `.scribe` save files.
 * @see ScribeSaveData
 */
export interface FontState {
  enableOpt: boolean;
  forceOpt: boolean;
  enableCleanToNimbusMono: boolean;
  defaultFontName: string;
  serifDefaultName: string;
  sansDefaultName: string;
  glyphSet: null | 'latin' | 'all';
  charMetrics: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Evaluation metrics
// ---------------------------------------------------------------------------

/** Word-level accuracy metrics produced by `evalOCRPage` / `compareOCR`. */
export interface EvalMetrics {
  total: number;
  correct: number;
  incorrect: number;
  missed: number;
  extra: number;
  correctLowConf: number;
  incorrectHighConf: number;
}

/** Result returned by `compareOCR`. */
export interface CompareOCRResult {
  /** Combined OCR pages (best words selected from A and B). */
  ocr: OcrPage[];
  /** Per-page accuracy metrics (may contain `null` entries). */
  metrics: (EvalMetrics | null)[];
  /** Per-page debug imagery. */
  debug: unknown[][];
}

// ---------------------------------------------------------------------------
// Utils column bounds
// ---------------------------------------------------------------------------

/** A column boundary range (output of `utils.calcColumnBounds`). */
export interface ColumnBound {
  left: number;
  right: number;
}

// ---------------------------------------------------------------------------
// Word metrics
// ---------------------------------------------------------------------------

/** Per-character advance widths and other typographic metrics for a word. */
export interface WordMetrics {
  /** Advance width for each character in the word (pixels). */
  advanceArr: number[];
  /** Total advance width of the word (pixels). */
  totalAdvance: number;
  /** Ascender height for the word's font/size combination (pixels). */
  ascHeight: number;
  /** x-height for the word's font/size combination (pixels). */
  xHeight: number;
  /** Descender depth for the word's font/size combination (pixels). */
  descHeight: number;
}

// ---------------------------------------------------------------------------
// `data` namespace
// ---------------------------------------------------------------------------

/**
 * Static namespace exposing the document's in-memory data stores.
 * All properties reference the live containers; mutations are reflected
 * immediately throughout the library.
 */
export interface DataNamespace {
  /** Debug imagery collected during recognition. */
  debug: Record<string, unknown>;
  /** Active font container (built-in + uploaded fonts). */
  font: Record<string, unknown>;
  /** Image cache (native + binarised rendered images). */
  image: Record<string, unknown>;
  /** Per-page highlight annotations. */
  annotations: { pages: AnnotationHighlight[][] } & Record<string, unknown>;
  /** Per-page layout regions (reading-order / exclusion boxes). */
  layoutRegions: { pages: LayoutPage[] } & Record<string, unknown>;
  /** Per-page detected data tables. */
  layoutDataTables: { pages: LayoutDataTablePage[] } & Record<string, unknown>;
  /**
   * All OCR result sets keyed by engine name (e.g. `'Tesseract Legacy'`).
   * `ocr.active` always points to the currently displayed result set.
   */
  ocr: { active: OcrPage[] } & Record<string, OcrPage[]>;
  /**
   * Raw engine output (strings), keyed by engine name.
   * Only populated when `opt.keepRawData` is `true`.
   */
  ocrRaw: { active: string[] } & Record<string, string[]>;
  /** Per-page page metrics array. */
  pageMetrics: PageMetrics[];
  /**
   * Per-page visualisation instructions generated when `opt.debugVis` is `true`.
   */
  vis: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// `utils` namespace
// ---------------------------------------------------------------------------

/**
 * Static utility namespace exposed on the default export.
 * All members are pure functions (or thin wrappers) that do not modify
 * global state unless otherwise documented.
 */
export interface UtilsNamespace {
  // --- OCR utilities -------------------------------------------------------

  /**
   * Assign paragraph boundaries for the given page using heuristics.
   * Mutates `page.pars`.
   * @param page  The page to analyse.
   * @param angle Page rotation angle in degrees (used for coordinate transforms).
   */
  assignParagraphs(page: OcrPage, angle: number): void;

  /**
   * Calculate confidence statistics for an array of pages.
   * @returns `{ total, highConf }` word counts.
   */
  calcConf(pages: OcrPage[]): { total: number; highConf: number };

  /**
   * Aggregate document-level evaluation statistics from per-page metrics.
   */
  calcEvalStatsDoc(metricsArr: (EvalMetrics | null)[]): EvalMetrics;

  /**
   * Merge two adjacent words into a single word.
   * Both words must belong to the same line.
   */
  mergeOcrWords(wordA: OcrWord, wordB: OcrWord): OcrWord;

  /**
   * Return `true` if `wordA` and `wordB` are horizontally adjacent
   * (i.e. their bounding boxes touch or are within a small gap).
   */
  checkOcrWordsAdjacent(wordA: OcrWord, wordB: OcrWord): boolean;

  /**
   * Split a word at `splitIndex` (character position).
   * Returns two new words derived from the original.
   */
  splitOcrWord(word: OcrWord, splitIndex: number): [OcrWord, OcrWord];

  /**
   * `ocr` helper namespace with low-level `OcrPage` / `OcrLine` / `OcrWord`
   * operations (clone, rotate, bounding-box update, etc.).
   */
  ocr: Record<string, (...args: unknown[]) => unknown>;

  // --- Layout / table utilities --------------------------------------------

  /**
   * Given an array of word bounding boxes, determine the horizontal column
   * boundaries that separate them into columns.
   */
  calcColumnBounds(boundingBoxes: Bbox[]): ColumnBound[];

  /**
   * Calculate the bounding box that encloses all columns in a table.
   */
  calcTableBbox(table: LayoutDataTable): Bbox;

  /**
   * Extract the cell contents of a single table from a page, organised as a
   * 3-D array `[row][column][word]`.
   */
  extractSingleTableContent(
    page: OcrPage,
    boxes: LayoutBoxBase[],
    rowBounds?: number[] | null
  ): OcrWord[][][];

  /**
   * Auto-detect data tables in a page.
   * Returns a `LayoutDataTablePage` with the detected tables.
   */
  detectTablesInPage(page: OcrPage): LayoutDataTablePage;

  /**
   * Create a `LayoutDataTable` that covers the given bounding box.
   */
  makeTableFromBbox(
    bbox: Bbox,
    page: LayoutDataTablePage
  ): LayoutDataTable;

  // --- Font utilities ------------------------------------------------------

  /**
   * Calculate typographic metrics (advance widths, heights) for a word
   * using its current style and the active font container.
   */
  calcWordMetrics(word: OcrWord): WordMetrics;

  // --- Export helpers ------------------------------------------------------

  /**
   * Low-level PDF writer. Returns a PDF string (before MuPDF post-processing).
   * Most consumers should use `exportData('pdf')` instead.
   */
  writePdf(options: Record<string, unknown>): Promise<string>;

  /**
   * Serialise OCR data to an hOCR string.
   */
  writeHocr(options: { ocrData: OcrPage[]; pageArr: number[] }): string;

  /**
   * Serialise OCR data to plain text.
   */
  writeText(options: {
    ocrCurrent: OcrPage[];
    pageArr: number[];
    reflowText?: boolean;
    lineNumbers?: boolean;
  }): string;

  /**
   * Serialise OCR data to an XLSX `ArrayBuffer`.
   */
  writeXlsx(options: {
    ocrPageArr: OcrPage[];
    layoutPageArr: LayoutDataTablePage[];
    pageArr: number[];
  }): Promise<ArrayBuffer>;

  /**
   * Serialise tabular row data to an XLSX `ArrayBuffer`.
   * Each element of `rows` is an array of cell strings for one row.
   */
  writeXlsxFromRows(rows: string[][]): Promise<ArrayBuffer>;

  // --- Miscellaneous utilities ---------------------------------------------

  /**
   * Returns the proportion of `boxA`'s area that is covered by `boxB`.
   * Result is in the range 0 – 1.
   */
  calcBoxOverlap(boxA: Bbox, boxB: Bbox): number;

  /**
   * Convert tabular data to a CSV string.
   */
  convertToCSV(rows: string[][]): string;

  /**
   * Replace Unicode "smart quotes" with standard ASCII equivalents.
   */
  replaceSmartQuotes(text: string): string;

  /**
   * Generate a random alphanumeric string of the specified length.
   */
  getRandomAlphanum(length: number): string;

  /**
   * Count the number of non-overlapping occurrences of `sub` in `text`.
   */
  countSubstringOccurrences(text: string, sub: string): number;

  /**
   * Coordinate transform helpers (rotate / translate bounding boxes).
   */
  coords: Record<string, (...args: unknown[]) => unknown>;

  /**
   * Decode a base-64 PNG/JPEG data-URL string to a `Blob`.
   */
  imageStrToBlob(dataUrl: string): Blob;

  /**
   * Generate a debug CSV string summarising per-word metrics.
   */
  writeDebugCsv(pages: OcrPage[]): string;

  /**
   * Draw comparison debug images onto a canvas.
   * Returns the populated `OffscreenCanvas`.
   * @param args Pass `{ compDebugArrArr, context: 'browser', canvas? }` in the
   *   browser, or `{ compDebugArrArr, context: 'node' }` in Node.js.
   */
  drawDebugImages(args: Record<string, unknown>): Promise<OffscreenCanvas>;

  /**
   * Dump all accumulated debug images to the directory `dir` as PNG files.
   * Node.js only.
   */
  dumpDebugImages(dir: string): Promise<void>;

  /**
   * Export every OCR result set to separate `.hocr` files in `dir`.
   * Node.js only.
   */
  dumpHOCR(dir: string): Promise<void>;

  /**
   * Render a page to an off-screen canvas without modifying any global state.
   */
  renderPageStatic(options: Record<string, unknown>): Promise<unknown>;

  /**
   * Save content as a file download (browser) or write it to a path (Node.js).
   */
  saveAs(
    content: string | ArrayBuffer | Blob | Uint8Array,
    fileName: string
  ): Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Top-level ScribeAPI
// ---------------------------------------------------------------------------

/** The full public API surface of scribe.js, as exposed by its default export. */
export interface ScribeAPI {
  // --- Lifecycle -----------------------------------------------------------

  /**
   * Initialise the program and optionally pre-load resources.
   *
   * The PDF renderer and OCR engine load automatically when first needed, so
   * calling `init` is optional. Use it to pre-load resources and reduce
   * latency on the first operation.
   *
   * @example
   * await scribe.init({ ocr: true, font: true });
   */
  init(params?: InitParams): Promise<void>;

  /**
   * Clear all document-specific data without releasing worker resources.
   * Call between processing separate documents in a long-running session.
   */
  clear(): Promise<void>;

  /**
   * Release all workers and cached resources.
   * After calling `terminate`, `init` must be called again before processing
   * another document.
   */
  terminate(): Promise<void>;

  // --- Import --------------------------------------------------------------

  /**
   * Import files for processing.
   *
   * Accepts:
   * - A flat array of `File` objects (browser) or file path strings (Node.js).
   * - A `FileList` (browser `<input type="file">` element).
   * - A {@link SortedInputFiles} object for explicit control over file types.
   *
   * @example
   * // Browser
   * await scribe.importFiles(fileInputElement.files);
   *
   * // Node.js
   * await scribe.importFiles(['./document.pdf']);
   *
   * // Explicit
   * await scribe.importFiles({ pdfFiles: ['./doc.pdf'], ocrFiles: ['./doc.hocr'] });
   */
  importFiles(
    files: ScribeInputFile[] | FileList | SortedInputFiles
  ): Promise<void>;

  /**
   * Import supplemental files that are overlaid on top of the primary data
   * already loaded via `importFiles`.
   *
   * Accepts the same range of inputs as `importFiles`.
   */
  importFilesSupp(
    files: ScribeInputFile[] | FileList | SortedInputFiles
  ): Promise<void>;

  // --- Recognition ---------------------------------------------------------

  /**
   * Run OCR on all imported pages.
   *
   * Files must already be imported via `importFiles` before calling this
   * function. After recognition, export results with `exportData`.
   *
   * @example
   * await scribe.recognize({ langs: ['eng', 'fra'], mode: 'quality' });
   */
  recognize(options?: RecognizeOptions): Promise<void>;

  /**
   * Low-level single-page recognition entry point.
   * Advanced use only – most callers should use `recognize` instead.
   *
   * @param n          0-based page index.
   * @param legacy     Use Tesseract Legacy engine.
   * @param lstm       Use Tesseract LSTM engine.
   * @param areaMode   Recognise a sub-region only (disables image saving).
   * @param tessOptions Additional Tesseract config key/value pairs.
   * @param debugVis   Generate visualisation instructions for debugging.
   */
  recognizePageImp(
    n: number,
    legacy: boolean,
    lstm: boolean,
    areaMode: boolean,
    tessOptions?: Record<string, string>,
    debugVis?: boolean
  ): Promise<unknown[]>;

  // --- Export --------------------------------------------------------------

  /**
   * Export the active OCR data to the specified format.
   *
   * Returns a `string` for text-based formats (`'txt'`, `'text'`, `'md'`,
   * `'hocr'`, `'alto'`, `'html'`) and an `ArrayBuffer` for binary formats
   * (`'pdf'`, `'docx'`, `'xlsx'`, `'scribe'` with compression).
   *
   * @example
   * const text = await scribe.exportData('txt');
   * const pdf  = await scribe.exportData('pdf', { minPage: 0, maxPage: 2 });
   */
  exportData(format?: ScribeFormat, options?: PageRangeOptions): Promise<string | ArrayBuffer>;

  /**
   * Run `exportData` and immediately save / download the result.
   *
   * In the browser, triggers a file download. In Node.js, writes to the
   * file system using the path derived from `fileName`.
   *
   * @example
   * await scribe.download('pdf', 'output.pdf');
   */
  download(
    format: ScribeFormat,
    fileName: string,
    options?: PageRangeOptions
  ): Promise<void>;

  // --- High-level helpers --------------------------------------------------

  /**
   * All-in-one pipeline: import → (optionally recognise) → export.
   *
   * By default, text-native PDFs are exported without OCR. Set
   * `skipRecPDFTextNative: false` to force recognition on all inputs.
   *
   * @returns The exported content as a `string` (for text formats) or
   *   `ArrayBuffer` (for binary formats).
   *
   * @example
   * const text = await scribe.extractText(['./scan.pdf'], ['eng'], 'txt');
   */
  extractText(
    files: ScribeInputFile[] | FileList | SortedInputFiles,
    langs?: string[],
    outputFormat?: ScribeFormat,
    options?: ExtractTextOptions
  ): Promise<string | ArrayBuffer>;

  /**
   * Extract the text layer embedded in a PDF without running OCR.
   * Returns the raw extracted text or `null` if no text layer exists.
   */
  extractInternalPDFText(
    file: ScribeInputFile,
    options?: Record<string, unknown>
  ): Promise<string | null>;

  /**
   * Extract text from detected tables, returning one string per table cell.
   * Tables must already be detected (via `opt.enableLayout = true`) before
   * calling this function.
   */
  extractTextFromTables(
    page?: number
  ): Record<string, string[][]> | Record<string, string[][]>[];

  /**
   * Detect and create table structures from the current OCR text layout.
   * Requires OCR data to be loaded.
   */
  createTablesFromText(page?: number): void;

  // --- OCR manipulation ----------------------------------------------------

  /**
   * Merge two pages of OCR data, combining overlapping lines.
   *
   * @param pageA         New page whose lines will be merged into `pageB`.
   * @param pageB         Existing page that receives the merged content.
   * @param pageMetrics   Page metrics used for coordinate transforms.
   * @param replaceFontSize Replace font-size stats in new lines with those from `pageB`.
   * @param editWordIds   Append random suffix to `pageB` word IDs to avoid collisions.
   */
  combineOCRPage(
    pageA: OcrPage,
    pageB: OcrPage,
    pageMetrics: PageMetrics,
    replaceFontSize?: boolean,
    editWordIds?: boolean
  ): void;

  /**
   * Compare two OCR result sets for accuracy and optionally combine them.
   *
   * @param ocrA             First OCR result set (e.g. Tesseract Legacy).
   * @param ocrB             Second OCR result set (e.g. Tesseract LSTM).
   * @param options          Comparison options.
   * @param progressCallback Called after each page comparison.
   */
  compareOCR(
    ocrA: OcrPage[],
    ocrB: OcrPage[],
    options?: Record<string, unknown>,
    progressCallback?: (() => void) | null
  ): Promise<CompareOCRResult>;

  /**
   * Convert a raw OCR string for page `n` into the internal `OcrPage` model
   * and store it under `engineName`.
   *
   * @param ocrRaw     Raw OCR data string.
   * @param n          0-based page index.
   * @param mainData   Whether this is the primary data source for page metrics.
   * @param format     Format of `ocrRaw`.
   * @param engineName Human-readable engine name (stored as a key in `data.ocr`).
   * @param scribeMode Whether the data originates from a scribe.js hOCR export.
   */
  convertOCRPage(
    ocrRaw: string,
    n: number,
    mainData: boolean,
    format: TextSource,
    engineName: string,
    scribeMode?: boolean
  ): Promise<void>;

  /**
   * Evaluate OCR accuracy for a single page or line against ground-truth data.
   *
   * @param params.page  The `OcrPage` or `OcrLine` to evaluate.
   * @param params.func  Optional post-processing function applied to each word pair.
   * @param params.view  Draw results on internal debug canvases.
   */
  evalOCRPage(params: {
    page: OcrPage | OcrLine;
    func?: ((wordA: OcrWord, wordB: OcrWord) => void) | null;
    view?: boolean;
  }): Promise<EvalMetrics>;

  // --- Font optimisation ---------------------------------------------------

  /**
   * Enable or disable font optimisation based on the current character metrics.
   * Font optimisation adjusts the built-in fonts to better match the source
   * document's typography.
   *
   * @param enable `true` to enable, `false` to disable.
   */
  enableFontOpt(enable: boolean): Promise<void>;

  // --- Annotations ---------------------------------------------------------

  /**
   * Add highlight annotations to the active document.
   *
   * @returns Summary of how many highlights were successfully applied.
   *
   * @example
   * scribe.addHighlights([
   *   { page: 0, startLine: 2, endLine: 4, color: '#ffff00', opacity: 0.4 },
   * ]);
   */
  addHighlights(highlights: HighlightSpec[]): AddHighlightsResult;

  /**
   * Remove all highlight annotations from the active document, or only those
   * belonging to a specific group.
   *
   * @param groupId When provided, only removes highlights with this group ID.
   */
  clearHighlights(groupId?: string): void;

  // --- Data / option namespaces --------------------------------------------

  /** Live in-memory data stores for the current document. */
  data: DataNamespace;

  /** Runtime options that control recognition and export behaviour. */
  opt: RuntimeOptions;

  /** Current import state (read-only snapshot). */
  inputData: InputDataState;

  /** Layout object namespace with page-level layout helpers. */
  layout: Record<string, unknown>;

  /** Utility functions. */
  utils: UtilsNamespace;
}

// ---------------------------------------------------------------------------
// Default export (supports ESM `import scribe from 'scribe.js-ocr'`)
// ---------------------------------------------------------------------------

declare const scribe: ScribeAPI;
export default scribe;
