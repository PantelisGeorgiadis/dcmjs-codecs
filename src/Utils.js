const dcmjs = require('dcmjs');
const { DicomMetaDictionary } = dcmjs.data;

//#region Utils
class Utils {
  /**
   * Concatenates an array of ArrayBuffer or Uint8Array.
   * @method
   * @static
   * @param {Array<ArrayBuffer|Uint8Array>} buffers - Array of ArrayBuffer or Uint8Array.
   * @returns {ArrayBuffer|Uint8Array} Concatenated ArrayBuffer or Uint8Array.
   */
  static concatBuffers(buffers) {
    buffers = Array.isArray(buffers) ? buffers : [buffers];
    const areArrayBuffers = buffers.every((buffer) => buffer instanceof ArrayBuffer);

    let length = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      length += areArrayBuffers ? buffer.byteLength : buffer.length;
    }

    let index = 0;
    const output = new Uint8Array(length);
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      output.set(areArrayBuffers ? new Uint8Array(buffer) : buffer, index);
      index += areArrayBuffers ? buffer.byteLength : buffer.length;
    }

    return areArrayBuffers ? output.buffer : output;
  }

  /**
   * Generates a UUID-derived UID.
   * @method
   * @static
   * @returns {string} UUID-derived UID.
   */
  static generateDerivedUid() {
    return DicomMetaDictionary.uid();
  }
}
//#endregion

//#region Exports
module.exports = Utils;
//#endregion
