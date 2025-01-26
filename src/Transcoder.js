const {
  Implementation,
  StorageClass,
  TranscodeMap,
  TransferSyntax,
} = require('./../src/Constants');
const { Codec } = require('./../src/Codecs');

const dcmjs = require('dcmjs');
const { DicomDict, DicomMessage, DicomMetaDictionary, ReadBufferStream, WriteBufferStream } =
  dcmjs.data;
const dcmjsLog = dcmjs.log;

//#region Transcoder
class Transcoder {
  /**
   * Creates an instance of Transcoder.
   * @constructor
   * @param {Object|ArrayBuffer} [elementsOrBuffer] - Dataset elements as object or encoded as a DICOM dataset buffer.
   * @param {string} [transferSyntaxUid] - Dataset transfer syntax.
   * @param {Object} [readOptions] - The read options to pass through to `DicomMessage._read()`.
   */
  constructor(elementsOrBuffer, transferSyntaxUid, readOptions = {}) {
    const baseOptions = { ignoreErrors: true };
    readOptions = { ...baseOptions, ...readOptions };

    dcmjsLog.level = 'error';

    this.transferSyntaxUid = transferSyntaxUid || TransferSyntax.ImplicitVRLittleEndian;
    if (elementsOrBuffer instanceof ArrayBuffer) {
      if (transferSyntaxUid) {
        this._fromElementsBuffer(elementsOrBuffer, transferSyntaxUid, readOptions);
      } else {
        this._fromP10Buffer(elementsOrBuffer);
      }
      return;
    }

    this.elements = elementsOrBuffer || {};
  }

  /**
   * Transcodes the provided DICOM elements to a new transfer syntax UID.
   * @method
   * @param {string} newTransferSyntaxUid - New transfer syntax UID.
   * @param {Object} [parameters] - Encoding and decoding parameters.
   * @param {number} [parameters.quality] - JPEG quality (encoding).
   * @param {number} [parameters.allowedLossyError] - JPEG-LS allowed lossy error (encoding).
   * @param {number} [parameters.progressionOrder] - JPEG 2000 progression order (encoding).
   * @param {number} [parameters.rate] - JPEG 2000 compression rate (encoding).
   * @throws Error if new transfer syntax UID is not provided or not supported or
   * bits allocated value is not supported.
   */
  transcode(newTransferSyntaxUid, parameters = {}) {
    if (!newTransferSyntaxUid) {
      throw new Error('New transfer syntax UID is required');
    }

    let oldTransferSyntaxUid = this.getTransferSyntaxUid();
    if (oldTransferSyntaxUid === newTransferSyntaxUid) {
      return;
    }

    const oldSyntaxMapItem = TranscodeMap.find((item) => item.syntax === oldTransferSyntaxUid);
    const newSyntaxMapItem = TranscodeMap.find((item) => item.syntax === newTransferSyntaxUid);
    if (!oldSyntaxMapItem || !newSyntaxMapItem) {
      throw new Error(
        `A transfer syntax transcoding from ${oldTransferSyntaxUid} to ${newTransferSyntaxUid} is currently not supported`
      );
    }

    if (oldSyntaxMapItem.encapsulated && newSyntaxMapItem.encapsulated) {
      this.transcode(TransferSyntax.ExplicitVRLittleEndian, parameters);
      oldTransferSyntaxUid = TransferSyntax.ExplicitVRLittleEndian;
    }

    if (this._getElement('PixelData')) {
      const bitsAllocated = this._getElement('BitsAllocated');
      if (bitsAllocated !== 8 && bitsAllocated !== 16) {
        throw new Error(
          `Transcoding is supported for 8 and 16 bits allocated [bits: ${bitsAllocated}]`
        );
      }

      let updatedElements = this.getElements();
      if (oldSyntaxMapItem.encapsulated || oldSyntaxMapItem.bigEndian) {
        const codec = Codec.getCodec(oldTransferSyntaxUid);
        updatedElements = codec.decode(updatedElements, oldTransferSyntaxUid, parameters);
      }
      if (newSyntaxMapItem.encapsulated || newSyntaxMapItem.bigEndian) {
        const codec = Codec.getCodec(newTransferSyntaxUid);
        updatedElements = codec.encode(updatedElements, oldTransferSyntaxUid, parameters);
      }

      this.elements = updatedElements;
    }

    this.transferSyntaxUid = newTransferSyntaxUid;
  }

  /**
   * Gets DICOM transfer syntax UID.
   * @method
   * @returns {string} Transfer syntax UID.
   */
  getTransferSyntaxUid() {
    return this.transferSyntaxUid;
  }

  /**
   * Gets all elements.
   * @method
   * @returns {Object} Elements.
   */
  getElements() {
    return this.elements;
  }

  /**
   * Gets elements encoded in a DICOM dataset buffer.
   * @method
   * @param {Object} [writeOptions] - The write options to pass through to `DicomMessage.write()`.
   * @param {Object} [nameMap] - Additional DICOM tags to recognize when denaturalizing the dataset.
   * @returns {ArrayBuffer} DICOM dataset buffer.
   */
  getDicomDataset(writeOptions, nameMap) {
    const baseOptions = { fragmentMultiframe: false };
    writeOptions = { ...baseOptions, ...writeOptions };

    const denaturalizedDataset = nameMap
      ? DicomMetaDictionary.denaturalizeDataset(this.getElements(), {
          ...DicomMetaDictionary.nameMap,
          ...nameMap,
        })
      : DicomMetaDictionary.denaturalizeDataset(this.getElements());

    const stream = new WriteBufferStream();
    DicomMessage.write(denaturalizedDataset, stream, this.transferSyntaxUid, writeOptions);

    return stream.getBuffer();
  }

  /**
   * Gets elements encoded in a DICOM part10 buffer.
   * @method
   * @param {Object} [writeOptions] - The write options to pass through to `DicomMessage.write()`.
   * @param {Object} [nameMap] - Additional DICOM tags to recognize when denaturalizing the dataset.
   * @returns {ArrayBuffer} DICOM part10 buffer.
   */
  getDicomPart10(writeOptions, nameMap) {
    const baseOptions = { fragmentMultiframe: false };
    writeOptions = { ...baseOptions, ...writeOptions };

    const elements = {
      _meta: {
        FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
        MediaStorageSOPClassUID:
          this._getElement('SOPClassUID') || StorageClass.SecondaryCaptureImageStorage,
        MediaStorageSOPInstanceUID: this._getElement('SOPInstanceUID') || DicomMetaDictionary.uid(),
        TransferSyntaxUID: this.getTransferSyntaxUid(),
        ImplementationClassUID: Implementation.ImplementationClassUid,
        ImplementationVersionName: Implementation.ImplementationVersion,
      },
      ...this.getElements(),
    };
    const denaturalizedMetaHeader = DicomMetaDictionary.denaturalizeDataset(elements._meta);
    const dicomDict = new DicomDict(denaturalizedMetaHeader);

    dicomDict.dict = nameMap
      ? DicomMetaDictionary.denaturalizeDataset(elements, {
          ...DicomMetaDictionary.nameMap,
          ...nameMap,
        })
      : DicomMetaDictionary.denaturalizeDataset(elements);

    return dicomDict.write(writeOptions);
  }

  //#region Private Methods
  /**
   * Gets element value.
   * @method
   * @private
   * @param {string} tag - Element tag.
   * @returns {string|undefined} Element value or undefined if element doesn't exist.
   */
  _getElement(tag) {
    return this.elements[tag];
  }

  /**
   * Creates a dataset from p10 buffer.
   * @method
   * @private
   * @param {ArrayBuffer} arrayBuffer - p10 array buffer.
   * @param {Object} [readOptions] - The read options to pass through to `DicomMessage.readFile()`.
   * @returns {Dataset} Dataset.
   */
  _fromP10Buffer(arrayBuffer, readOptions) {
    const dicomDict = DicomMessage.readFile(arrayBuffer, readOptions);
    const meta = DicomMetaDictionary.naturalizeDataset(dicomDict.meta);
    const transferSyntaxUid = meta.TransferSyntaxUID;
    const elements = DicomMetaDictionary.naturalizeDataset(dicomDict.dict);

    this.elements = elements;
    this.transferSyntaxUid = transferSyntaxUid;
  }

  /**
   * Loads a dataset from elements only buffer.
   * @method
   * @private
   * @param {ArrayBuffer} arrayBuffer - Elements array buffer.
   * @param {string} transferSyntaxUid - Transfer Syntax UID.
   * @param {Object} [readOptions] - The read options to pass through to `DicomMessage._read()`.
   * @returns {Object} Dataset elements.
   */
  _fromElementsBuffer(arrayBuffer, transferSyntaxUid, readOptions) {
    const stream = new ReadBufferStream(arrayBuffer);
    // Use the proper syntax length (based on transfer syntax UID)
    // since dcmjs doesn't do that internally.
    const syntaxTypeToDecode =
      transferSyntaxUid === TransferSyntax.ImplicitVRLittleEndian
        ? TransferSyntax.ImplicitVRLittleEndian
        : transferSyntaxUid === TransferSyntax.ExplicitVRBigEndian
          ? TransferSyntax.ExplicitVRBigEndian
          : TransferSyntax.ExplicitVRLittleEndian;
    const denaturalizedDataset = DicomMessage._read(stream, syntaxTypeToDecode, readOptions);

    this.elements = DicomMetaDictionary.naturalizeDataset(denaturalizedDataset);
    this.transferSyntaxUid = transferSyntaxUid;
  }
  //#endregion
}
//#endregion

//#region Exports
module.exports = Transcoder;
//#endregion
