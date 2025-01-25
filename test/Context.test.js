const {
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
} = require('./../src/Constants');
const Context = require('./../src/Context');

const chai = require('chai');
const expect = chai.expect;

describe('Context', () => {
  it('should initialize with default values when no attributes are provided', () => {
    const context = new Context();
    expect(context.getWidth()).to.be.undefined;
    expect(context.getHeight()).to.be.undefined;
    expect(context.getBitsAllocated()).to.be.undefined;
    expect(context.getBitsStored()).to.be.undefined;
    expect(context.getSamplesPerPixel()).to.be.undefined;
    expect(context.getPixelRepresentation()).to.be.undefined;
    expect(context.getPlanarConfiguration()).to.be.undefined;
    expect(context.getPhotometricInterpretation()).to.be.undefined;
    expect(context.getEncodedBuffer()).to.be.undefined;
    expect(context.getDecodedBuffer()).to.be.undefined;

    context.setWidth(1024);
    context.setHeight(768);
    context.setBitsStored(12);
    context.setBitsAllocated(16);
    context.setSamplesPerPixel(3);
    context.setPixelRepresentation(PixelRepresentation.Unsigned);
    context.setPlanarConfiguration(PlanarConfiguration.Interleaved);
    context.setPhotometricInterpretation(PhotometricInterpretation.Rgb);

    expect(context.getWidth()).to.equal(1024);
    expect(context.getHeight()).to.equal(768);
    expect(context.getBitsStored()).to.equal(12);
    expect(context.getBitsAllocated()).to.equal(16);
    expect(context.getSamplesPerPixel()).to.equal(3);
    expect(context.getPixelRepresentation()).to.equal(PixelRepresentation.Unsigned);
    expect(context.getPlanarConfiguration()).to.equal(PlanarConfiguration.Interleaved);
    expect(context.getPhotometricInterpretation()).to.equal(PhotometricInterpretation.Rgb);
  });

  it('should initialize with provided attributes', () => {
    const attrs = {
      width: 1024,
      height: 768,
      bitsAllocated: 16,
      bitsStored: 12,
      samplesPerPixel: 3,
      pixelRepresentation: PixelRepresentation.Signed,
      planarConfiguration: PlanarConfiguration.Interleaved,
      photometricInterpretation: PhotometricInterpretation.Monochrome1,
      encodedBuffer: new Uint8Array([1, 2, 3]),
      decodedBuffer: new Uint8Array([4, 5, 6]),
    };

    const context = new Context(attrs);
    expect(context.getWidth()).to.equal(attrs.width);
    expect(context.getHeight()).to.equal(attrs.height);
    expect(context.getBitsAllocated()).to.equal(attrs.bitsAllocated);
    expect(context.getBitsStored()).to.equal(attrs.bitsStored);
    expect(context.getSamplesPerPixel()).to.equal(attrs.samplesPerPixel);
    expect(context.getPixelRepresentation()).to.equal(attrs.pixelRepresentation);
    expect(context.getPlanarConfiguration()).to.equal(attrs.planarConfiguration);
    expect(context.getPhotometricInterpretation()).to.equal(attrs.photometricInterpretation);
    expect(context.getEncodedBuffer()).to.deep.equal(attrs.encodedBuffer);
    expect(context.getDecodedBuffer()).to.deep.equal(attrs.decodedBuffer);
  });

  it('should throw an error if width is invalid', function () {
    const context1 = new Context();
    expect(() => context1.validate()).to.throw();

    const context2 = new Context({ width: 1024 });
    expect(() => context2.validate()).to.throw();

    const context3 = new Context({ width: 1024, height: 768 });
    expect(() => context3.validate()).to.throw();

    const context4 = new Context({ width: 1024, height: 768, bitsStored: 12 });
    expect(() => context4.validate()).to.throw();

    const context5 = new Context({ width: 1024, height: 768, bitsStored: 12, bitsAllocated: 16 });
    expect(() => context5.validate()).to.throw();

    const context6 = new Context({
      width: 1024,
      height: 768,
      bitsStored: 12,
      bitsAllocated: 16,
      samplesPerPixel: 3,
    });
    expect(() => context6.validate()).to.throw();

    const context7 = new Context({
      width: 1024,
      height: 768,
      bitsStored: 12,
      bitsAllocated: 16,
      samplesPerPixel: 3,
      pixelRepresentation: PixelRepresentation.Signed,
    });
    expect(() => context7.validate()).to.throw();

    const context8 = new Context({
      width: 1024,
      height: 768,
      bitsStored: 12,
      bitsAllocated: 16,
      samplesPerPixel: 3,
      pixelRepresentation: PixelRepresentation.Signed,
      planarConfiguration: PlanarConfiguration.Interleaved,
    });
    expect(() => context8.validate()).to.throw();
  });

  it('should not throw an error if all values are valid', function () {
    const context = new Context({
      width: 1024,
      height: 768,
      bitsStored: 12,
      bitsAllocated: 16,
      samplesPerPixel: 3,
      pixelRepresentation: PixelRepresentation.Signed,
      planarConfiguration: PlanarConfiguration.Interleaved,
      photometricInterpretation: PhotometricInterpretation.Rgb,
    });
    expect(() => context.validate()).to.not.throw();
  });
});
