const {
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  TranscodeMap,
  TransferSyntax,
} = require('./Constants');
const Utils = require('./Utils');

//#region Frames
class Frames {
  /**
   * Creates an instance of Frames.
   * @constructor
   * @param {Object} elements - DICOM image elements.
   * @param {string} transferSyntaxUid - Transfer Syntax UID.
   */
  constructor(elements, transferSyntaxUid) {
    this.transferSyntaxUid = transferSyntaxUid;
    this.frames = elements.NumberOfFrames || 1;
    this.width = elements.Columns;
    this.height = elements.Rows;
    this.bitsAllocated = elements.BitsAllocated || 0;
    this.bitsStored = elements.BitsStored || this.bitsAllocated;
    this.highBit = elements.HighBit || this.bitsStored - 1;
    this.samplesPerPixel = elements.SamplesPerPixel || 1;
    this.pixelRepresentation = elements.PixelRepresentation || PixelRepresentation.Unsigned;
    this.planarConfiguration = elements.PlanarConfiguration || PlanarConfiguration.Interleaved;
    const photometricInterpretation = elements.PhotometricInterpretation;
    this.photometricInterpretation = photometricInterpretation
      ? photometricInterpretation.replace(/[^ -~]+/g, '').trim()
      : '';
    this.pixelData = elements.PixelData;
  }

  /**
   * Gets the transfer syntax UID.
   * @method
   * @returns {string} Transfer syntax UID.
   */
  getTransferSyntaxUid() {
    return this.transferSyntaxUid;
  }

  /**
   * Gets the number of frames.
   * @method
   * @returns {number} Number of frames.
   */
  getNumberOfFrames() {
    return this.frames;
  }

  /**
   * Gets the image width.
   * @method
   * @returns {number} Width.
   */
  getWidth() {
    return this.width;
  }

  /**
   * Gets the image height.
   * @method
   * @returns {number} Height.
   */
  getHeight() {
    return this.height;
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
   * Gets the bits allocated.
   * @method
   * @returns {number} Bits allocated.
   */
  getBitsAllocated() {
    return this.bitsAllocated;
  }

  /**
   * Gets the bytes allocated.
   * @method
   * @returns {number} Bytes allocated.
   */
  getBytesAllocated() {
    let bytes = this.getBitsAllocated() / 8;
    if (this.getBitsAllocated() % 8 > 0) {
      bytes++;
    }

    return bytes;
  }

  /**
   * Gets the high bits.
   * @method
   * @returns {number} High bit.
   */
  getHighBit() {
    return this.highBit;
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
   * Gets the pixel representation.
   * @method
   * @returns {PixelRepresentation} Pixel representation.
   */
  getPixelRepresentation() {
    return this.pixelRepresentation;
  }

  /**
   * Checks whether the pixels are comprised of signed values.
   * @method
   * @returns {boolean} Whether the pixels are comprised of signed values.
   */
  isSigned() {
    return this.getPixelRepresentation() !== PixelRepresentation.Unsigned;
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
   * Checks whether the pixels configuration is planar.
   * @method
   * @returns {boolean} Whether the pixels configuration is planar.
   */
  isPlanar() {
    return this.getPlanarConfiguration() !== PlanarConfiguration.Interleaved;
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
   * Gets the pixel data.
   * @method
   * @returns {Array<ArrayBuffer>} Pixel data.
   */
  getPixelData() {
    return this.pixelData;
  }

  /**
   * Gets the uncompressed frame size.
   * @method
   * @returns {number} Uncompressed frame size.
   */
  getUncompressedFrameSize() {
    if (this.getBitsAllocated() === 1) {
      return Math.trunc((this.getWidth() * this.getHeight() - 1) / 8 + 1);
    }
    if (this.getPhotometricInterpretation() === PhotometricInterpretation.YbrFull422) {
      const syntax = this.getTransferSyntaxUid();
      if (
        syntax === TransferSyntax.ImplicitVRLittleEndian ||
        syntax === TransferSyntax.ExplicitVRLittleEndian ||
        syntax === TransferSyntax.ExplicitVRBigEndian
      ) {
        return this.getBytesAllocated() * 2 * this.getWidth() * this.getHeight();
      }
    }

    return (
      this.getWidth() * this.getHeight() * this.getBytesAllocated() * this.getSamplesPerPixel()
    );
  }

  /**
   * Gets the frame data of the desired frame as an array of unsigned byte values.
   * @method
   * @param {number} frame - Frame index.
   * @returns {Uint8Array} Frame data as an array of unsigned byte values.
   * @throws {Error} If requested frame is out of range, pixel data could not be extracted,
   * width/height/bits allocated/stored/photometric interpretation has an invalid value or
   * transfer syntax cannot be currently decoded.
   */
  getFrameBuffer(frame) {
    if (frame < 0 || frame >= this.getNumberOfFrames()) {
      throw new Error(`Requested frame is out of range [${frame}]`);
    }
    if (!this.getPixelData()) {
      throw new Error('Could not extract pixel data');
    }
    if (!this.getWidth() || !this.getHeight()) {
      throw new Error(
        `Width/height has an invalid value [w: ${this.getWidth()}, h: ${this.getHeight()}]`
      );
    }
    if (!this.getBitsAllocated() || !this.getBitsStored()) {
      throw new Error(
        `Bits allocated/stored has an invalid value [allocated: ${this.getBitsAllocated()}, stored: ${this.getBitsStored()}]`
      );
    }
    if (!this.getPhotometricInterpretation()) {
      throw new Error(
        `Photometric interpretation has an invalid value [${this.getPhotometricInterpretation()}]`
      );
    }

    const pixelBuffers = this.getPixelData();
    if (!pixelBuffers) {
      throw new Error('Pixel data could not be extracted');
    }

    const syntaxMapItem = TranscodeMap.find((item) => item.syntax === this.getTransferSyntaxUid());
    if (!syntaxMapItem) {
      throw new Error(
        `Transfer syntax is not currently supported [syntax: ${this.getTransferSyntaxUid()}]`
      );
    }

    if (!syntaxMapItem.encapsulated) {
      const frameSize = this.getUncompressedFrameSize();
      const frameOffset = frameSize * frame;
      // Take the first buffer from pixel buffers and extract the current frame data
      let pixelBuffer = new Uint8Array(
        Array.isArray(pixelBuffers) ? pixelBuffers.find((o) => o) : pixelBuffers
      );
      return pixelBuffer.slice(frameOffset, frameOffset + frameSize);
    } else {
      return this._getFrameFragments(pixelBuffers, frame);
    }
  }

  /**
   * Gets the frames description.
   * @method
   * @returns {string} Frames description.
   */
  toString() {
    const str = [];
    str.push(`Pixel Data: ${this.getTransferSyntaxUid()}`);
    str.push(`    Photometric Interpretation: ${this.getPhotometricInterpretation()}`);
    str.push(
      `    Bits Allocated: ${this.getBitsAllocated()};  Stored: ${this.getBitsStored()};  High: ${this.getHighBit()};  Signed: ${
        this.isSigned() ? 'True' : 'False'
      }`
    );
    str.push(
      `    Width: ${this.getWidth()};  Height: ${this.getHeight()};  Frames: ${this.getNumberOfFrames()}`
    );

    return str.join('\n');
  }

  //#region Private Methods
  /**
   * Gets the frame fragments data.
   * @method
   * @private
   * @param {number} pixelBuffers - Pixel data buffers.
   * @param {number} frame - Frame index.
   * @returns {Uint8Array} Frame data as an array of unsigned byte values.
   * @throws {Error} If there are no fragmented pixel data or requested frame
   * is larger or equal to the pixel fragments number.
   */
  _getFrameFragments(pixelBuffers, frame) {
    if (pixelBuffers.length === 0) {
      throw new Error('No fragmented pixel data');
    }
    if (frame >= pixelBuffers.length) {
      throw new Error(
        `Requested frame is larger or equal to the pixel fragments number [frame: (${frame}), fragments: ${pixelBuffers.length}]`
      );
    }
    if (this.getNumberOfFrames() === 1) {
      return new Uint8Array(Utils.concatBuffers(pixelBuffers));
    }
    if (pixelBuffers.length === this.getNumberOfFrames()) {
      return new Uint8Array(pixelBuffers[frame]);
    }

    throw new Error('Multiple fragments per frame is not yet implemented');
  }
  //#endregion
}
//#endregion

//#region FrameConverter
class FrameConverter {
  /**
   * Converts pixel planar configuration.
   * @method
   * @static
   * @param {Uint8Array} pixelData - Pixel data.
   * @param {number} bitsAllocated - Bits allocated.
   * @param {number} samplesPerPixel - Samples per pixel.
   * @param {number} oldPlanarConfiguration - Current planar configuration.
   * @returns {Uint8Array} Pixel data with converted planar configuration.
   * @throws {Error} If bits allocated is not supported.
   */
  static changePlanarConfiguration(
    pixelData,
    bitsAllocated,
    samplesPerPixel,
    oldPlanarConfiguration
  ) {
    const bytesAllocated = bitsAllocated / 8;
    if (bytesAllocated !== 1) {
      throw new Error(
        `Unsupported bits allocated for changing planar configuration: ${bitsAllocated}`
      );
    }

    const numPixels = pixelData.length / samplesPerPixel;
    const newPixelData = new Uint8Array(pixelData.length);

    if (oldPlanarConfiguration === PlanarConfiguration.Planar) {
      for (let n = 0; n < numPixels; ++n) {
        for (let s = 0; s < samplesPerPixel; ++s) {
          newPixelData[n * samplesPerPixel + s] = pixelData[n + numPixels * s];
        }
      }
    } else {
      for (let n = 0; n < numPixels; ++n) {
        for (let s = 0; s < samplesPerPixel; ++s) {
          newPixelData[n + numPixels * s] = pixelData[n * samplesPerPixel + s];
        }
      }
    }

    return newPixelData;
  }

  /**
   * Converts YBR_FULL photometric interpretation pixels to RGB.
   * @method
   * @static
   * @param {Uint8Array} data - Array of YBR_FULL photometric interpretation pixels.
   * @returns {Uint8Array} Array of pixel data in RGB photometric interpretation.
   */
  static ybrFullToRgb(data) {
    const output = new Uint8Array(data.length);
    for (let n = 0; n < data.length; n += 3) {
      const y = data[n];
      const b = data[n + 1];
      const r = data[n + 2];

      output[n] = this._truncAndClamp(y + 1.402 * (r - 128) + 0.5, 0x00, 0xff);
      output[n + 1] = this._truncAndClamp(
        y - 0.3441 * (b - 128) - 0.7141 * (r - 128) + 0.5,
        0x00,
        0xff
      );
      output[n + 2] = this._truncAndClamp(y + 1.772 * (b - 128) + 0.5, 0x00, 0xff);
    }

    return output;
  }

  /**
   * Converts YBR_FULL_422 photometric interpretation pixels to RGB.
   * @method
   * @static
   * @param {Uint8Array} data - Array of YBR_FULL_422 photometric interpretation pixels.
   * @param {number} width - Image width.
   * @returns {Uint8Array} Array of pixel data in RGB photometric interpretation.
   */
  static ybrFull422ToRgb(data, width) {
    const output = new Uint8Array(Math.trunc((data.length / 4) * 2 * 3));
    for (let n = 0, p = 0, col = 0; n < data.length; ) {
      const y1 = data[n++];
      const y2 = data[n++];
      const cb = data[n++];
      const cr = data[n++];

      output[p++] = this._truncAndClamp(y1 + 1.402 * (cr - 128) + 0.5, 0x00, 0xff);
      output[p++] = this._truncAndClamp(
        y1 - 0.3441 * (cb - 128) - 0.7141 * (cr - 128) + 0.5,
        0x00,
        0xff
      );
      output[p++] = this._truncAndClamp(y1 + 1.772 * (cb - 128) + 0.5, 0x00, 0xff);

      if (++col === width) {
        col = 0;
        continue;
      }

      output[p++] = this._truncAndClamp(y2 + 1.402 * (cr - 128) + 0.5, 0x00, 0xff);
      output[p++] = this._truncAndClamp(
        y2 - 0.3441 * (cb - 128) - 0.7141 * (cr - 128) + 0.5,
        0x00,
        0xff
      );
      output[p++] = this._truncAndClamp(y2 + 1.772 * (cb - 128) + 0.5, 0x00, 0xff);

      if (++col === width) {
        col = 0;
      }
    }

    return output;
  }

  /**
   * Converts YBR_PARTIAL_422 photometric interpretation pixels to RGB.
   * @method
   * @static
   * @param {Uint8Array} data - Array of YBR_PARTIAL_422 photometric interpretation pixels.
   * @param {number} width - Image width.
   * @returns {Uint8Array} Array of pixel data in RGB photometric interpretation.
   */
  static ybrPartial422ToRgb(data, width) {
    const output = new Uint8Array(Math.trunc((data.length / 4) * 2 * 3));
    for (let n = 0, p = 0, col = 0; n < data.length; ) {
      const y1 = data[n++];
      const y2 = data[n++];
      const cb = data[n++];
      const cr = data[n++];

      output[p++] = this._truncAndClamp(1.1644 * (y1 - 16) + 1.596 * (cr - 128) + 0.5, 0x00, 0xff);
      output[p++] = this._truncAndClamp(
        1.1644 * (y1 - 16) - 0.3917 * (cb - 128) - 0.813 * (cr - 128) + 0.5,
        0x00,
        0xff
      );
      output[p++] = this._truncAndClamp(1.1644 * (y1 - 16) + 2.0173 * (cb - 128) + 0.5, 0x00, 0xff);

      if (++col === width) {
        col = 0;
        continue;
      }

      output[p++] = this._truncAndClamp(1.1644 * (y2 - 16) + 1.596 * (cr - 128) + 0.5, 0x00, 0xff);
      output[p++] = this._truncAndClamp(
        1.1644 * (y2 - 16) - 0.3917 * (cb - 128) - 0.813 * (cr - 128) + 0.5,
        0x00,
        0xff
      );
      output[p++] = this._truncAndClamp(1.1644 * (y2 - 16) + 2.0173 * (cb - 128) + 0.5, 0x00, 0xff);

      if (++col === width) {
        col = 0;
      }
    }

    return output;
  }

  /**
   * Unpacks every second byte from the input data, starting from the low byte.
   * @method
   * @static
   * @param {Uint8Array} data - The input data.
   * @returns {Uint8Array} The unpacked data.
   */
  static unpackLow16(data) {
    const bytes = new Uint8Array(data.length / 2);
    for (let i = 0; i < bytes.length && i * 2 < data.length; i++) {
      bytes[i] = data[i * 2];
    }
    return bytes;
  }

  /**
   * Unpacks every second byte from the input data, starting from the high byte.
   * @method
   * @static
   * @param {Uint8Array} data - The input data.
   * @returns {Uint8Array} The unpacked data.
   */
  static unpackHigh16(data) {
    const bytes = new Uint8Array(data.length / 2);
    for (let i = 0; i < bytes.length && i * 2 + 1 < data.length; i++) {
      bytes[i] = data[i * 2 + 1];
    }
    return bytes;
  }

  //#region Private Methods
  /**
   * Truncates and clamps value between min and max.
   * @method
   * @static
   * @private
   * @param {number} value - Original value.
   * @param {number} min - Minimum value.
   * @param {number} max - Maximum value.
   * @returns {number} Clamped value.
   */
  static _truncAndClamp(value, min, max) {
    return Math.min(Math.max(Math.trunc(value), min), max);
  }
  //#endregion
}
//#endregion

//#region Exports
module.exports = {
  FrameConverter,
  Frames,
};
//#endregion
