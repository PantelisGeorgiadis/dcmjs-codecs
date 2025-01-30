const {
  Jpeg2000ProgressionOrder,
  JpegSampleFactor,
  PhotometricInterpretation,
  PlanarConfiguration,
  TransferSyntax,
} = require('./Constants');
const { FrameConverter, Frames } = require('./Frames');
const Context = require('./Context');
const NativeCodecs = require('./NativeCodecs');
const Utils = require('./Utils');

//#region Codec
class Codec {
  /**
   * Encodes DICOM image for this transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   * @throws Error if encode is not implemented.
   */
  // eslint-disable-next-line no-unused-vars
  encode(elements, syntax, parameters = {}) {
    throw new Error('encode should be implemented');
  }

  /**
   * Decodes DICOM image for this transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   * @throws Error if decode is not implemented.
   */
  // eslint-disable-next-line no-unused-vars
  decode(elements, syntax, parameters = {}) {
    throw new Error('decode should be implemented');
  }

  /**
   * Creates a codec object based on the transfer syntax UID.
   * @method
   * @static
   * @param {string} transferSyntaxUid - Transfer syntax UID.
   * @returns {Codec} Codec object.
   * @throws Error if transfer syntax UID is not supported.
   */
  static getCodec(transferSyntaxUid) {
    const codecMap = {
      [TransferSyntax.ImplicitVRLittleEndian]: ImplicitVRLittleEndianCodec,
      [TransferSyntax.ExplicitVRLittleEndian]: ExplicitVRLittleEndianCodec,
      [TransferSyntax.ExplicitVRBigEndian]: ExplicitVRBigEndianCodec,
      [TransferSyntax.RleLossless]: RleLosslessCodec,
      [TransferSyntax.JpegBaselineProcess1]: JpegBaselineProcess1Codec,
      [TransferSyntax.JpegLosslessProcess14V1]: JpegLosslessProcess14V1Codec,
      [TransferSyntax.JpegLsLossless]: JpegLsLosslessCodec,
      [TransferSyntax.JpegLsLossy]: JpegLsLossyCodec,
      [TransferSyntax.Jpeg2000Lossless]: Jpeg2000LosslessCodec,
      [TransferSyntax.Jpeg2000Lossy]: Jpeg2000LossyCodec,
      [TransferSyntax.HtJpeg2000Lossless]: HtJpeg2000LosslessCodec,
      [TransferSyntax.HtJpeg2000LosslessRpcl]: HtJpeg2000LosslessRpclCodec,
      [TransferSyntax.HtJpeg2000Lossy]: HtJpeg2000LossyCodec,
    };

    const codec = codecMap[transferSyntaxUid];
    if (!codec) {
      throw new Error(`Codec for transfer syntax UID ${transferSyntaxUid} is not implemented`);
    }

    return new codec();
  }

  //#region Private Methods
  /**
   * Base encoder implementation.
   * @method
   * @private
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {string} encoderFnName - Encoder function name.
   * @param {Object} [parameters] - Encoder or decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  _baseEncodeImpl(elements, syntax, encoderFnName, parameters = {}) {
    const frames = new Frames(elements, syntax);
    const numberOfFrames = frames.getNumberOfFrames();
    const retFramesArrayBuffer = [];
    for (let i = 0; i < numberOfFrames; i++) {
      let frameData = frames.getFrameBuffer(i);

      if (parameters.unpackLow16) {
        frameData = FrameConverter.unpackLow16(frameData);
      }

      if (parameters.convertYbrFullToRgb) {
        frameData = FrameConverter.ybrFullToRgb(frameData);
      }

      if (parameters.convertYbrFull422ToRgb) {
        frameData = FrameConverter.ybrFull422ToRgb(frameData, frames.getWidth());
      }

      if (parameters.updatePlanarConfiguration) {
        frameData = FrameConverter.changePlanarConfiguration(
          frameData,
          elements.BitsAllocated,
          elements.SamplesPerPixel,
          PlanarConfiguration.Planar
        );
      }

      const context = Context.fromDicomElements(elements);
      context.setDecodedBuffer(frameData);

      const retContext = NativeCodecs[encoderFnName](context, parameters);
      let retBuffer = retContext.getEncodedBuffer();
      if (retBuffer.length % 2 !== 0) {
        retBuffer = Utils.concatBuffers([retBuffer, Uint8Array.from([0x00])]);
      }
      retFramesArrayBuffer.push(
        retBuffer.buffer.slice(retBuffer.byteOffset, retBuffer.byteOffset + retBuffer.byteLength)
      );

      Object.assign(elements, retContext.toDicomElements());
    }

    elements._vrMap = {
      PixelData: frames.getBytesAllocated() === 1 ? 'OB' : 'OW',
    };
    elements.PixelData = retFramesArrayBuffer;

    return elements;
  }

  /**
   * Base decoder decoder implementation.
   * @method
   * @private
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {string} decoderFnName - Decoder function name.
   * @param {Object} [parameters] - Encoder or decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  _baseDecodeImpl(elements, syntax, decoderFnName, parameters = {}) {
    const frames = new Frames(elements, syntax);
    const numberOfFrames = frames.getNumberOfFrames();

    const retFramesArrayBuffer = [];
    for (let i = 0; i < numberOfFrames; i++) {
      const frameData = frames.getFrameBuffer(i);
      const context = Context.fromDicomElements(elements);
      context.setEncodedBuffer(frameData);

      const retContext = NativeCodecs[decoderFnName](context, parameters);
      let retBuffer = retContext.getDecodedBuffer();
      if (retBuffer.length % 2 !== 0) {
        retBuffer = Utils.concatBuffers([retBuffer, Uint8Array.from([0x00])]);
      }

      if (parameters.updatePlanarConfiguration) {
        retBuffer = FrameConverter.changePlanarConfiguration(
          retBuffer,
          elements.BitsAllocated,
          elements.SamplesPerPixel,
          PlanarConfiguration.Interleaved
        );
      }

      retFramesArrayBuffer.push(
        retBuffer.buffer.slice(retBuffer.byteOffset, retBuffer.byteOffset + retBuffer.byteLength)
      );

      Object.assign(elements, retContext.toDicomElements());
    }

    elements._vrMap = {
      PixelData: frames.getBytesAllocated() === 1 ? 'OB' : 'OW',
    };
    elements.PixelData = [Utils.concatBuffers(retFramesArrayBuffer)];

    return elements;
  }
  //#endregion
}
//#endregion

//#region ImplicitVRLittleEndianCodec
class ImplicitVRLittleEndianCodec extends Codec {
  /**
   * Encodes DICOM image for ImplicitVRLittleEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  encode(elements, syntax, parameters = {}) {
    return elements;
  }

  /**
   * Decodes DICOM image for ImplicitVRLittleEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  decode(elements, syntax, parameters = {}) {
    return elements;
  }
}
//#endregion

//#region ExplicitVRLittleEndianCodec
class ExplicitVRLittleEndianCodec extends Codec {
  /**
   * Encodes DICOM image for ExplicitVRLittleEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  encode(elements, syntax, parameters = {}) {
    return elements;
  }

  /**
   * Decodes DICOM image for ExplicitVRLittleEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  decode(elements, syntax, parameters = {}) {
    return elements;
  }
}
//#endregion

//#region ExplicitVRBigEndianCodec
class ExplicitVRBigEndianCodec extends Codec {
  /**
   * Encodes DICOM image for ExplicitVRBigEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  encode(elements, syntax, parameters = {}) {
    return this._swapPixelData(elements, syntax);
  }

  /**
   * Decodes DICOM image for ExplicitVRBigEndian transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  // eslint-disable-next-line no-unused-vars
  decode(elements, syntax, parameters = {}) {
    return this._swapPixelData(elements, syntax);
  }

  //#region Private Methods
  /**
   * Swaps pixel data bytes.
   * @method
   * @private
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @returns {Object} Updated DICOM image elements.
   */
  _swapPixelData(elements, syntax) {
    const frames = new Frames(elements, syntax);
    const numberOfFrames = frames.getNumberOfFrames();

    const retFramesArrayBuffer = [];
    for (let i = 0; i < numberOfFrames; i++) {
      const frameData = frames.getFrameBuffer(i);
      if (frames.getBitsAllocated() > 8 && frames.getBitsAllocated() <= 16) {
        for (let i = 0; i < frameData.length; i += 2) {
          const holder = frameData[i];
          frameData[i] = frameData[i + 1];
          frameData[i + 1] = holder;
        }
      }
      retFramesArrayBuffer.push(
        frameData.buffer.slice(frameData.byteOffset, frameData.byteOffset + frameData.byteLength)
      );
    }

    elements._vrMap = {
      PixelData: frames.getBytesAllocated() === 1 ? 'OB' : 'OW',
    };
    elements.PixelData = [Utils.concatBuffers(retFramesArrayBuffer)];

    return elements;
  }
  //#endregion
}
//#endregion

//#region RleLosslessCodec
class RleLosslessCodec extends Codec {
  /**
   * Encodes DICOM image for RleLossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    return this._baseEncodeImpl(elements, syntax, 'encodeRle', parameters);
  }

  /**
   * Decodes DICOM image for RleLossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return this._baseDecodeImpl(elements, syntax, 'decodeRle', parameters);
  }
}
//#endregion

//#region JpegBaseCodec
class JpegBaseCodec extends Codec {
  /**
   * Encodes DICOM image for JPEG transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    const encoderParameters = { ...parameters };

    if (
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrIct ||
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrRct
    ) {
      throw new Error(
        `Photometric Interpretation ${elements.PhotometricInterpretation} not supported by JPEG encoder`
      );
    }

    // Measure original size
    const pixelDataArray = Array.isArray(elements.PixelData)
      ? elements.PixelData
      : [elements.PixelData];
    const oldSize = pixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Handle unpacking of 16-bit data with bits stored less than 8-bits
    if (elements.BitsAllocated === 16 && elements.BitsStored <= 8) {
      encoderParameters.unpackLow16 = true;
    }

    // Handle YBR_FULL_422 photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull422) {
      encoderParameters.convertYbrFull422ToRgb = true;
    }

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      encoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and encoding
    const updatedElements = super._baseEncodeImpl(
      elements,
      syntax,
      'encodeJpeg',
      encoderParameters
    );

    // Update planar configuration
    if (
      encoderParameters.updatePlanarConfiguration !== undefined &&
      encoderParameters.updatePlanarConfiguration
    ) {
      updatedElements.PlanarConfiguration = PlanarConfiguration.Interleaved;
    }

    // Update photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.Rgb) {
      updatedElements.PhotometricInterpretation = PhotometricInterpretation.YbrFull422;
      if (
        encoderParameters.sampleFactor !== undefined &&
        encoderParameters.sampleFactor === JpegSampleFactor.Sf444
      ) {
        updatedElements.PhotometricInterpretation = PhotometricInterpretation.YbrFull;
      }
    }
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull422) {
      updatedElements.PhotometricInterpretation = PhotometricInterpretation.Rgb;
    }

    // Measure new size
    const updatedPixelDataArray = Array.isArray(updatedElements.PixelData)
      ? updatedElements.PixelData
      : [updatedElements.PixelData];
    const newSize = updatedPixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Update lossy compression elements
    if (encoderParameters.lossy !== undefined && encoderParameters.lossy) {
      updatedElements.LossyImageCompressionMethod = 'ISO_10918_1';
      updatedElements.LossyImageCompression = '01';
      updatedElements.LossyImageCompressionRatio = `${(oldSize / newSize).toFixed(3)}`;

      // For lossy compression, update SOP Instance UID
      updatedElements.SOPInstanceUID = Utils.generateDerivedUid();
    }

    return updatedElements;
  }

  /**
   * Decodes DICOM image for JPEG transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    const decoderParameters = { ...parameters };

    // Handle photometric interpretation
    if (elements.PhotometricInterpretation !== PhotometricInterpretation.Rgb) {
      decoderParameters.convertColorspaceToRgb = true;
    }

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      decoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and decoding
    const updatedElements = super._baseDecodeImpl(
      elements,
      syntax,
      'decodeJpeg',
      decoderParameters
    );

    return updatedElements;
  }
}
//#endregion

//#region JpegBaselineProcess1Codec
class JpegBaselineProcess1Codec extends JpegBaseCodec {
  /**
   * Encodes DICOM image for JpegBaselineProcess1 transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = true;
    parameters.predictor = 0;
    parameters.pointTransform = 0;

    if (elements.BitsStored !== 8) {
      throw new Error(
        `Unable to create JpegBaselineProcess1Codec for bits stored ${elements.BitsStored}`
      );
    }

    return super.encode(elements, syntax, parameters);
  }

  /**
   * Decodes DICOM image for JpegBaselineProcess1 transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    parameters.convertColorspaceToRgb = true;

    return super.decode(elements, syntax, parameters);
  }
}
//#endregion

//#region JpegLosslessProcess14V1Codec
class JpegLosslessProcess14V1Codec extends JpegBaseCodec {
  /**
   * Encodes DICOM image for JpegLosslessProcess14V1 transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = false;
    parameters.predictor = 1;
    parameters.pointTransform = 0;

    return super.encode(elements, syntax, parameters);
  }

  /**
   * Decodes DICOM image for JpegLosslessProcess14V1 transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, parameters);
  }
}
//#endregion

//#region JpegLsBaseCodec
class JpegLsBaseCodec extends Codec {
  /**
   * Encodes DICOM image for JPEG-LS transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    const encoderParameters = { ...parameters };

    if (
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrPartial422 ||
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrPartial420
    ) {
      throw new Error(
        `Photometric Interpretation ${elements.PhotometricInterpretation} not supported by JPEG-LS encoder`
      );
    }

    // Measure original size
    const pixelDataArray = Array.isArray(elements.PixelData)
      ? elements.PixelData
      : [elements.PixelData];
    const oldSize = pixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Handle YBR_FULL photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull) {
      encoderParameters.convertYbrFullToRgb = true;
    }

    // Handle YBR_FULL_422 photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull422) {
      encoderParameters.convertYbrFull422ToRgb = true;
    }

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      encoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and encoding
    const updatedElements = super._baseEncodeImpl(
      elements,
      syntax,
      'encodeJpegLs',
      encoderParameters
    );

    // Update planar configuration
    if (
      encoderParameters.updatePlanarConfiguration !== undefined &&
      encoderParameters.updatePlanarConfiguration
    ) {
      updatedElements.PlanarConfiguration = PlanarConfiguration.Interleaved;
    }

    // Measure new size
    const updatedPixelDataArray = Array.isArray(updatedElements.PixelData)
      ? updatedElements.PixelData
      : [updatedElements.PixelData];
    const newSize = updatedPixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Update lossy compression elements
    if (encoderParameters.lossy !== undefined && encoderParameters.lossy) {
      updatedElements.LossyImageCompressionMethod = 'ISO_14495_1';
      updatedElements.LossyImageCompression = '01';
      updatedElements.LossyImageCompressionRatio = `${(oldSize / newSize).toFixed(3)}`;

      // For lossy compression, update SOP Instance UID
      updatedElements.SOPInstanceUID = Utils.generateDerivedUid();
    }

    return updatedElements;
  }

  /**
   * Decodes DICOM image for JPEG-LS transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    const decoderParameters = { ...parameters };

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      decoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and decoding
    const updatedElements = super._baseDecodeImpl(
      elements,
      syntax,
      'decodeJpegLs',
      decoderParameters
    );

    return updatedElements;
  }
}
//#endregion

//#region JpegLsLosslessCodec
class JpegLsLosslessCodec extends JpegLsBaseCodec {
  /**
   * Encodes DICOM image for JpegLsLossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = false;

    return super.encode(elements, syntax, parameters);
  }

  /**
   * Decodes DICOM image for JpegLsLossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, parameters);
  }
}
//#endregion

//#region JpegLsLossyCodec
class JpegLsLossyCodec extends JpegLsBaseCodec {
  /**
   * Encodes DICOM image for JpegLsLossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = true;

    return super.encode(elements, syntax, parameters);
  }

  /**
   * Decodes DICOM image for JpegLsLossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, parameters);
  }
}
//#endregion

//#region Jpeg2000BaseCodec
class Jpeg2000BaseCodec extends Codec {
  /**
   * Encodes DICOM image for JPEG 2000 transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {string} encoderFnName - Encoder function name.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, encoderFnName, parameters = {}) {
    const encoderParameters = { ...parameters };

    if (
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrPartial422 ||
      elements.PhotometricInterpretation === PhotometricInterpretation.YbrPartial420
    ) {
      throw new Error(
        `Photometric Interpretation ${elements.PhotometricInterpretation} not supported by JPEG 2000 encoder`
      );
    }

    // Measure original size
    const pixelDataArray = Array.isArray(elements.PixelData)
      ? elements.PixelData
      : [elements.PixelData];
    const oldSize = pixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Handle YBR_FULL photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull) {
      encoderParameters.convertYbrFullToRgb = true;
    }

    // Handle YBR_FULL_422 photometric interpretation
    if (elements.PhotometricInterpretation === PhotometricInterpretation.YbrFull422) {
      encoderParameters.convertYbrFull422ToRgb = true;
    }

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      encoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and encoding
    const updatedElements = super._baseEncodeImpl(
      elements,
      syntax,
      encoderFnName,
      encoderParameters
    );

    // Update planar configuration
    if (
      encoderParameters.updatePlanarConfiguration !== undefined &&
      encoderParameters.updatePlanarConfiguration
    ) {
      updatedElements.PlanarConfiguration = PlanarConfiguration.Interleaved;
    }

    // Update photometric interpretation
    if (
      elements.PhotometricInterpretation === PhotometricInterpretation.Rgb ||
      elements.PhotometricInterpretation == PhotometricInterpretation.YbrFull ||
      elements.PhotometricInterpretation == PhotometricInterpretation.YbrFull422
    ) {
      if (encoderParameters.allowMct !== undefined && encoderParameters.allowMct) {
        if (encoderParameters.lossy !== undefined && encoderParameters.lossy) {
          updatedElements.PhotometricInterpretation = PhotometricInterpretation.YbrIct;
        } else {
          updatedElements.PhotometricInterpretation = PhotometricInterpretation.YbrRct;
        }
      }
    }

    // Measure new size
    const updatedPixelDataArray = Array.isArray(updatedElements.PixelData)
      ? updatedElements.PixelData
      : [updatedElements.PixelData];
    const newSize = updatedPixelDataArray.reduce((acc, buffer) => acc + buffer.byteLength, 0);

    // Update lossy compression elements
    if (encoderParameters.lossy !== undefined && encoderParameters.lossy) {
      updatedElements.LossyImageCompressionMethod = 'ISO_15444_1';
      updatedElements.LossyImageCompression = '01';
      updatedElements.LossyImageCompressionRatio = `${(oldSize / newSize).toFixed(3)}`;

      // For lossy compression, update SOP Instance UID
      updatedElements.SOPInstanceUID = Utils.generateDerivedUid();
    }

    return updatedElements;
  }

  /**
   * Decodes DICOM image for JPEG 2000 transfer syntaxes.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {string} decoderFnName - Decoder function name.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, decoderFnName, parameters = {}) {
    const decoderParameters = { ...parameters };

    // Handle planar configuration
    if (
      elements.PlanarConfiguration === PlanarConfiguration.Planar &&
      elements.SamplesPerPixel > 1
    ) {
      if (elements.SamplesPerPixel !== 3 || elements.BitsStored > 8) {
        throw new Error(
          'Planar reconfiguration only implemented for SamplesPerPixel = 3 and BitsStored <= 8'
        );
      }
      decoderParameters.updatePlanarConfiguration = true;
    }

    // Perform pixel transformation and decoding
    const updatedElements = super._baseDecodeImpl(
      elements,
      syntax,
      decoderFnName,
      decoderParameters
    );

    // Handle photo interpretation
    if (
      updatedElements.PhotometricInterpretation == PhotometricInterpretation.YbrIct ||
      updatedElements.PhotometricInterpretation == PhotometricInterpretation.YbrRct
    ) {
      updatedElements.PhotometricInterpretation = PhotometricInterpretation.Rgb;
    }
    if (
      updatedElements.PhotometricInterpretation == PhotometricInterpretation.YbrFull422 ||
      updatedElements.PhotometricInterpretation == PhotometricInterpretation.YbrPartial422 ||
      updatedElements.PhotometricInterpretation == PhotometricInterpretation.YbrFull
    ) {
      updatedElements.PhotometricInterpretation = PhotometricInterpretation.Rgb;
    }

    return updatedElements;
  }
}
//#endregion

//#region Jpeg2000LosslessCodec
class Jpeg2000LosslessCodec extends Jpeg2000BaseCodec {
  /**
   * Encodes DICOM image for Jpeg2000Lossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = false;

    return super.encode(elements, syntax, 'encodeJpeg2000', parameters);
  }

  /**
   * Decodes DICOM image for Jpeg2000Lossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, 'decodeJpeg2000', parameters);
  }
}
//#endregion

//#region Jpeg2000LossyCodec
class Jpeg2000LossyCodec extends Jpeg2000BaseCodec {
  /**
   * Encodes DICOM image for Jpeg2000Lossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = true;

    return super.encode(elements, syntax, 'encodeJpeg2000', parameters);
  }

  /**
   * Decodes DICOM image for Jpeg2000Lossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, 'decodeJpeg2000', parameters);
  }
}
//#endregion

//#region HtJpeg2000LosslessCodec
class HtJpeg2000LosslessCodec extends Jpeg2000BaseCodec {
  /**
   * Encodes DICOM image for HtJpeg2000Lossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = false;

    return super.encode(elements, syntax, 'encodeHtJpeg2000', parameters);
  }

  /**
   * Decodes DICOM image for HtJpeg2000Lossless transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, 'decodeHtJpeg2000', parameters);
  }
}
//#endregion

//#region HtJpeg2000LosslessRpclCodec
class HtJpeg2000LosslessRpclCodec extends Jpeg2000BaseCodec {
  /**
   * Encodes DICOM image for HtJpeg2000LosslessRpcl transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = false;
    parameters.progressionOrder = Jpeg2000ProgressionOrder.Rpcl;

    return super.encode(elements, syntax, 'encodeHtJpeg2000', parameters);
  }

  /**
   * Decodes DICOM image for HtJpeg2000LosslessRpcl transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, 'decodeHtJpeg2000', parameters);
  }
}
//#endregion

//#region HtJpeg2000LossyCodec
class HtJpeg2000LossyCodec extends Jpeg2000BaseCodec {
  /**
   * Encodes DICOM image for HtJpeg2000Lossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  encode(elements, syntax, parameters = {}) {
    parameters.lossy = true;

    return super.encode(elements, syntax, 'encodeHtJpeg2000', parameters);
  }

  /**
   * Decodes DICOM image for HtJpeg2000Lossy transfer syntax.
   * @method
   * @param {Object} elements - DICOM image elements.
   * @param {string} syntax - DICOM image elements transfer syntax UID.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Object} Updated DICOM image elements.
   */
  decode(elements, syntax, parameters = {}) {
    return super.decode(elements, syntax, 'decodeHtJpeg2000', parameters);
  }
}
//#endregion

//#region Exports
module.exports = {
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
