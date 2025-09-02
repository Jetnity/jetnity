// types/html2pdf.d.ts

declare module 'html2pdf.js' {
  export interface Html2PdfImageOptions {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number; // 0..1
  }

  export interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string | null;
    allowTaint?: boolean;
  }

  export interface JsPDFOptions {
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
  }

  export interface PagebreakOptions {
    // siehe Doku des Libs – minimal benötigt:
    mode?: Array<'css' | 'legacy' | 'avoid-all' | 'whiteline' | string> | string;
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  }

  export interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: Html2PdfImageOptions;
    html2canvas?: Html2CanvasOptions;
    jsPDF?: JsPDFOptions;
    pagebreak?: PagebreakOptions;
  }

  export interface Html2PdfInstance {
    from(input: Element | string): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    toPdf(): Html2PdfInstance;
    get<T = unknown>(what: 'pdf' | 'jsPdfObject'): T;
    save(filename?: string): Promise<void>;
    outputPdf(
      type?: 'datauristring' | 'blob' | 'arraybuffer'
    ): Promise<string | Blob | ArrayBuffer>;
  }

  /** Haupteinstieg – Funktionsaufruf liefert eine fluente Instanz */
  function html2pdf(
    input?: Element | string,
    options?: Html2PdfOptions
  ): Html2PdfInstance;

  export default html2pdf;
}
