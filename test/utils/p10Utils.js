const {
  Implementation,
  PhotometricInterpretation,
  PixelRepresentation,
  PlanarConfiguration,
  StorageClass,
  TransferSyntax,
} = require('./../../src/Constants');
const { RandomColorImageBuffer, RandomGrayscaleImageBuffer } = require('./randomImage');
const { Frames, FrameConverter } = require('./../../src/Frames');
const Utils = require('./../../src/Utils');

const dcmjs = require('dcmjs');
const { DicomDict, DicomMessage, DicomMetaDictionary, ReadBufferStream } = dcmjs.data;

const chai = require('chai');
const expect = chai.expect;

/**
 * Creates a DICOM Part 10 file from a random grayscale image.
 * @param {number} frames - Number of frames.
 * @param {number} bits - Number of bits per pixel.
 * @param {boolean} signed - Whether the pixel data is signed.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @param {Object} writeOptions - Write options.
 * @returns {ArrayBuffer} - DICOM Part 10 file.
 */
function createDicomPart10FromGrayscaleRandomImage(
  frames,
  bits,
  signed,
  width,
  height,
  writeOptions = {}
) {
  const randomImage = new RandomGrayscaleImageBuffer(bits, signed, width, height);

  const pixelDataArrayBuffers = [];
  for (let i = 0; i < frames; i++) {
    randomImage.random();
    const byteBuffer = randomImage.getByteBuffer();
    pixelDataArrayBuffers.push(
      byteBuffer.buffer.slice(byteBuffer.byteOffset, byteBuffer.byteOffset + byteBuffer.byteLength)
    );
  }
  const combinedPixelDataArrayBuffer = Utils.concatBuffers(pixelDataArrayBuffers);

  const elements = {
    _meta: {
      FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
      ImplementationClassUID: Implementation.ImplementationClassUid,
      ImplementationVersionName: Implementation.ImplementationVersion,
      MediaStorageSOPClassUID: StorageClass.SecondaryCaptureImageStorage,
      MediaStorageSOPInstanceUID: DicomMetaDictionary.uid(),
      TransferSyntaxUID: TransferSyntax.ExplicitVRLittleEndian,
    },
    _vrMap: {
      PixelData: this.bits === 16 ? 'OW' : 'OB',
    },
    BitsAllocated: bits,
    BitsStored: bits,
    Columns: width,
    HighBit: bits - 1,
    NumberOfFrames: frames,
    PhotometricInterpretation: PhotometricInterpretation.Monochrome2,
    PixelData: [combinedPixelDataArrayBuffer],
    PixelRepresentation:
      signed === true ? PixelRepresentation.Signed : PixelRepresentation.Unsigned,
    Rows: height,
    SamplesPerPixel: 1,
  };
  const denaturalizedMetaHeader = DicomMetaDictionary.denaturalizeDataset(elements._meta);
  const dicomDict = new DicomDict(denaturalizedMetaHeader);
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(elements);

  return dicomDict.write(writeOptions);
}

/**
 * Creates a DICOM Part 10 file from a random color image.
 * @param {number} frames - Number of frames.
 * @param {boolean} planar - Whether the pixel data is planar or interleaved.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @param {Object} writeOptions - Write options.
 * @returns {ArrayBuffer} - DICOM Part 10 file.
 */
function createDicomPart10FromColorRandomImage(frames, planar, width, height, writeOptions = {}) {
  const randomImage = new RandomColorImageBuffer(planar, width, height);

  const pixelDataArrayBuffers = [];
  for (let i = 0; i < frames; i++) {
    randomImage.random();
    const byteBuffer = randomImage.getByteBuffer();
    pixelDataArrayBuffers.push(
      byteBuffer.buffer.slice(byteBuffer.byteOffset, byteBuffer.byteOffset + byteBuffer.byteLength)
    );
  }
  const combinedPixelDataArrayBuffer = Utils.concatBuffers(pixelDataArrayBuffers);

  const elements = {
    _meta: {
      FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
      ImplementationClassUID: Implementation.ImplementationClassUid,
      ImplementationVersionName: Implementation.ImplementationVersion,
      MediaStorageSOPClassUID: StorageClass.SecondaryCaptureImageStorage,
      MediaStorageSOPInstanceUID: DicomMetaDictionary.uid(),
      TransferSyntaxUID: TransferSyntax.ExplicitVRLittleEndian,
    },
    _vrMap: {
      PixelData: 'OB',
    },
    BitsAllocated: 8,
    BitsStored: 8,
    Columns: width,
    HighBit: 7,
    NumberOfFrames: frames,
    PhotometricInterpretation: PhotometricInterpretation.Rgb,
    PixelData: [combinedPixelDataArrayBuffer],
    PixelRepresentation: PixelRepresentation.Unsigned,
    PlanarConfiguration: planar ? PlanarConfiguration.Planar : PlanarConfiguration.Interleaved,
    Rows: height,
    SamplesPerPixel: 3,
  };
  const denaturalizedMetaHeader = DicomMetaDictionary.denaturalizeDataset(elements._meta);
  const dicomDict = new DicomDict(denaturalizedMetaHeader);
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(elements);

  return dicomDict.write(writeOptions);
}

/**
 * Compares DICOM Part 10 files.
 * @param {ArrayBuffer} lPart10ArrayBuffer - Left DICOM Part 10 file.
 * @param {ArrayBuffer} rPart10ArrayBuffer - Right DICOM Part 10 file.
 */
function compareDicomPart10(lPart10ArrayBuffer, rPart10ArrayBuffer) {
  const lDicomDict = DicomMessage.readFile(lPart10ArrayBuffer);
  const lElements = DicomMetaDictionary.naturalizeDataset(lDicomDict.dict);

  const rDicomDict = DicomMessage.readFile(rPart10ArrayBuffer);
  const rElements = DicomMetaDictionary.naturalizeDataset(rDicomDict.dict);

  compareDicomElements(lElements, rElements);
}

/**
 * Compares DICOM datasets.
 * @param {ArrayBuffer} lDatasetArrayBuffer - Left DICOM dataset.
 * @param {string} lDatasetTransferSyntax - Left DICOM dataset transfer syntax.
 * @param {ArrayBuffer} rDatasetArrayBuffer - Right DICOM dataset.
 * @param {string} rDatasetTransferSyntax - Right DICOM dataset transfer syntax.
 */
function compareDicomDataset(
  lDatasetArrayBuffer,
  lDatasetTransferSyntax,
  rDatasetArrayBuffer,
  rDatasetTransferSyntax
) {
  const lStream = new ReadBufferStream(lDatasetArrayBuffer);
  const lSyntaxTypeToDecode =
    lDatasetTransferSyntax === TransferSyntax.ImplicitVRLittleEndian
      ? TransferSyntax.ImplicitVRLittleEndian
      : lDatasetTransferSyntax === TransferSyntax.ExplicitVRBigEndian
        ? TransferSyntax.ExplicitVRBigEndian
        : TransferSyntax.ExplicitVRLittleEndian;
  const lDenaturalizedDataset = DicomMessage._read(lStream, lSyntaxTypeToDecode);
  const lElements = DicomMetaDictionary.naturalizeDataset(lDenaturalizedDataset);

  const rStream = new ReadBufferStream(rDatasetArrayBuffer);
  const rSyntaxTypeToDecode =
    rDatasetTransferSyntax === TransferSyntax.ImplicitVRLittleEndian
      ? TransferSyntax.ImplicitVRLittleEndian
      : rDatasetTransferSyntax === TransferSyntax.ExplicitVRBigEndian
        ? TransferSyntax.ExplicitVRBigEndian
        : TransferSyntax.ExplicitVRLittleEndian;
  const rDenaturalizedDataset = DicomMessage._read(rStream, rSyntaxTypeToDecode);
  const rElements = DicomMetaDictionary.naturalizeDataset(rDenaturalizedDataset);

  compareDicomElements(lElements, rElements);
}

/**
 * Compares DICOM elements.
 * @param {Object} lElements - Left DICOM elements.
 * @param {Object} rElements - Right DICOM elements.
 */
function compareDicomElements(lElements, rElements) {
  expect(lElements.Columns).to.be.eq(rElements.Columns);
  expect(lElements.Rows).to.be.eq(rElements.Rows);
  expect(lElements.BitsAllocated).to.be.eq(rElements.BitsAllocated);
  expect(lElements.BitsStored).to.be.eq(rElements.BitsStored);
  expect(lElements.SamplesPerPixel).to.be.eq(rElements.SamplesPerPixel);
  expect(lElements.PhotometricInterpretation).to.be.eq(rElements.PhotometricInterpretation);
  expect(lElements.NumberOfFrames).to.be.eq(rElements.NumberOfFrames);

  let shouldReconfigurePlanar = false;
  if (lElements.PlanarConfiguration !== undefined) {
    if (lElements.PlanarConfiguration !== rElements.PlanarConfiguration) {
      shouldReconfigurePlanar = true;
    }
  }

  const lPixelData = lElements.PixelData;
  const rPixelData = rElements.PixelData;

  expect(lPixelData).not.to.be.undefined;
  expect(rPixelData).not.to.be.undefined;
  expect(lPixelData.length).to.be.eq(rPixelData.length);

  const lFrames = new Frames(lElements, TransferSyntax.ExplicitVRLittleEndian);
  const rFrames = new Frames(rElements, TransferSyntax.ExplicitVRLittleEndian);
  const numberOfFrames = lFrames.getNumberOfFrames();
  for (let i = 0; i < numberOfFrames; i++) {
    const lFrameData = lFrames.getFrameBuffer(i);
    let rFrameData = rFrames.getFrameBuffer(i);
    if (shouldReconfigurePlanar) {
      rFrameData = FrameConverter.changePlanarConfiguration(
        rFrameData,
        rElements.BitsAllocated,
        rElements.SamplesPerPixel,
        rElements.PlanarConfiguration
      );
    }

    expect(lFrameData.length).to.be.eq(rFrameData.length);
    expect(lFrameData).to.deep.equal(rFrameData);
  }
}

module.exports = {
  compareDicomDataset,
  compareDicomPart10,
  createDicomPart10FromColorRandomImage,
  createDicomPart10FromGrayscaleRandomImage,
};
