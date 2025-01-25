const Utils = require('./../src/Utils');

const chai = require('chai');
const expect = chai.expect;

describe('Utils', () => {
  it('should concatenate multiple Uint8Array buffers', () => {
    const buffer1 = new Uint8Array([1, 2, 3]);
    const buffer2 = new Uint8Array([4, 5, 6]);
    const buffer3 = new Uint8Array([7, 8, 9]);

    const result = Utils.concatBuffers([buffer1, buffer2, buffer3]);
    const expected = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(result).to.deep.equal(expected);
  });

  it('should create at least 100 different DICOM UIDs sequentially', () => {
    const uids = [];
    for (let i = 0; i < 100; i++) {
      const uid = Utils.generateDerivedUid();
      expect(uids).to.not.contain(uid);
      uids.push(uid);
    }
  });
});
