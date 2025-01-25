const {
  Codec,
  ExplicitVRBigEndianCodec,
  ExplicitVRLittleEndianCodec,
  HtJpeg2000LosslessCodec,
  HtJpeg2000LosslessRpclCodec,
  HtJpeg2000LossyCodec,
  ImplicitVRLittleEndianCodec,
  Jpeg2000LosslessCodec,
  Jpeg2000LossyCodec,
  JpegBaselineProcess1Codec,
  JpegLosslessProcess14V1Codec,
  JpegLsLosslessCodec,
  JpegLsLossyCodec,
  RleLosslessCodec,
} = require('./Codecs');
const {
  Jpeg2000ProgressionOrder,
  JpegSampleFactor,
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  TransferSyntax,
} = require('./Constants');
const NativeCodecs = require('./NativeCodecs');
const Context = require('./Context');
const Transcoder = require('./Transcoder');
const log = require('./log');
const version = require('./version');

//#region codecs
const codecs = {
  Codec,
  ExplicitVRBigEndianCodec,
  ExplicitVRLittleEndianCodec,
  HtJpeg2000LosslessCodec,
  HtJpeg2000LosslessRpclCodec,
  HtJpeg2000LossyCodec,
  ImplicitVRLittleEndianCodec,
  Jpeg2000LosslessCodec,
  Jpeg2000LossyCodec,
  JpegBaselineProcess1Codec,
  JpegLosslessProcess14V1Codec,
  JpegLsLosslessCodec,
  JpegLsLossyCodec,
  RleLosslessCodec,
};
//#endregion

//#region constants
const constants = {
  Jpeg2000ProgressionOrder,
  JpegSampleFactor,
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  TransferSyntax,
};
//#endregion

const DcmjsCodecs = {
  codecs,
  constants,
  Context,
  log,
  NativeCodecs,
  Transcoder,
  version,
};

//#region Exports
module.exports = DcmjsCodecs;
//#endregion
