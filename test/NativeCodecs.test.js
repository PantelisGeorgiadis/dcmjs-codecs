const {
  compareContexts,
  createContextFromColorRandomImage,
  createContextFromGrayscaleRandomImage,
} = require('./utils/contextUtils');
const NativeCodecs = require('./../src/NativeCodecs');

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

function roundTripTest(encodeFn, decodeFn, parameters) {
  getRandomDims().forEach((width) => {
    getRandomDims().forEach((height) => {
      [8, 16].forEach((bits) => {
        [true, false].forEach((signed) => {
          const grayscaleContext = createContextFromGrayscaleRandomImage(
            bits,
            bits === 16 ? signed : false,
            width,
            height
          );
          const grayscaleEncodedContext = NativeCodecs[encodeFn](grayscaleContext, parameters);
          const grayscaleDecodedContext = NativeCodecs[decodeFn](grayscaleEncodedContext);

          compareContexts(grayscaleContext, grayscaleDecodedContext);
        });
      });

      const colorContext = createContextFromColorRandomImage(false, width, height);
      const colorEncodedContext = NativeCodecs[encodeFn](colorContext, parameters);
      const colorDecodedContext = NativeCodecs[decodeFn](colorEncodedContext);

      compareContexts(colorContext, colorDecodedContext);
    });
  });
}

describe('Uninitialized NativeCodecs', () => {
  it('should throw for uninitialized NativeCodecs', () => {
    expect(() => {
      NativeCodecs.encodeRle(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.encodeJpeg(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.encodeJpegLs(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.encodeJpeg2000(undefined, undefined);
    }).to.throw();

    expect(() => {
      NativeCodecs.decodeRle(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.decodeJpeg(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.decodeJpegLs(undefined, undefined);
    }).to.throw();
    expect(() => {
      NativeCodecs.decodeJpeg2000(undefined, undefined);
    }).to.throw();
  });
});

describe('NativeCodecs', () => {
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
  });

  it('should correctly encode and decode basic RleLossless', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(NativeCodecs.encodeRle.name, NativeCodecs.decodeRle.name);
  }).timeout(20000);

  it('should correctly encode and decode basic JpegLossless', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(NativeCodecs.encodeJpeg.name, NativeCodecs.decodeJpeg.name);
  }).timeout(20000);

  it('should correctly encode and decode basic JpegLSLossless', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(NativeCodecs.encodeJpegLs.name, NativeCodecs.decodeJpegLs.name);
  }).timeout(20000);

  it('should correctly encode and decode basic Jpeg2000Lossless', () => {
    expect(NativeCodecs.isInitialized()).to.be.true;
    roundTripTest(NativeCodecs.encodeJpeg2000.name, NativeCodecs.decodeJpeg2000.name);
  }).timeout(20000);
});
