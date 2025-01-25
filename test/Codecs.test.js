const { Codec } = require('./../src/Codecs');

const chai = require('chai');
const expect = chai.expect;

describe('Codecs', () => {
  it('should throw in case Codecs methods are not implemented', () => {
    class SubclassedCodec extends Codec {
      constructor() {
        super();
      }
    }
    const subclassedCodec = new SubclassedCodec();

    expect(() => {
      subclassedCodec.encode({}, '', {});
    }).to.throw();
    expect(() => {
      subclassedCodec.decode({}, '', {});
    }).to.throw();
    expect(() => {
      subclassedCodec.getTransferSyntaxUid();
    }).to.throw();
  });
});
