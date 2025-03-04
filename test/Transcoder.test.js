const {
  compareDicomDataset,
  compareDicomPart10,
  createDicomPart10FromColorRandomImage,
  createDicomPart10FromGrayscaleRandomImage,
} = require('./utils/p10Utils');
const {
  PhotometricInterpretation,
  PixelRepresentation,
  TransferSyntax,
} = require('./../src/Constants');
const NativeCodecs = require('./../src/NativeCodecs');
const Transcoder = require('./../src/Transcoder');

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const TestImageDimMin = 16;
const TestImageDimMax = 1024;
const TestImageDimLength = 1;

function nearestPowerOf2(n) {
  return 1 << (31 - Math.clz32(n));
}

function getRandomDims() {
  const min = TestImageDimMin;
  const max = TestImageDimMax;

  const dims = [];
  Array.from({ length: TestImageDimLength }, () => {
    dims.push(nearestPowerOf2(Math.floor(Math.random() * (max - min + 1)) + min));
  });

  return dims;
}

function roundTripTest(transferSyntaxUid) {
  getRandomDims().forEach((width) => {
    getRandomDims().forEach((height) => {
      [8, 16].forEach((bits) => {
        [true, false].forEach((signed) => {
          [1, 2, 5].forEach((frames) => {
            const grayscalePart10 = createDicomPart10FromGrayscaleRandomImage(
              frames,
              bits,
              bits === 16 ? signed : false,
              width,
              height
            );

            const encoder = new Transcoder(grayscalePart10);
            const grayscaleDataset = encoder.getDicomDataset();
            const grayscaleDatasetSyntax = encoder.getTransferSyntaxUid();
            encoder.transcode(transferSyntaxUid);
            const encodedPart10 = encoder.getDicomPart10();

            const decoder = new Transcoder(encodedPart10);
            decoder.transcode(TransferSyntax.ExplicitVRLittleEndian);
            const decodedPart10 = decoder.getDicomPart10();
            const decodedDataset = decoder.getDicomDataset();
            const decodedDatasetSyntax = decoder.getTransferSyntaxUid();

            compareDicomPart10(grayscalePart10, decodedPart10);
            compareDicomDataset(
              grayscaleDataset,
              grayscaleDatasetSyntax,
              decodedDataset,
              decodedDatasetSyntax
            );
          });
        });
      });

      [true, false].forEach((planar) => {
        [1, 2, 5].forEach((frames) => {
          const colorPart10 = createDicomPart10FromColorRandomImage(frames, planar, width, height);

          const encoder = new Transcoder(colorPart10);
          const colorDataset = encoder.getDicomDataset();
          const colorDatasetSyntax = encoder.getTransferSyntaxUid();
          encoder.transcode(transferSyntaxUid);
          const encodedPart10 = encoder.getDicomPart10();

          const decoder = new Transcoder(encodedPart10);
          decoder.transcode(TransferSyntax.ExplicitVRLittleEndian);
          const decodedPart10 = decoder.getDicomPart10();
          const decodedDataset = decoder.getDicomDataset();
          const decodedDatasetSyntax = decoder.getTransferSyntaxUid();

          compareDicomPart10(colorPart10, decodedPart10);
          compareDicomDataset(
            colorDataset,
            colorDatasetSyntax,
            decodedDataset,
            decodedDatasetSyntax
          );
        });
      });
    });
  });
}

function allLosslessSyntaxesTest() {
  getRandomDims().forEach((width) => {
    getRandomDims().forEach((height) => {
      [8, 16].forEach((bits) => {
        [true, false].forEach((signed) => {
          [1, 2, 5].forEach((frames) => {
            const grayscalePart10 = createDicomPart10FromGrayscaleRandomImage(
              frames,
              bits,
              bits === 16 ? signed : false,
              width,
              height
            );

            const transcoder = new Transcoder(grayscalePart10);
            [
              TransferSyntax.ImplicitVRLittleEndian,
              TransferSyntax.ExplicitVRLittleEndian,
              TransferSyntax.ExplicitVRBigEndian,
              TransferSyntax.RleLossless,
              TransferSyntax.JpegLosslessProcess14V1,
              TransferSyntax.JpegLsLossless,
              TransferSyntax.Jpeg2000Lossless,
            ].forEach((syntax) => {
              transcoder.transcode(syntax);
            });
            transcoder.transcode(TransferSyntax.ExplicitVRLittleEndian);
            const decodedPart10 = transcoder.getDicomPart10();

            compareDicomPart10(grayscalePart10, decodedPart10);
          });
        });
      });

      [true, false].forEach((planar) => {
        [1, 2, 5].forEach((frames) => {
          const colorPart10 = createDicomPart10FromColorRandomImage(frames, planar, width, height);

          const transcoder = new Transcoder(colorPart10);
          [
            TransferSyntax.ImplicitVRLittleEndian,
            TransferSyntax.ExplicitVRLittleEndian,
            TransferSyntax.ExplicitVRBigEndian,
            TransferSyntax.RleLossless,
            TransferSyntax.JpegLosslessProcess14V1,
            TransferSyntax.JpegLsLossless,
            TransferSyntax.Jpeg2000Lossless,
          ].forEach((syntax) => {
            transcoder.transcode(syntax);
          });
          transcoder.transcode(TransferSyntax.ExplicitVRLittleEndian);
          const decodedPart10 = transcoder.getDicomPart10();

          compareDicomPart10(colorPart10, decodedPart10);
        });
      });
    });
  });
}

describe('Transcoder', () => {
  before(async () => {
    sinon.stub(NativeCodecs, '_getWebAssemblyBytes').callsFake(async () => {
      const isNodeJs = !!(
        typeof process !== 'undefined' &&
        process.versions &&
        process.versions.node
      );
      if (isNodeJs) {
        const wasmPath = path.join(process.cwd(), 'wasm', 'bin', 'dcmjs-native-codecs.wasm');
        const buffer = fs.readFileSync(wasmPath);

        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      }
      // Karma tests
      const response = await fetch('base/wasm/bin/dcmjs-native-codecs.wasm');
      const responseArrayBuffer = await response.arrayBuffer();

      return responseArrayBuffer;
    });
    await NativeCodecs.initializeAsync({ logCodecsInfo: false, logCodecsTrace: false });
  });
  after(() => {
    sinon.restore();
    NativeCodecs.release();
  });

  it('should throw for invalid transfer syntax', () => {
    expect(() => {
      const transcoder = new Transcoder({}, TransferSyntax.ExplicitVRLittleEndian);
      transcoder.transcode(undefined);
    }).to.throw();
    expect(() => {
      const transcoder = new Transcoder({}, TransferSyntax.ExplicitVRLittleEndian);
      transcoder.transcode('1.2.3.4.5.6.7.8.9.0');
    }).to.throw();
  });

  it('should correctly perform basic lossless transcoding', () => {
    const width = 3;
    const height = 3;
    // prettier-ignore
    const pixels = Uint8Array.from([
      0x00, 0xff, 0x00,
      0xff, 0x7f, 0xff,
      0x00, 0xff, 0x00,
    ]);

    const elements = {
      _vrMap: {
        PixelData: 'OB',
      },
      BitsAllocated: 8,
      BitsStored: 8,
      Columns: width,
      HighBit: 7,
      NumberOfFrames: 1,
      PhotometricInterpretation: PhotometricInterpretation.Monochrome2,
      PixelData: [pixels.buffer],
      PixelRepresentation: PixelRepresentation.Unsigned,
      Rows: height,
      SamplesPerPixel: 1,
    };

    const transcoder1 = new Transcoder(elements, TransferSyntax.ExplicitVRLittleEndian);
    transcoder1.transcode(TransferSyntax.Jpeg2000Lossless);
    const transcodedDataset = transcoder1.getDicomDataset();
    const transcodedTransferSyntaxUid1 = transcoder1.getTransferSyntaxUid();

    const transcoder2 = new Transcoder(transcodedDataset, transcodedTransferSyntaxUid1);
    transcoder2.transcode(TransferSyntax.ExplicitVRLittleEndian);
    const transcodedElements = transcoder2.getElements();
    const transcodedTransferSyntaxUid2 = transcoder2.getTransferSyntaxUid();

    expect(transcodedTransferSyntaxUid2).to.equal(TransferSyntax.ExplicitVRLittleEndian);
    expect(Object.keys(elements).length).to.be.eq(Object.keys(transcodedElements).length);
    expect(Object.keys(elements)).to.have.members(Object.keys(transcodedElements));
  }).timeout(20000);

  it('should correctly perform basic lossy transcoding', () => {
    const width = 3;
    const height = 3;
    // prettier-ignore
    const pixels = Uint8Array.from([
      0x00, 0xff, 0x00,
      0xff, 0x7f, 0xff,
      0x00, 0xff, 0x00,
    ]);

    const elements = {
      _vrMap: {
        PixelData: 'OB',
      },
      BitsAllocated: 8,
      BitsStored: 8,
      Columns: width,
      HighBit: 7,
      NumberOfFrames: 1,
      PhotometricInterpretation: PhotometricInterpretation.Monochrome2,
      PixelData: [pixels.buffer],
      PixelRepresentation: PixelRepresentation.Unsigned,
      Rows: height,
      SamplesPerPixel: 1,
    };

    const transcoder1 = new Transcoder(elements, TransferSyntax.ExplicitVRLittleEndian);
    transcoder1.transcode(TransferSyntax.JpegBaselineProcess1);
    const transcodedElements1 = transcoder1.getElements();
    const transcodedTransferSyntaxUid1 = transcoder1.getTransferSyntaxUid();

    expect(transcodedTransferSyntaxUid1).to.equal(TransferSyntax.JpegBaselineProcess1);
    expect(transcodedElements1.LossyImageCompressionMethod).to.equal('ISO_10918_1');
    expect(transcodedElements1.LossyImageCompression).to.equal('01');
    expect(transcodedElements1.LossyImageCompressionRatio).not.to.be.undefined;

    const transcoder2 = new Transcoder(transcodedElements1, transcodedTransferSyntaxUid1);
    transcoder2.transcode(TransferSyntax.JpegLsLossy);
    const transcodedElements2 = transcoder2.getElements();
    const transcodedTransferSyntaxUid2 = transcoder2.getTransferSyntaxUid();

    expect(transcodedTransferSyntaxUid2).to.equal(TransferSyntax.JpegLsLossy);
    expect(transcodedElements2.LossyImageCompressionMethod).to.equal('ISO_14495_1');
    expect(transcodedElements2.LossyImageCompression).to.equal('01');
    expect(transcodedElements2.LossyImageCompressionRatio).not.to.be.undefined;

    const transcoder3 = new Transcoder(transcodedElements2, transcodedTransferSyntaxUid2);
    transcoder3.transcode(TransferSyntax.Jpeg2000Lossy);
    const transcodedElements3 = transcoder3.getElements();
    const transcodedTransferSyntaxUid3 = transcoder3.getTransferSyntaxUid();

    expect(transcodedTransferSyntaxUid3).to.equal(TransferSyntax.Jpeg2000Lossy);
    expect(transcodedElements3.LossyImageCompressionMethod).to.equal('ISO_15444_1');
    expect(transcodedElements3.LossyImageCompression).to.equal('01');
    expect(transcodedElements3.LossyImageCompressionRatio).not.to.be.undefined;
  });

  it('should correctly encode and decode basic ImplicitVRLittleEndian [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.ImplicitVRLittleEndian);
  }).timeout(20000);

  it('should correctly encode and decode basic ExplicitVRBigEndian [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.ExplicitVRBigEndian);
  }).timeout(20000);

  it('should correctly encode and decode basic RleLossless [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.RleLossless);
  }).timeout(20000);

  it('should correctly encode and decode basic JpegLossless [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.JpegLosslessProcess14V1);
  }).timeout(20000);

  it('should correctly encode and decode basic JpegLSLossless [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.JpegLsLossless);
  }).timeout(20000);

  it('should correctly encode and decode basic Jpeg2000Lossless [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(TransferSyntax.Jpeg2000Lossless);
  }).timeout(20000);

  it('should correctly transcode between all supported lossless syntaxes [DICOM part10]', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    allLosslessSyntaxesTest();
  }).timeout(20000);
});
