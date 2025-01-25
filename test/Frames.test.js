const { FrameConverter, Frames } = require('./../src/Frames');
const {
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  TransferSyntax,
} = require('./../src/Constants');

const chai = require('chai');
const expect = chai.expect;

describe('Frames', () => {
  it('should create an instance of Frames', () => {
    const elements = {
      NumberOfFrames: 2,
      Columns: 512,
      Rows: 512,
      BitsAllocated: 16,
      BitsStored: 12,
      HighBit: 11,
      SamplesPerPixel: 3,
      PixelRepresentation: PixelRepresentation.Unsigned,
      PlanarConfiguration: PlanarConfiguration.Interleaved,
      PhotometricInterpretation: PhotometricInterpretation.Rgb,
      PixelData: new Uint8Array(512 * 512 * 3 * 2),
    };

    const frames = new Frames(elements, TransferSyntax.Jpeg2000Lossless);
    expect(frames).to.be.an.instanceof(Frames);
  });

  it('should initialize properties correctly', () => {
    const elements = {
      NumberOfFrames: 2,
      Columns: 512,
      Rows: 512,
      BitsAllocated: 8,
      BitsStored: 8,
      HighBit: 7,
      SamplesPerPixel: 3,
      PixelRepresentation: PixelRepresentation.Unsigned,
      PlanarConfiguration: PlanarConfiguration.Interleaved,
      PhotometricInterpretation: PhotometricInterpretation.Rgb,
      PixelData: new Uint8Array(512 * 512 * 3 * 2),
    };
    const transferSyntaxUid = TransferSyntax.JpegBaselineProcess1;

    const frames = new Frames(elements, transferSyntaxUid);
    expect(frames.getTransferSyntaxUid()).to.equal(transferSyntaxUid);
    expect(frames.getNumberOfFrames()).to.equal(elements.NumberOfFrames);
    expect(frames.getWidth()).to.equal(elements.Columns);
    expect(frames.getHeight()).to.equal(elements.Rows);
    expect(frames.getBitsAllocated()).to.equal(elements.BitsAllocated);
    expect(frames.getBitsStored()).to.equal(elements.BitsStored);
    expect(frames.getHighBit()).to.equal(elements.HighBit);
    expect(frames.getSamplesPerPixel()).to.equal(elements.SamplesPerPixel);
    expect(frames.getPixelRepresentation()).to.equal(elements.PixelRepresentation);
    expect(frames.getPlanarConfiguration()).to.equal(elements.PlanarConfiguration);
    expect(frames.getPhotometricInterpretation()).to.equal(elements.PhotometricInterpretation);
  });

  it('should handle missing optional properties', () => {
    const minimalElements = {
      Columns: 256,
      Rows: 256,
      PixelData: new Uint8Array(256 * 256),
    };
    const frames = new Frames(minimalElements, TransferSyntax.ImplicitVRLittleEndian);

    expect(frames.getNumberOfFrames()).to.equal(1);
    expect(frames.getBitsAllocated()).to.equal(0);
    expect(frames.getBitsStored()).to.equal(0);
    expect(frames.getHighBit()).to.equal(-1);
    expect(frames.getSamplesPerPixel()).to.equal(1);
    expect(frames.getPixelRepresentation()).to.equal(PixelRepresentation.Unsigned);
    expect(frames.getPlanarConfiguration()).to.equal(PlanarConfiguration.Interleaved);
    expect(frames.getPhotometricInterpretation()).to.equal('');
  });

  it('should get the proper frame buffer', () => {
    const width = 512;
    const height = 512;
    const frame1 = Uint8Array.from(
      Array.from({ length: 3 * width * height }, () => Math.floor(Math.random() * 0xff))
    );
    const frame1ArrayBuffer = frame1.buffer.slice(
      frame1.byteOffset,
      frame1.byteOffset + frame1.byteLength
    );
    const frame2 = Uint8Array.from(
      Array.from({ length: 3 * width * height }, () => Math.floor(Math.random() * 0xff))
    );
    const frame2ArrayBuffer = frame2.buffer.slice(
      frame2.byteOffset,
      frame2.byteOffset + frame2.byteLength
    );
    const combinedFrames = new Uint8Array(frame1.length + frame2.length);
    combinedFrames.set(frame1, 0);
    combinedFrames.set(frame2, frame1.length);
    const combinedFramesArrayBuffer = combinedFrames.buffer.slice(
      combinedFrames.byteOffset,
      combinedFrames.byteOffset + combinedFrames.byteLength
    );

    [true, false].forEach((encapsulated) => {
      const elements = {
        NumberOfFrames: 2,
        Columns: width,
        Rows: height,
        BitsAllocated: 8,
        BitsStored: 8,
        HighBit: 7,
        SamplesPerPixel: 3,
        PixelRepresentation: PixelRepresentation.Unsigned,
        PlanarConfiguration: PlanarConfiguration.Interleaved,
        PhotometricInterpretation: PhotometricInterpretation.Rgb,
        PixelData: encapsulated
          ? [frame1ArrayBuffer, frame2ArrayBuffer]
          : [combinedFramesArrayBuffer],
      };
      const transferSyntaxUid = encapsulated
        ? TransferSyntax.RleLossless
        : TransferSyntax.ExplicitVRLittleEndian;
      const frames = new Frames(elements, transferSyntaxUid);
      expect(frames.getTransferSyntaxUid()).to.equal(transferSyntaxUid);
      expect(frames.getFrameBuffer(0)).to.deep.equal(frame1);
      expect(frames.getFrameBuffer(1)).to.deep.equal(frame2);
    });
  });

  it('should throw for missing frame parameters', () => {
    const frames = new Frames(
      {
        NumberOfFrames: 1,
        PhotometricInterpretation: PhotometricInterpretation.Monochrome1,
        PixelData: [Uint8Array.from([1, 2, 3, 4, 5]).buffer],
      },
      TransferSyntax.ImplicitVRLittleEndian
    );
    expect(() => {
      frames.getFrameBuffer(0);
    }).to.throw();

    const frames2 = new Frames(
      {
        PixelData: [Uint8Array.from([1, 2, 3, 4, 5]).buffer],
        PhotometricInterpretation: PhotometricInterpretation.Monochrome1,
      },
      TransferSyntax.ImplicitVRLittleEndian
    );
    expect(() => {
      frames2.getFrameBuffer(0);
    }).to.throw();

    const frames3 = new Frames(
      {
        Rows: 128,
        Columns: 128,
        PhotometricInterpretation: PhotometricInterpretation.Monochrome1,
        PixelData: [Uint8Array.from([1, 2, 3, 4, 5]).buffer],
      },
      TransferSyntax.ImplicitVRLittleEndian
    );
    expect(() => {
      frames3.getFrameBuffer(0);
    }).to.throw();

    const frames4 = new Frames(
      {
        PhotometricInterpretation: PhotometricInterpretation.Monochrome1,
      },
      TransferSyntax.ImplicitVRLittleEndian
    );
    expect(() => {
      frames4.getFrameBuffer(0);
    }).to.throw();
  });
});

describe('FrameConverter', () => {
  it('should correctly convert pixels between planar configurations', () => {
    const width = 3;
    const height = 3;
    // prettier-ignore
    const planarPixels = Uint8Array.from([
      0x00, 0xff, 0x00,   0xff, 0x00, 0xff,   0x00, 0xff, 0x00,
      0x00, 0xff, 0x00,   0xff, 0x00, 0xff,   0x00, 0xff, 0x00,
      0x00, 0xff, 0x00,   0xff, 0x00, 0xff,   0x00, 0xff, 0x00,
    ]);
    // prettier-ignore
    const expectedInterleavedPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    const convertedInterleavedPixels = FrameConverter.changePlanarConfiguration(
      planarPixels,
      8,
      3,
      PlanarConfiguration.Planar
    );
    const convertedPlanarPixels = FrameConverter.changePlanarConfiguration(
      convertedInterleavedPixels,
      8,
      3,
      PlanarConfiguration.Interleaved
    );
    for (let i = 0; i < 3 * width * height; i++) {
      expect(convertedInterleavedPixels[i]).to.be.eq(expectedInterleavedPixels[i]);
    }
    for (let i = 0; i < 3 * width * height; i++) {
      expect(convertedPlanarPixels[i]).to.be.eq(planarPixels[i]);
    }
  });

  it('should correctly convert pixels from YBR_FULL to RGB', () => {
    const width = 3;
    const height = 3;
    // prettier-ignore
    const rgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    // prettier-ignore
    const expectedRgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    const ybrFullData = new Uint8Array(rgbPixels.length);
    for (let n = 0; n < rgbPixels.length; n += 3) {
      const r = rgbPixels[n];
      const g = rgbPixels[n + 1];
      const b = rgbPixels[n + 2];

      ybrFullData[n] = Math.trunc(0.299 * r + 0.587 * g + 0.114 * b);
      ybrFullData[n + 1] = Math.trunc(-0.168736 * r - 0.331264 * g + 0.5 * b + 128);
      ybrFullData[n + 2] = Math.trunc(0.5 * r - 0.418688 * g - 0.081312 * b + 128);
    }
    const convertedRgbPixels = FrameConverter.ybrFullToRgb(ybrFullData);
    for (let i = 0; i < 3 * width * height; i++) {
      expect(convertedRgbPixels[i]).to.be.eq(expectedRgbPixels[i]);
    }
  });

  it('should correctly convert pixels from YBR_FULL_422 to RGB', () => {
    const width = 4;
    const height = 4;
    // prettier-ignore
    const rgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    // prettier-ignore
    const expectedRgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    const ybrFull422Data = new Uint8Array(rgbPixels.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = rgbPixels[(y * width + x) * 3];
        const g = rgbPixels[(y * width + x) * 3 + 1];
        const b = rgbPixels[(y * width + x) * 3 + 2];

        const n = Math.trunc(x / 2) * 4;
        ybrFull422Data[y * width * 2 + n + Math.trunc(x % 2)] = Math.trunc(
          0.299 * r + 0.587 * g + 0.114 * b + 0.5
        );
        ybrFull422Data[y * width * 2 + n + 2] = Math.trunc(
          -0.1687 * r - 0.3313 * g + 0.5 * b + 128 + 0.5
        );
        ybrFull422Data[y * width * 2 + n + 3] = Math.trunc(
          0.5 * r - 0.4187 * g - 0.0813 * b + 128 + 0.5
        );
      }
    }
    const convertedRgbPixels = FrameConverter.ybrFull422ToRgb(ybrFull422Data, width);
    for (let i = 0; i < 3 * width * height; i++) {
      expect(convertedRgbPixels[i]).to.be.eq(expectedRgbPixels[i]);
    }
  });

  it('should correctly convert pixels from YBR_PARTIAL_422 to RGB', () => {
    const width = 4;
    const height = 4;
    // prettier-ignore
    const rgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    // prettier-ignore
    const expectedRgbPixels = Uint8Array.from([
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x7f, 0x7f, 0x7f,   0xff, 0xff, 0xff,
      0xff, 0xff, 0xff,   0x00, 0x00, 0x00,   0xff, 0xff, 0xff,   0x00, 0x00, 0x00,
    ]);
    const ybrPartial422Data = new Uint8Array(rgbPixels.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = rgbPixels[(y * width + x) * 3];
        const g = rgbPixels[(y * width + x) * 3 + 1];
        const b = rgbPixels[(y * width + x) * 3 + 2];

        const n = Math.trunc(x / 2) * 4;
        ybrPartial422Data[y * width * 2 + n + Math.trunc(x % 2)] = Math.trunc(
          0.2568 * r + 0.5041 * g + 0.0979 * b + 16 + 0.5
        );
        ybrPartial422Data[y * width * 2 + n + 2] = Math.trunc(
          -0.1482 * r - 0.291 * g + 0.4392 * b + 128 + 0.5
        );
        ybrPartial422Data[y * width * 2 + n + 3] = Math.trunc(
          0.4392 * r - 0.3678 * g - 0.0714 * b + 128 + 0.5
        );
      }
    }
    const convertedRgbPixels = FrameConverter.ybrPartial422ToRgb(ybrPartial422Data, width);
    for (let i = 0; i < 3 * width * height; i++) {
      expect(convertedRgbPixels[i]).to.be.eq(expectedRgbPixels[i]);
    }
  });

  it('should correctly unpack 16-bit low and high bytes', () => {
    const width = 3;
    const height = 3;
    // prettier-ignore
    const pixels = Uint8Array.from([
      0x01, 0x02,   0x03, 0x04,   0x05, 0x06,
      0x07, 0x08,   0x09, 0x0a,   0x0b, 0x0c,
      0x0d, 0x0e,   0x10, 0x11,   0x12, 0x13,
    ]);
    // prettier-ignore
    const expectedUnpackedLowPixels = Uint8Array.from([
      0x01, 0x03, 0x05,
      0x07, 0x09, 0x0b,
      0x0d, 0x10, 0x12,
    ]);
    // prettier-ignore
    const expectedUnpackedHighPixels = Uint8Array.from([
      0x02, 0x04, 0x06,
      0x08, 0x0a, 0x0c,
      0x0e, 0x11, 0x13,
    ]);
    const unpackedLowPixels = FrameConverter.unpackLow16(pixels);
    const unpackedHighPixels = FrameConverter.unpackHigh16(pixels);
    for (let i = 0; i < width * height; i++) {
      expect(unpackedLowPixels[i]).to.be.eq(expectedUnpackedLowPixels[i]);
      expect(unpackedHighPixels[i]).to.be.eq(expectedUnpackedHighPixels[i]);
    }
  });
});
