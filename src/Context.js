const { PhotometricInterpretation } = require('./Constants');

//#region Context
class Context {
  /**
   * Creates an instance of Context.
   * @constructor
   * @param {Object} [attrs] - Context creation attributes.
   * @param {number} [attrs.width] - Frame width.
   * @param {number} [attrs.height] - Frame height.
   * @param {number} [attrs.bitsAllocated] - Bits allocated.
   * @param {number} [attrs.bitsStored] - Bits stored.
   * @param {number} [attrs.samplesPerPixel] - Samples per pixel.
   * @param {number} [attrs.pixelRepresentation] - Pixel representation.
   * @param {number} [attrs.planarConfiguration] - Planar configuration.
   * @param {string} [attrs.photometricInterpretation] - Photometric interpretation.
   * @param {Uint8Array} [attrs.encodedBuffer] - Encoded byte buffer.
   * @param {Uint8Array} [attrs.decodedBuffer] - Decoded byte buffer.
   */
  constructor(attrs = {}) {
    const {
      width,
      height,
      bitsAllocated,
      bitsStored,
      samplesPerPixel,
      pixelRepresentation,
      planarConfiguration,
      photometricInterpretation,
      encodedBuffer,
      decodedBuffer,
    } = attrs;

    this.width = width;
    this.height = height;
    this.bitsAllocated = bitsAllocated;
    this.bitsStored = bitsStored;
    this.samplesPerPixel = samplesPerPixel;
    this.pixelRepresentation = pixelRepresentation;
    this.planarConfiguration = planarConfiguration;
    this.photometricInterpretation = photometricInterpretation;
    this.encodedBuffer = encodedBuffer;
    this.decodedBuffer = decodedBuffer;
  }
  /**
   * Gets the frame width.
   * @method
   * @returns {number} Width.
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets the frame width.
   * @method
   * @param {number} width - Frame width.
   */
  setWidth(width) {
    this.width = width;
  }

  /**
   * Gets the frame height.
   * @method
   * @returns {number} Height.
   */
  getHeight() {
    return this.height;
  }

  /**
   * Sets the frame height.
   * @method
   * @param {number} height - Frame height.
   */
  setHeight(height) {
    this.height = height;
  }

  /**
   * Gets the bits stored.
   * @method
   * @returns {number} Bits stored.
   */
  getBitsStored() {
    return this.bitsStored;
  }

  /**
   * Sets the bits stored.
   * @method
   * @param {number} bitsStored - Bits stored.
   */
  setBitsStored(bitsStored) {
    this.bitsStored = bitsStored;
  }

  /**
   * Gets the bits allocated.
   * @method
   * @returns {number} Bits allocated.
   */
  getBitsAllocated() {
    return this.bitsAllocated;
  }

  /**
   * Sets the bits allocated.
   * @method
   * @param {number} bitsAllocated - Bits allocated.
   */
  setBitsAllocated(bitsAllocated) {
    this.bitsAllocated = bitsAllocated;
  }

  /**
   * Gets the samples per pixel.
   * @method
   * @returns {number} Samples per pixel.
   */
  getSamplesPerPixel() {
    return this.samplesPerPixel;
  }

  /**
   * Sets the samples per pixel.
   * @method
   * @param {number} samplesPerPixel - Samples per pixel.
   */
  setSamplesPerPixel(samplesPerPixel) {
    this.samplesPerPixel = samplesPerPixel;
  }

  /**
   * Gets the pixel representation.
   * @method
   * @returns {PixelRepresentation} Pixel representation.
   */
  getPixelRepresentation() {
    return this.pixelRepresentation;
  }

  /**
   * Sets the pixel representation.
   * @method
   * @param {number} pixelRepresentation - Pixel representation.
   */
  setPixelRepresentation(pixelRepresentation) {
    this.pixelRepresentation = pixelRepresentation;
  }

  /**
   * Gets the planar configuration.
   * @method
   * @returns {PlanarConfiguration} Planar configuration.
   */
  getPlanarConfiguration() {
    return this.planarConfiguration;
  }

  /**
   * Sets the planar configuration.
   * @method
   * @param {number} planarConfiguration - Planar configuration.
   */
  setPlanarConfiguration(planarConfiguration) {
    this.planarConfiguration = planarConfiguration;
  }

  /**
   * Gets the photometric interpretation.
   * @method
   * @returns {PhotometricInterpretation} Photometric interpretation.
   */
  getPhotometricInterpretation() {
    return this.photometricInterpretation;
  }

  /**
   * Sets the photometric interpretation.
   * @method
   * @param {string} photometricInterpretation - Photometric interpretation.
   */
  setPhotometricInterpretation(photometricInterpretation) {
    this.photometricInterpretation = photometricInterpretation;
  }

  /**
   * Gets the encoded buffer.
   * @method
   * @returns {Uint8Array} Encoded buffer.
   */
  getEncodedBuffer() {
    return this.encodedBuffer;
  }

  /**
   * Sets the encoded buffer.
   * @method
   * @param {Uint8Array} encodedBuffer - Encoded buffer.
   */
  setEncodedBuffer(encodedBuffer) {
    this.encodedBuffer = encodedBuffer;
  }

  /**
   * Gets the decoded buffer.
   * @method
   * @returns {Uint8Array} Decoded buffer.
   */
  getDecodedBuffer() {
    return this.decodedBuffer;
  }

  /**
   * Sets the decoded buffer.
   * @method
   * @param {Uint8Array} decodedBuffer - Decoded buffer.
   */
  setDecodedBuffer(decodedBuffer) {
    this.decodedBuffer = decodedBuffer;
  }

  /**
   * Validates the context values.
   * @method
   * @throws {Error} If context values are invalid.
   */
  validate() {
    if (!this.getWidth()) {
      throw new Error(`Width has an invalid value [${this.getWidth()}]`);
    }
    if (!this.getHeight()) {
      throw new Error(`Height has an invalid value [${this.getHeight()}]`);
    }
    if (!this.getBitsStored()) {
      throw new Error(`Bits stored has an invalid value [${this.getBitsStored()}]`);
    }
    if (!this.getBitsAllocated()) {
      throw new Error(`Bits allocated has an invalid value [${this.getBitsAllocated()}]`);
    }
    if (!this.getSamplesPerPixel()) {
      throw new Error(`Sample per pixel has an invalid value [${this.getSamplesPerPixel()}]`);
    }
    if (this.getPixelRepresentation() === undefined) {
      throw new Error(`Pixel representation has an invalid value [${this.getSamplesPerPixel()}]`);
    }
    if (!Object.values(PhotometricInterpretation).includes(this.getPhotometricInterpretation())) {
      throw new Error(
        `Photometric interpretation has an invalid value [${this.getPhotometricInterpretation()}]`
      );
    }
  }

  /**
   * Creates context from DICOM elements.
   * @method
   * @static
   * @param {Object} elements - DICOM elements.
   * @returns {Context} Created context.
   */
  static fromDicomElements(elements) {
    const context = new Context({
      width: elements.Columns,
      height: elements.Rows,
      bitsAllocated: elements.BitsAllocated,
      bitsStored: elements.BitsStored,
      samplesPerPixel: elements.SamplesPerPixel,
      pixelRepresentation: elements.PixelRepresentation,
      planarConfiguration: elements.PlanarConfiguration,
      photometricInterpretation: elements.PhotometricInterpretation,
    });
    if (elements.PlanarConfiguration !== undefined) {
      context.setPlanarConfiguration(elements.PlanarConfiguration);
    }

    return context;
  }

  /**
   * Creates DICOM elements from context.
   * @method
   * @returns {Object} DICOM elements.
   */
  toDicomElements() {
    const elements = {
      Columns: this.getWidth(),
      Rows: this.getHeight(),
      BitsAllocated: this.getBitsAllocated(),
      BitsStored: this.getBitsStored(),
      SamplesPerPixel: this.getSamplesPerPixel(),
      PixelRepresentation: this.getPixelRepresentation(),
      PhotometricInterpretation: this.getPhotometricInterpretation(),
    };
    if (this.getPlanarConfiguration() !== undefined) {
      elements.PlanarConfiguration = this.getPlanarConfiguration();
    }

    return elements;
  }

  /**
   * Gets the context description.
   * @method
   * @return {string} Context description.
   */
  toString() {
    return `Width: ${this.getWidth()}, Height: ${this.getHeight()}, Bits Stored: ${this.getBitsStored()}, Bits Allocated: ${this.getBitsAllocated()}, Samples per Pixel: ${this.getSamplesPerPixel()}, Pixel Representation: ${this.getPixelRepresentation()}, Planar Configuration: ${this.getPlanarConfiguration()}, Photometric Interpretation: ${this.getPhotometricInterpretation()}`;
  }
}
//#endregion

//#region Exports
module.exports = Context;
//#endregion
