const {
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
} = require('./../../src/Constants');
const { RandomColorImageBuffer, RandomGrayscaleImageBuffer } = require('./randomImage');
const Context = require('./../../src/Context');

const chai = require('chai');
const expect = chai.expect;

/**
 * Creates a context from a random grayscale image.
 * @param {number} bits - Number of bits per pixel.
 * @param {boolean} sign - Whether the pixel data is signed.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {Context} - Context.
 */
function createContextFromGrayscaleRandomImage(bits, sign, width, height) {
  const randomImage = new RandomGrayscaleImageBuffer(bits, sign, width, height);
  randomImage.random();

  return new Context({
    width,
    height,
    bitsAllocated: bits,
    bitsStored: bits,
    samplesPerPixel: 1,
    pixelRepresentation: sign ? PixelRepresentation.Signed : PixelRepresentation.Unsigned,
    photometricInterpretation: PhotometricInterpretation.Monochrome2,
    decodedBuffer: randomImage.getByteBuffer(),
  });
}

/**
 * Creates a context from a random color image.
 * @param {number} bits - Number of bits per pixel.
 * @param {boolean} sign - Whether the pixel data is signed.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {Context} - Context.
 */
function createContextFromColorRandomImage(planar, width, height) {
  const randomImage = new RandomColorImageBuffer(planar, width, height);
  randomImage.random();

  return new Context({
    width,
    height,
    bitsAllocated: 8,
    bitsStored: 8,
    samplesPerPixel: 3,
    pixelRepresentation: PixelRepresentation.Unsigned,
    photometricInterpretation: PhotometricInterpretation.Rgb,
    planarConfiguration: planar ? PlanarConfiguration.Planar : PlanarConfiguration.Interleaved,
    decodedBuffer: randomImage.getByteBuffer(),
  });
}

/**
 * Compares two contexts.
 * @param {Context} lContext - Left context.
 * @param {Context} rContext - Right context.
 */
function compareContexts(lContext, rContext) {
  expect(lContext.getWidth()).to.equal(rContext.getWidth());
  expect(lContext.getHeight()).to.equal(rContext.getHeight());
  expect(lContext.getBitsAllocated()).to.equal(rContext.getBitsAllocated());
  expect(lContext.getBitsStored()).to.equal(rContext.getBitsStored());
  expect(lContext.getSamplesPerPixel()).to.equal(rContext.getSamplesPerPixel());
  expect(lContext.getPixelRepresentation()).to.equal(rContext.getPixelRepresentation());
  if (lContext.getPlanarConfiguration() !== undefined) {
    expect(lContext.getPlanarConfiguration()).to.equal(rContext.getPlanarConfiguration());
  }
  expect(lContext.getPhotometricInterpretation()).to.equal(rContext.getPhotometricInterpretation());

  const getPixel = (context, i) => {
    const pixelBytes = context.getDecodedBuffer();
    if (context.getBitsAllocated() <= 8) {
      const p8 = pixelBytes[i];
      return p8;
    }

    const sign = pixelBytes[i] & (1 << 7);
    const p16 = ((pixelBytes[i] & 0xff) << 8) | (pixelBytes[i + 1] & 0xff);
    return context.getPixelRepresentation() === PixelRepresentation.Signed
      ? sign
        ? 0xffff0000 | p16
        : p16
      : p16;
  };

  let numDifferences = 0;
  let delta = 0;
  const numPixels = lContext.getWidth() * lContext.getHeight() * lContext.getSamplesPerPixel();
  for (let i = 0; i < numPixels; i++) {
    const lPixel = getPixel(lContext, i);
    const rPixel = getPixel(rContext, i);
    if (lPixel !== rPixel) {
      delta += Math.abs(lPixel - rPixel);
      numDifferences++;
    }
  }

  const averageDifference = numDifferences ? delta / numDifferences : 0;
  expect(averageDifference).to.equal(0);
}

module.exports = {
  createContextFromGrayscaleRandomImage,
  createContextFromColorRandomImage,
  compareContexts,
};
