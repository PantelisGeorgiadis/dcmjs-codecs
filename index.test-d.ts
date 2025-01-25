import { expectError, expectType } from 'tsd';
import { codecs, constants, Context, log, NativeCodecs, Transcoder, version } from '.';
const { TransferSyntax } = constants;
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
} = codecs;

// log
expectType<void>(log.error('error'));

// version
expectType<string>(version);

// Context
expectType<Context>(new Context());
expectError(new Context(1));
expectError(new Context('2'));

const context = new Context();
expectError(context.setWidth('1'));
expectError(context.setHeight('2'));
expectError(context.setBitsStored('3'));
expectError(context.setBitsAllocated('4'));
expectError(context.setSamplesPerPixel('5'));
expectError(context.setPixelRepresentation('6'));
expectError(context.setPlanarConfiguration('7'));
expectError(context.setPhotometricInterpretation(8));
expectError(context.setEncodedBuffer('9'));
expectError(context.setDecodedBuffer('10'));
expectType<number | undefined>(context.getWidth());
expectType<number | undefined>(context.getHeight());
expectType<number | undefined>(context.getBitsStored());
expectType<number | undefined>(context.getBitsAllocated());
expectType<number | undefined>(context.getSamplesPerPixel());
expectType<number | undefined>(context.getPixelRepresentation());
expectType<number | undefined>(context.getPlanarConfiguration());
expectType<string | undefined>(context.getPhotometricInterpretation());
expectType<Uint8Array | undefined>(context.getEncodedBuffer());
expectType<Uint8Array | undefined>(context.getDecodedBuffer());

// NativeCodecs
expectError(NativeCodecs.initializeAsync('string'));
expectType<Promise<void>>(
  NativeCodecs.initializeAsync({
    logCodecsInfo: true,
    logCodecsTrace: true,
    webAssemblyModulePathOrUrl: '',
  })
);
expectType<Promise<void>>(NativeCodecs.initializeAsync());

const context1 = new Context();
expectType<Context>(NativeCodecs.decodeRle(context1));
expectError(NativeCodecs.decodeRle('1'));
expectError(NativeCodecs.decodeRle(context1, '2'));
expectError(NativeCodecs.encodeRle('1'));
expectError(NativeCodecs.encodeRle(context1, '2'));
expectError(NativeCodecs.decodeJpeg('1'));
expectError(NativeCodecs.decodeJpeg(context1, '2'));
expectError(NativeCodecs.encodeJpeg('1'));
expectError(NativeCodecs.encodeJpeg(context1, '2'));
expectError(NativeCodecs.decodeJpegLs('1'));
expectError(NativeCodecs.decodeJpegLs(context1, '2'));
expectError(NativeCodecs.encodeJpegLs('1'));
expectError(NativeCodecs.encodeJpegLs(context1, '2'));
expectError(NativeCodecs.decodeJpeg2000('1'));
expectError(NativeCodecs.decodeJpeg2000(context1, '2'));
expectError(NativeCodecs.encodeJpeg2000('1'));
expectError(NativeCodecs.encodeJpeg2000(context1, '2'));

// Transcoder
expectError(new Transcoder(1));
expectError(new Transcoder('image'));

const pixels = Uint8Array.from([0x00, 0x7f, 0x00, 0xff, 0x00, 0xff, 0x00, 0x7f, 0x00]);
const transcoder = new Transcoder(
  {
    Rows: 3,
    Columns: 3,
    BitsStored: 8,
    BitsAllocated: 8,
    SamplesPerPixel: 1,
    PixelRepresentation: 0,
    PhotometricInterpretation: 'MONOCHROME2',
    PixelData: [pixels],
  },
  TransferSyntax.ImplicitVRLittleEndian
);
expectType<string>(transcoder.getTransferSyntaxUid());
expectType<Record<string, unknown>>(transcoder.getElements());
expectError(transcoder.transcode(12345));
expectError(transcoder.transcode(12345, '1'));
expectType<void>(transcoder.transcode(TransferSyntax.ImplicitVRLittleEndian, {}));
expectType<ArrayBuffer>(transcoder.getDicomDataset());
expectError(transcoder.getDicomDataset(12345, '1'));
expectType<ArrayBuffer>(transcoder.getDicomPart10());
expectError(transcoder.getDicomPart10(54321, '2'));

[
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
].forEach((cdc: typeof Codec) => {
  const codecInstance = new cdc();
  expectType<Record<string, unknown>>(
    codecInstance.encode({}, TransferSyntax.ImplicitVRLittleEndian, {})
  );
  expectError(codecInstance.encode('1', TransferSyntax.ImplicitVRLittleEndian, {}));
  expectError(codecInstance.encode({}, 2, {}));
  expectError(codecInstance.encode({}, TransferSyntax.ImplicitVRLittleEndian, '3'));
  expectType<Record<string, unknown>>(
    codecInstance.decode({}, TransferSyntax.ImplicitVRLittleEndian, {})
  );
  expectError(codecInstance.decode('1', TransferSyntax.ImplicitVRLittleEndian, {}));
  expectError(codecInstance.decode({}, 2, {}));
  expectError(codecInstance.decode({}, TransferSyntax.ImplicitVRLittleEndian, '3'));
});
