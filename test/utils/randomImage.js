class RandomGrayscaleImageBuffer {
  constructor(bits, signed, width, height) {
    if (width < 1) {
      throw new Error('Width should be larger than one pixel');
    }
    if (height < 1) {
      throw new Error('Height should be larger than one pixel');
    }
    if (bits != 8 && bits != 16) {
      throw new Error('Bits should be 8 or 16');
    }
    if (bits === 8 && signed === true) {
      throw new Error('Signed should be used with 16 bits');
    }

    this.bits = bits;
    this.signed = signed;
    this.width = width;
    this.height = height;

    this.min = this.signed ? -Math.pow(2, this.bits - 1) : 0;
    this.max = this.signed ? Math.pow(2, this.bits - 1) - 1 : Math.pow(2, this.bits) - 1;

    this.buffer =
      bits === 16
        ? signed === true
          ? new Int16Array(width * height)
          : new Uint16Array(width * height)
        : new Uint8Array(width * height);
    this.clear();
  }

  getByteBuffer() {
    return this.bits === 16
      ? new Uint8Array(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength)
      : this.buffer;
  }

  setPixel(x, y, p) {
    if (x >= this.width) {
      throw new Error('x is larger than width');
    }
    if (y >= this.height) {
      throw new Error('y is larger than height');
    }
    if (p < this.min) {
      throw new Error('p is smaller than the min allowed value');
    }
    if (p > this.max) {
      throw new Error('p is larger than the max allowed value');
    }

    this.buffer[y * this.width + x] = p;
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, this.min);
      }
    }
  }

  random() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, Math.floor(Math.random() * (this.max - this.min + 1)) + this.min);
      }
    }
  }

  gradient() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(
          x,
          y,
          Math.floor(
            this.min + ((this.max - this.min) * (y * this.width + x)) / (this.width * this.height)
          )
        );
      }
    }
  }
}

class RandomColorImageBuffer {
  constructor(planar, width, height) {
    if (width < 1) {
      throw new Error('Width should be larger than one pixel');
    }
    if (height < 1) {
      throw new Error('Height should be larger than one pixel');
    }

    this.width = width;
    this.height = height;
    this.planar = planar;

    this.buffer = new Uint8Array(3 * width * height);
    this.clear();
  }

  getByteBuffer() {
    return this.planar ? this._interleavedToPlanar24(this.buffer) : this.buffer;
  }

  setPixel(x, y, pR, pG, pB) {
    if (x >= this.width) {
      throw new Error('x is larger than width');
    }
    if (y >= this.height) {
      throw new Error('y is larger than height');
    }
    if (pR > 0xff) {
      throw new Error('pR is larger than the max allowed value');
    }
    if (pG > 0xff) {
      throw new Error('pG is larger than the max allowed value');
    }
    if (pB > 0xff) {
      throw new Error('pB is larger than the max allowed value');
    }

    this.buffer[y * 3 * this.width + x] = pR;
    this.buffer[y * 3 * this.width + x + 1] = pG;
    this.buffer[y * 3 * this.width + x + 2] = pB;
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, 0, 0, 0);
      }
    }
  }

  random() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setPixel(
          x,
          y,
          Math.floor(Math.random() * 0xff),
          Math.floor(Math.random() * 0xff),
          Math.floor(Math.random() * 0xff)
        );
      }
    }
  }

  _interleavedToPlanar24(interleavedPixels) {
    var planarPixels = new Uint8Array(interleavedPixels.length);
    var pixelCount = planarPixels.length / 3;

    for (let n = 0; n < pixelCount; n++) {
      planarPixels[n + pixelCount * 0] = interleavedPixels[n * 3 + 0];
      planarPixels[n + pixelCount * 1] = interleavedPixels[n * 3 + 1];
      planarPixels[n + pixelCount * 2] = interleavedPixels[n * 3 + 2];
    }

    return planarPixels;
  }
}

module.exports = {
  RandomColorImageBuffer,
  RandomGrayscaleImageBuffer,
};
