//#region TransferSyntax
/**
 * Transfer syntaxes.
 * @constant {Object}
 */
const TransferSyntax = {
  ImplicitVRLittleEndian: '1.2.840.10008.1.2',
  ExplicitVRLittleEndian: '1.2.840.10008.1.2.1',
  ExplicitVRBigEndian: '1.2.840.10008.1.2.2',
  RleLossless: '1.2.840.10008.1.2.5',
  JpegBaselineProcess1: '1.2.840.10008.1.2.4.50',
  JpegLosslessProcess14V1: '1.2.840.10008.1.2.4.70',
  JpegLsLossless: '1.2.840.10008.1.2.4.80',
  JpegLsLossy: '1.2.840.10008.1.2.4.81',
  Jpeg2000Lossless: '1.2.840.10008.1.2.4.90',
  Jpeg2000Lossy: '1.2.840.10008.1.2.4.91',
  HtJpeg2000Lossless: '1.2.840.10008.1.2.4.201',
  HtJpeg2000LosslessRpcl: '1.2.840.10008.1.2.4.202',
  HtJpeg2000Lossy: '1.2.840.10008.1.2.4.203',
};
Object.freeze(TransferSyntax);
//#endregion

//#region TranscodeMap
/**
 * Transfer syntax UID with lossy, encapsulated and big endian map.
 * @constant {Object}
 */
// prettier-ignore
const TranscodeMap = [
  { syntax: TransferSyntax.ImplicitVRLittleEndian,  lossy: false, encapsulated: false, bigEndian: false }, 
  { syntax: TransferSyntax.ExplicitVRLittleEndian,  lossy: false, encapsulated: false, bigEndian: false }, 
  { syntax: TransferSyntax.ExplicitVRBigEndian,     lossy: false, encapsulated: false, bigEndian: true  },   
  { syntax: TransferSyntax.RleLossless,             lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.JpegBaselineProcess1,    lossy: true,  encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.JpegLosslessProcess14V1, lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.JpegLsLossless,          lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.JpegLsLossy,             lossy: true,  encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.Jpeg2000Lossless,        lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.Jpeg2000Lossy,           lossy: true,  encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.HtJpeg2000Lossless,      lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.HtJpeg2000LosslessRpcl,  lossy: false, encapsulated: true,  bigEndian: false }, 
  { syntax: TransferSyntax.HtJpeg2000Lossy,         lossy: true,  encapsulated: true,  bigEndian: false }, 
];
Object.freeze(TranscodeMap);
//#endregion

//#region PhotometricInterpretation
/**
 * Photometric interpretations.
 * @constant {Object}
 */
const PhotometricInterpretation = {
  Monochrome1: 'MONOCHROME1',
  Monochrome2: 'MONOCHROME2',
  PaletteColor: 'PALETTE COLOR',
  Rgb: 'RGB',
  YbrFull: 'YBR_FULL',
  YbrFull422: 'YBR_FULL_422',
  YbrPartial422: 'YBR_PARTIAL_422',
  YbrPartial420: 'YBR_PARTIAL_420',
  YbrIct: 'YBR_ICT',
  YbrRct: 'YBR_RCT',
  Cmyk: 'CMYK',
  Argb: 'ARGB',
  Hsv: 'HSV',
};
Object.freeze(PhotometricInterpretation);
//#endregion

//#region PlanarConfiguration
/**
 * Planar configuration.
 * @constant {Object}
 */
const PlanarConfiguration = {
  Interleaved: 0,
  Planar: 1,
};
Object.freeze(PlanarConfiguration);
//#endregion

//#region PixelRepresentation
/**
 * Pixel representation.
 * @constant {Object}
 */
const PixelRepresentation = {
  Unsigned: 0,
  Signed: 1,
};
Object.freeze(PixelRepresentation);
//#endregion

//#region Implementation
/**
 * Implementation information.
 * @constant {Object}
 */
const Implementation = {
  ImplementationClassUid: '1.2.826.0.1.3680043.10.854',
  ImplementationVersion: 'DCMJS-CODECS-V1',
};
Object.freeze(Implementation);
//#endregion

//#region StorageClass
/**
 * Storage classes.
 * @constant {Object}
 */
const StorageClass = {
  SecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7',
};
Object.freeze(StorageClass);
//#endregion

//#region ErrNo
/**
 * WASI error codes.
 * @constant {Object}
 */
const ErrNo = {
  Success: 0,
  BadFileDescriptor: 8,
};
Object.freeze(ErrNo);
//#endregion

//#region JpegSampleFactor
/**
 * JPEG sample factor.
 * @constant {Object}
 */
const JpegSampleFactor = {
  Sf444: 0,
  Sf422: 1,
  Unknown: 2,
};
Object.freeze(JpegSampleFactor);
//#endregion

//#region Jpeg2000ProgressionOrder
/**
 * JPEG2000 progression orders.
 * @constant {Object}
 */
const Jpeg2000ProgressionOrder = {
  Lrcp: 0,
  Rlcp: 1,
  Rpcl: 2,
  Pcrl: 3,
  Cprl: 4,
};
Object.freeze(Jpeg2000ProgressionOrder);
//#endregion

//#region Exports
module.exports = {
  ErrNo,
  Implementation,
  Jpeg2000ProgressionOrder,
  JpegSampleFactor,
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  StorageClass,
  TranscodeMap,
  TransferSyntax,
};
//#endregion
