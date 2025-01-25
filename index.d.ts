import log from 'loglevel';

declare namespace TransferSyntax {
  const ImplicitVRLittleEndian: string;
  const ExplicitVRLittleEndian: string;
  const ExplicitVRBigEndian: string;
  const RleLossless: string;
  const JpegBaselineProcess1: string;
  const JpegLosslessProcess14V1: string;
  const JpegLsLossless: string;
  const JpegLsLossy: string;
  const Jpeg2000Lossless: string;
  const Jpeg2000Lossy: string;
  const HtJpeg2000Lossless: string;
  const HtJpeg2000LosslessRpcl: string;
  const HtJpeg2000Lossy: string;
}

declare namespace PhotometricInterpretation {
  const Monochrome1: string;
  const Monochrome2: string;
  const PaletteColor: string;
  const Rgb: string;
  const YbrFull: string;
  const YbrFull422: string;
  const YbrPartial422: string;
  const YbrPartial420: string;
  const YbrIct: string;
  const YbrRct: string;
  const Cmyk: string;
  const Argb: string;
  const Hsv: string;
}

declare namespace PlanarConfiguration {
  const Interleaved: number;
  const Planar: number;
}

declare namespace PixelRepresentation {
  const Unsigned: number;
  const Signed: number;
}

declare namespace JpegSampleFactor {
  const Sf444: number;
  const Sf422: number;
  const Unknown: number;
}

declare namespace Jpeg2000ProgressionOrder {
  const Lrcp: number;
  const Rlcp: number;
  const Rpcl: number;
  const Pcrl: number;
  const Cprl: number;
}

declare class Context {
  /**
   * Creates an instance of Context.
   */
  constructor(attrs?: {
    width?: number;
    height?: number;
    bitsAllocated?: number;
    bitsStored?: number;
    samplesPerPixel?: number;
    pixelRepresentation?: number;
    planarConfiguration?: number;
    photometricInterpretation?: string;
    encodedBuffer?: Uint8Array;
    decodedBuffer?: Uint8Array;
  });

  /**
   * Gets the frame width.
   */
  getWidth(): number | undefined;

  /**
   * Sets the frame width.
   */
  setWidth(width: number): void;

  /**
   * Gets the frame height.
   */
  getHeight(): number | undefined;

  /**
   * Sets the frame height.
   */
  setHeight(height: number): void;

  /**
   * Gets the bits stored.
   */
  getBitsStored(): number | undefined;

  /**
   * Sets the bits stored.
   */
  setBitsStored(bitsStored: number): void;

  /**
   * Gets the bits allocated.
   */
  getBitsAllocated(): number | undefined;

  /**
   * Sets the bits allocated.
   */
  setBitsAllocated(bitsAllocated: number): void;

  /**
   * Gets the samples per pixel.
   */
  getSamplesPerPixel(): number | undefined;

  /**
   * Sets the samples per pixel.
   */
  setSamplesPerPixel(samplesPerPixel: number): void;

  /**
   * Gets the pixel representation.
   */
  getPixelRepresentation(): number | undefined;

  /**
   * Sets the pixel representation.
   */
  setPixelRepresentation(pixelRepresentation: number): void;

  /**
   * Gets the planar configuration.
   */
  getPlanarConfiguration(): number | undefined;

  /**
   * Sets the planar configuration.
   */
  setPlanarConfiguration(planarConfiguration: number): void;

  /**
   * Gets the photometric interpretation.
   */
  getPhotometricInterpretation(): string | undefined;

  /**
   * Sets the photometric interpretation.
   */
  setPhotometricInterpretation(photometricInterpretation: string): void;

  /**
   * Gets the encoded buffer.
   */
  getEncodedBuffer(): Uint8Array | undefined;

  /**
   * Sets the encoded buffer.
   */
  setEncodedBuffer(encodedBuffer: Uint8Array): void;

  /**
   * Gets the decoded buffer.
   */
  getDecodedBuffer(): Uint8Array | undefined;

  /**
   * Sets the decoded buffer.
   */
  setDecodedBuffer(decodedBuffer: Uint8Array): void;
}

declare class NativeCodecs {
  /**
   * Initializes codecs.
   */
  static initializeAsync(opts?: {
    webAssemblyModulePathOrUrl?: string;
    logCodecsInfo?: boolean;
    logCodecsTrace?: boolean;
  }): Promise<void>;

  /**
   * Decodes RLE frame.
   */
  static decodeRle(context: Context, parameters?: Record<string, unknown>): Context;

  /**
   * Encodes RLE frame.
   */
  static encodeRle(context: Context, parameters?: Record<string, unknown>): Context;

  /**
   * Decodes JPEG frame (lossless or lossy).
   */
  static decodeJpeg(context: Context, parameters?: { convertColorspaceToRgb?: boolean }): Context;

  /**
   * Encodes JPEG frame (lossless or lossy).
   */
  static encodeJpeg(
    context: Context,
    parameters?: {
      lossy?: boolean;
      quality?: number;
      smoothingFactor?: number;
      sampleFactor?: number;
      predictor?: number;
      pointTransform?: number;
    }
  ): Context;

  /**
   * Decodes JPEG-LS frame (lossless or lossy).
   */
  static decodeJpegLs(context: Context, parameters?: Record<string, unknown>): Context;

  /**
   * Encodes JPEG-LS frame (lossless or lossy).
   */
  static encodeJpegLs(
    context: Context,
    parameters?: { lossy?: boolean; allowedLossyError?: number }
  ): Context;

  /**
   * Decodes JPEG2000 frame (lossless or lossy).
   */
  static decodeJpeg2000(context: Context, parameters?: Record<string, unknown>): Context;

  /**
   * Encodes JPEG2000 frame (lossless or lossy).
   */
  static encodeJpeg2000(
    context: Context,
    parameters?: { lossy?: boolean; progressionOrder?: number; rate?: number }
  ): Context;
}

declare class Transcoder {
  /**
   * Creates an instance of Transcoder.
   */
  constructor(
    elementsOrBuffer?: Record<string, unknown> | ArrayBuffer,
    transferSyntaxUid?: string,
    readOptions?: Record<string, unknown>
  );

  /**
   * Transcodes the provided DICOM elements to a new transfer syntax UID.
   */
  transcode(newTransferSyntaxUid?: string, parameters?: Record<string, unknown>): void;

  /**
   * Gets DICOM transfer syntax UID.
   */
  getTransferSyntaxUid(): string;

  /**
   * Gets all elements.
   */
  getElements(): Record<string, unknown>;

  /**
   * Gets elements encoded in a DICOM dataset buffer.
   */
  getDicomDataset(
    writeOptions?: Record<string, unknown>,
    nameMap?: Record<string, unknown>
  ): ArrayBuffer;

  /**
   * Gets elements encoded in a DICOM part10 buffer.
   */
  getDicomPart10(
    writeOptions?: Record<string, unknown>,
    nameMap?: Record<string, unknown>
  ): ArrayBuffer;
}

declare class Codec {
  /**
   * Encodes DICOM image for this transfer syntax.
   */
  encode(
    elements: Record<string, unknown>,
    syntax: string,
    parameters?: Record<string, unknown>
  ): Record<string, unknown>;

  /**
   * Decodes DICOM image for this transfer syntax.
   */
  decode(
    elements: Record<string, unknown>,
    syntax: string,
    parameters?: Record<string, unknown>
  ): Record<string, unknown>;
}

declare class ImplicitVRLittleEndianCodec extends Codec {}
declare class ExplicitVRLittleEndianCodec extends Codec {}
declare class ExplicitVRBigEndianCodec extends Codec {}
declare class RleLosslessCodec extends Codec {}
declare class JpegBaselineProcess1Codec extends Codec {}
declare class JpegLosslessProcess14V1Codec extends Codec {}
declare class JpegLsLosslessCodec extends Codec {}
declare class JpegLsLossyCodec extends Codec {}
declare class Jpeg2000LosslessCodec extends Codec {}
declare class Jpeg2000LossyCodec extends Codec {}
declare class HtJpeg2000LosslessCodec extends Codec {}
declare class HtJpeg2000LosslessRpclCodec extends Codec {}
declare class HtJpeg2000LossyCodec extends Codec {}

/**
 * Version.
 */
declare const version: string;

export namespace constants {
  export { TransferSyntax };
  export { PhotometricInterpretation };
  export { PlanarConfiguration };
  export { PixelRepresentation };
  export { JpegSampleFactor };
  export { Jpeg2000ProgressionOrder };
}

export namespace codecs {
  export { Codec };
  export { ImplicitVRLittleEndianCodec };
  export { ExplicitVRLittleEndianCodec };
  export { ExplicitVRBigEndianCodec };
  export { RleLosslessCodec };
  export { JpegBaselineProcess1Codec };
  export { JpegLosslessProcess14V1Codec };
  export { JpegLsLosslessCodec };
  export { JpegLsLossyCodec };
  export { Jpeg2000LosslessCodec };
  export { Jpeg2000LossyCodec };
  export { HtJpeg2000LosslessCodec };
  export { HtJpeg2000LosslessRpclCodec };
  export { HtJpeg2000LossyCodec };
}

export { Context, log, NativeCodecs, Transcoder, version };
