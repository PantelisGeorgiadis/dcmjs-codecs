const {
  ErrNo,
  Jpeg2000ProgressionOrder,
  JpegSampleFactor,
  PhotometricInterpretation,
} = require('./Constants');
const Context = require('./Context');
const log = require('./log');

/**
 * WebAssembly module filename.
 * @constant {string}
 */
const wasmFilename = 'dcmjs-native-codecs.wasm';
Object.freeze(wasmFilename);

//#region NativeCodecs
class NativeCodecs {
  /**
   * Initializes native codecs.
   * @method
   * @static
   * @async
   * @param {Object} [opts] - Native codecs options.
   * @param {string} [opts.webAssemblyModulePathOrUrl] - Custom WebAssembly module path or URL.
   * If not provided, the module is trying to be resolved within the same directory.
   * @param {boolean} [opts.logCodecsInfo] - Flag to indicate whether to log native codecs informational messages.
   * @param {boolean} [opts.logCodecsTrace] - Flag to indicate whether to log native codecs trace messages.
   */
  static async initializeAsync(opts = {}) {
    this.logCodecsInfo = opts.logCodecsInfo || false;
    this.logCodecsTrace = opts.logCodecsTrace || false;
    this.webAssemblyModulePathOrUrl = opts.webAssemblyModulePathOrUrl;

    const { instance, module } = await this._createWebAssemblyInstance();
    const exports = WebAssembly.Module.exports(module);
    const exportedFunctions = exports.filter((e) => e.kind === 'function');

    const wasmApi = {
      wasmInstance: instance,
      wasmModule: module,
      wasmMemory: instance.exports.memory,
      wasmEnv: {},
    };

    exportedFunctions.forEach((key) => {
      const wasmKey = `wasm${key.name}`;
      wasmApi[wasmKey] = instance.exports[key.name];
    });

    this.wasmApi = wasmApi;
  }

  /**
   * Checks if native codecs module is initialized.
   * @method
   * @static
   * @async
   * @returns {boolean} A flag indicating whether native codecs module is initialized.
   */
  static isInitialized() {
    return this.wasmApi !== undefined;
  }

  /**
   * Releases native codecs.
   * @method
   * @static
   */
  static release() {
    this.wasmApi = undefined;
  }

  /**
   * Decodes RLE frame.
   * @method
   * @static
   * @param {Context} context - Context object with encoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static decodeRle(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createDecoderContext(context);
    const params = this._createDecoderParameters(parameters);
    this.wasmApi.wasmDecodeRle(ctx, params);
    this._releaseDecoderParameters(params);

    return this._releaseDecoderContext(ctx);
  }

  /**
   * Encodes RLE frame.
   * @method
   * @static
   * @param {Context} context - Context object with decoded pixels data.
   * @param {Object} [parameters] - Encoder parameters.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static encodeRle(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createEncoderContext(context);
    const params = this._createEncoderParameters(parameters);
    this.wasmApi.wasmEncodeRle(ctx, params);
    this._releaseEncoderParameters(params);

    return this._releaseEncoderContext(ctx);
  }

  /**
   * Decodes JPEG frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with encoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @param {boolean} [parameters.convertColorspaceToRgb] - Convert colorspace to RGB.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static decodeJpeg(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createDecoderContext(context);
    const params = this._createDecoderParameters(parameters);
    this.wasmApi.wasmDecodeJpeg(ctx, params);
    this._releaseDecoderParameters(params);

    return this._releaseDecoderContext(ctx);
  }

  /**
   * Encodes JPEG frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with decoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @param {boolean} [parameters.lossy] - Lossy encoding.
   * @param {number} [parameters.quality] - JPEG quality.
   * Sets the libjpeg jpeg_set_quality quality input variable.
   * @param {number} [parameters.smoothingFactor] - JPEG smoothing factor.
   * Sets the libjpeg smoothing_factor variable.
   * @param {number} [parameters.sampleFactor] - JPEG sample factor.
   * Sets the libjpeg h_samp_factor and v_samp_factor variable.
   * @param {number} [parameters.predictor] - JPEG predictor.
   * Sets the libjpeg jpeg_simple_lossless predictor input variable.
   * @param {number} [parameters.pointTransform] - JPEG point transform.
   * Sets the libjpeg jpeg_simple_lossless point_transform input variable.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static encodeJpeg(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createEncoderContext(context);
    const params = this._createEncoderParameters(parameters);
    this.wasmApi.wasmEncodeJpeg(ctx, params);
    this._releaseEncoderParameters(params);

    return this._releaseEncoderContext(ctx);
  }

  /**
   * Decodes JPEG-LS frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with encoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static decodeJpegLs(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createDecoderContext(context);
    const params = this._createDecoderParameters(parameters);
    this.wasmApi.wasmDecodeJpegLs(ctx, params);
    this._releaseDecoderParameters(params);

    return this._releaseDecoderContext(ctx);
  }

  /**
   * Encodes JPEG-LS frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with decoded pixels data.
   * @param {Object} [parameters] - Encoder parameters.
   * @param {boolean} [parameters.lossy] - Lossy encoding.
   * @param {number} [parameters.allowedLossyError] - JPEG-LS allowed lossy error.
   * Sets the charls allowedLossyError variable.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static encodeJpegLs(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createEncoderContext(context);
    const params = this._createEncoderParameters(parameters);
    this.wasmApi.wasmEncodeJpegLs(ctx, params);
    this._releaseEncoderParameters(params);

    return this._releaseEncoderContext(ctx);
  }

  /**
   * Decodes JPEG2000 frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with encoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static decodeJpeg2000(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createDecoderContext(context);
    const params = this._createDecoderParameters(parameters);
    this.wasmApi.wasmDecodeJpeg2000(ctx, params);
    this._releaseDecoderParameters(params);

    return this._releaseDecoderContext(ctx);
  }

  /**
   * Encodes JPEG2000 frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with decoded pixels data.
   * @param {Object} [parameters] - Encoder parameters.
   * @param {boolean} [parameters.lossy] - Lossy encoding.
   * @param {number} [parameters.progressionOrder] - JPEG 2000 progression order.
   * 0: LRCP, 1: RLCP, 2: RPCL, 3: PCRL, 4: CPRL.
   * @param {number} [parameters.rate] - JPEG 2000 compression rate.
   * Sets the openjpeg tcp_rates[0] variable.
   * @param {number} [parameters.allowMct] - JPEG 2000 multiple component transform.
   * Sets the openjpeg tcp_mct variable.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static encodeJpeg2000(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createEncoderContext(context);
    const params = this._createEncoderParameters(parameters);
    this.wasmApi.wasmEncodeJpeg2000(ctx, params);
    this._releaseEncoderParameters(params);

    return this._releaseEncoderContext(ctx);
  }

  /**
   * Decodes High-Throughput JPEG2000 frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with encoded pixels data.
   * @param {Object} [parameters] - Decoder parameters.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static decodeHtJpeg2000(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createDecoderContext(context);
    const params = this._createDecoderParameters(parameters);
    this.wasmApi.wasmDecodeHtJpeg2000(ctx, params);
    this._releaseDecoderParameters(params);

    return this._releaseDecoderContext(ctx);
  }

  /**
   * Encodes High-Throughput JPEG2000 frame (lossless or lossy).
   * @method
   * @static
   * @param {Context} context - Context object with decoded pixels data.
   * @param {Object} [parameters] - Encoder parameters.
   * @param {boolean} [parameters.lossy] - Lossy encoding.
   * @param {number} [parameters.progressionOrder] - JPEG 2000 progression order.
   * 0: LRCP, 1: RLCP, 2: RPCL, 3: PCRL, 4: CPRL.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static encodeHtJpeg2000(context, parameters) {
    this._throwIfCodecsModuleIsNotInitialized();

    const ctx = this._createEncoderContext(context);
    const params = this._createEncoderParameters(parameters);
    this.wasmApi.wasmEncodeHtJpeg2000(ctx, params);
    this._releaseEncoderParameters(params);

    return this._releaseEncoderContext(ctx);
  }

  //#region Private Methods
  /**
   * Creates the decoder context.
   * @method
   * @static
   * @private
   * @param {Context} context - Context object with encoded pixels data.
   * @returns {number} Decoder context pointer.
   * @throws {Error} If native codecs module is not initialized or the context values are invalid.
   */
  static _createDecoderContext(context) {
    this._throwIfCodecsModuleIsNotInitialized();
    context.validate();

    const ctx = this.wasmApi.wasmCreateCodecsContext();
    this.wasmApi.wasmSetColumns(ctx, context.getWidth());
    this.wasmApi.wasmSetRows(ctx, context.getHeight());
    this.wasmApi.wasmSetBitsAllocated(ctx, context.getBitsAllocated());
    this.wasmApi.wasmSetBitsStored(ctx, context.getBitsStored());
    this.wasmApi.wasmSetSamplesPerPixel(ctx, context.getSamplesPerPixel());
    this.wasmApi.wasmSetPixelRepresentation(ctx, context.getPixelRepresentation());
    this.wasmApi.wasmSetPlanarConfiguration(ctx, context.getPlanarConfiguration());
    this.wasmApi.wasmSetPhotometricInterpretation(
      ctx,
      Object.values(PhotometricInterpretation).indexOf(context.getPhotometricInterpretation())
    );

    const encodedData = context.getEncodedBuffer();
    this.wasmApi.wasmSetEncodedBufferSize(ctx, encodedData.length);
    const encodedDataPointer = this.wasmApi.wasmGetEncodedBuffer(ctx);
    const heap8 = new Uint8Array(this.wasmApi.wasmMemory.buffer);
    heap8.set(encodedData, encodedDataPointer);

    return ctx;
  }

  /**
   * Creates the encoder context.
   * @method
   * @static
   * @private
   * @param {Context} context - Context object with encoded pixels data.
   * @returns {number} Encoder context pointer.
   * @throws {Error} If native codecs module is not initialized or the context values are invalid.
   */
  static _createEncoderContext(context) {
    this._throwIfCodecsModuleIsNotInitialized();
    context.validate();

    const ctx = this.wasmApi.wasmCreateCodecsContext();
    this.wasmApi.wasmSetColumns(ctx, context.getWidth());
    this.wasmApi.wasmSetRows(ctx, context.getHeight());
    this.wasmApi.wasmSetBitsAllocated(ctx, context.getBitsAllocated());
    this.wasmApi.wasmSetBitsStored(ctx, context.getBitsStored());
    this.wasmApi.wasmSetSamplesPerPixel(ctx, context.getSamplesPerPixel());
    this.wasmApi.wasmSetPixelRepresentation(ctx, context.getPixelRepresentation());
    this.wasmApi.wasmSetPlanarConfiguration(ctx, context.getPlanarConfiguration());
    this.wasmApi.wasmSetPhotometricInterpretation(
      ctx,
      Object.values(PhotometricInterpretation).indexOf(context.getPhotometricInterpretation())
    );

    const decodedData = context.getDecodedBuffer();
    this.wasmApi.wasmSetDecodedBufferSize(ctx, decodedData.length);
    const decodedDataPointer = this.wasmApi.wasmGetDecodedBuffer(ctx);
    const heap8 = new Uint8Array(this.wasmApi.wasmMemory.buffer);
    heap8.set(decodedData, decodedDataPointer);

    return ctx;
  }

  /**
   * Gathers the decoded data and releases the decoder context.
   * @method
   * @static
   * @private
   * @param {number} ctx - Decoder context pointer.
   * @returns {Context} Context object with decoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _releaseDecoderContext(ctx) {
    this._throwIfCodecsModuleIsNotInitialized();

    const decodedDataPointer = this.wasmApi.wasmGetDecodedBuffer(ctx);
    const decodedDataSize = this.wasmApi.wasmGetDecodedBufferSize(ctx);
    const heap8 = new Uint8Array(this.wasmApi.wasmMemory.buffer);
    const decodedDataView = new Uint8Array(heap8.buffer, decodedDataPointer, decodedDataSize);
    const decodedData = decodedDataView.slice(0);

    const context = new Context({
      width: this.wasmApi.wasmGetColumns(ctx),
      height: this.wasmApi.wasmGetRows(ctx),
      bitsAllocated: this.wasmApi.wasmGetBitsAllocated(ctx),
      bitsStored: this.wasmApi.wasmGetBitsStored(ctx),
      samplesPerPixel: this.wasmApi.wasmGetSamplesPerPixel(ctx),
      pixelRepresentation: this.wasmApi.wasmGetPixelRepresentation(ctx),
      planarConfiguration: this.wasmApi.wasmGetPlanarConfiguration(ctx),
      photometricInterpretation:
        Object.values(PhotometricInterpretation)[
          this.wasmApi.wasmGetPhotometricInterpretation(ctx)
        ],
      decodedBuffer: decodedData,
    });

    this.wasmApi.wasmReleaseCodecsContext(ctx);

    return context;
  }

  /**
   * Gathers the encoded data and releases the encoder context.
   * @method
   * @static
   * @private
   * @param {number} ctx - Encoder context pointer.
   * @returns {Context} Context object with encoded pixels data.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _releaseEncoderContext(ctx) {
    this._throwIfCodecsModuleIsNotInitialized();

    const encodedDataPointer = this.wasmApi.wasmGetEncodedBuffer(ctx);
    const encodedDataSize = this.wasmApi.wasmGetEncodedBufferSize(ctx);
    const heap8 = new Uint8Array(this.wasmApi.wasmMemory.buffer);
    const encodedDataView = new Uint8Array(heap8.buffer, encodedDataPointer, encodedDataSize);
    const encodedData = encodedDataView.slice(0);

    const context = new Context({
      width: this.wasmApi.wasmGetColumns(ctx),
      height: this.wasmApi.wasmGetRows(ctx),
      bitsAllocated: this.wasmApi.wasmGetBitsAllocated(ctx),
      bitsStored: this.wasmApi.wasmGetBitsStored(ctx),
      samplesPerPixel: this.wasmApi.wasmGetSamplesPerPixel(ctx),
      pixelRepresentation: this.wasmApi.wasmGetPixelRepresentation(ctx),
      planarConfiguration: this.wasmApi.wasmGetPlanarConfiguration(ctx),
      photometricInterpretation:
        Object.values(PhotometricInterpretation)[
          this.wasmApi.wasmGetPhotometricInterpretation(ctx)
        ],
      encodedBuffer: encodedData,
    });

    this.wasmApi.wasmReleaseCodecsContext(ctx);

    return context;
  }

  /**
   * Creates the decoder parameters.
   * @method
   * @static
   * @private
   * @param {Object} [parameters] - Decoder parameters.
   * @param {boolean} [parameters.convertColorspaceToRgb] - Convert colorspace to RGB.
   * @returns {number} Decoder parameters pointer.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _createDecoderParameters(parameters = {}) {
    this._throwIfCodecsModuleIsNotInitialized();

    const params = this.wasmApi.wasmCreateDecoderParameters();
    this.wasmApi.wasmSetConvertColorspaceToRgb(params, parameters.convertColorspaceToRgb || false);

    return params;
  }

  /**
   * Creates the encoder parameters.
   * @method
   * @static
   * @private
   * @param {Object} [parameters] - Encoder parameters.
   * @param {boolean} [parameters.lossy] - Lossy encoding.
   * @param {number} [parameters.quality] - JPEG quality.
   * @param {number} [parameters.smoothingFactor] - JPEG smoothing factor.
   * @param {number} [parameters.sampleFactor] - JPEG sample factor.
   * @param {number} [parameters.predictor] - JPEG predictor.
   * @param {number} [parameters.pointTransform] - JPEG point transform.
   * @param {number} [parameters.allowedLossyError] - JPEG-LS allowed lossy error.
   * @param {number} [parameters.progressionOrder] - JPEG 2000 progression order.
   * @param {number} [parameters.rate] - JPEG 2000 compression rate.
   * @param {number} [parameters.allowMct] - JPEG 2000 compression rate.
   * @returns {number} Encoder parameters pointer.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _createEncoderParameters(parameters = {}) {
    this._throwIfCodecsModuleIsNotInitialized();

    const params = this.wasmApi.wasmCreateEncoderParameters();
    this.wasmApi.wasmSetLossy(params, parameters.lossy || false);
    this.wasmApi.wasmSetQuality(params, parameters.quality ?? 90);
    this.wasmApi.wasmSetSmoothingFactor(params, parameters.smoothingFactor ?? 0);
    this.wasmApi.wasmSetSampleFactor(
      params,
      Object.values(JpegSampleFactor).indexOf(parameters.sampleFactor ?? JpegSampleFactor.Sf444)
    );
    this.wasmApi.wasmSetPredictor(params, parameters.predictor ?? 1);
    this.wasmApi.wasmSetPointTransform(params, parameters.pointTransform ?? 0);
    this.wasmApi.wasmSetAllowedLossyError(params, parameters.allowedLossyError ?? 10);
    this.wasmApi.wasmSetProgressionOrder(
      params,
      Object.values(Jpeg2000ProgressionOrder).indexOf(
        parameters.progressionOrder ?? Jpeg2000ProgressionOrder.Lrcp
      )
    );
    this.wasmApi.wasmSetRate(params, parameters.rate ?? 20);
    this.wasmApi.wasmSetAllowMct(params, parameters.allowMct ?? 1);

    return params;
  }

  /**
   * Releases the decoder parameters.
   * @method
   * @static
   * @private
   * @param {number} params - Decoder parameters pointer.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _releaseDecoderParameters(params) {
    this._throwIfCodecsModuleIsNotInitialized();

    this.wasmApi.wasmReleaseDecoderParameters(params);
  }

  /**
   * Releases the encoder parameters.
   * @method
   * @static
   * @private
   * @param {number} params - Encoder parameters pointer.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _releaseEncoderParameters(params) {
    this._throwIfCodecsModuleIsNotInitialized();

    this.wasmApi.wasmReleaseEncoderParameters(params);
  }

  /**
   * Creates WebAssembly instance.
   * @method
   * @static
   * @private
   * @async
   * @returns {Object} WebAssembly module and instance.
   */
  static async _createWebAssemblyInstance() {
    /* c8 ignore start */
    const imports = {
      wasi_snapshot_preview1: {
        /**
         * Gets the environment variables.
         * @method
         * @param {number} envOffset - The environment.
         * @param {number} envBufferOffset - The address of the buffer.
         * @returns {number} Error code.
         * @throws {Error} If native codecs module is not initialized.
         */
        environ_get: (envOffset, envBufferOffset) => {
          this._throwIfCodecsModuleIsNotInitialized();

          const memoryData = new Uint8Array(this.wasmApi.wasmMemory.buffer);
          const memoryView = new DataView(this.wasmApi.wasmMemory.buffer);

          const env = this.wasmApi.wasmEnv;
          Object.keys(env).forEach((key) => {
            memoryView.setUint32(envOffset, envBufferOffset, true);
            envOffset += 4;

            const data = this._stringToBytes(`${key}=${env[key]}\0`);
            memoryData.set(data, envBufferOffset);
            envBufferOffset += data.length;
          });

          return ErrNo.Success;
        },

        /**
         * Get the size required to store the environment variables.
         * @method
         * @param {number} envCount - The number of environment variables.
         * @param {number} envBufferSize -The size of the environment variables buffer.
         * @returns {number} Error code.
         * @throws {Error} If native codecs module is not initialized.
         */
        environ_sizes_get: (envCount, envBufferSize) => {
          this._throwIfCodecsModuleIsNotInitialized();

          const memoryView = new DataView(this.wasmApi.wasmMemory.buffer);

          const env = this.wasmApi.wasmEnv;
          memoryView.setUint32(envCount, Object.keys(env).length, true);
          memoryView.setUint32(
            envBufferSize,
            Object.keys(env).reduce((acc, key) => {
              return acc + this._stringToBytes(`${key}=${env[key]}\0`).length;
            }, 0),
            true
          );

          return ErrNo.Success;
        },

        /**
         * Called on WebAssembly exit.
         * @method
         * @param {number} rval - The return value.
         * @throws {Error} If WebAssembly module exits.
         */
        proc_exit: (rval) => {
          throw new Error(`WebAssembly module exited with return value ${rval}`);
        },

        /**
         * Writes to file descriptor.
         * @method
         * @param {number} fd - The file descriptor.
         * @param {number} iovsOffset - The address of the scatter vector.
         * @param {number} iovsLength - The length of the scatter vector.
         * @param {number} nWritten - The number of items written.
         * @returns {number} Error code.
         * @throws {Error} If native codecs module is not initialized.
         */
        fd_write: (fd, iovsOffset, iovsLength, nWritten) => {
          this._throwIfCodecsModuleIsNotInitialized();

          // Accept only stdout (1) or stderr (2) writes
          if (!(fd === 1 || fd === 2)) {
            return ErrNo.BadFileDescriptor;
          }

          const memoryView = new DataView(this.wasmApi.wasmMemory.buffer);

          let written = 0;
          for (let i = 0; i < iovsLength; i++) {
            const dataOffset = memoryView.getUint32(iovsOffset, true);
            iovsOffset += 4;

            const dataLength = memoryView.getUint32(iovsOffset, true);
            iovsOffset += 4;

            const str = this._wasmToJsString(dataOffset, dataLength);
            log.error(`NativeCodecs::fd_write::${str}`);
            written += dataLength;
          }

          memoryView.setUint32(nWritten, written, true);

          return ErrNo.Success;
        },

        /**
         * Seeks the file descriptor.
         * @method
         * @param {number} fd - The file descriptor.
         * @param {number} offset - The offset.
         * @param {number} whence - Whence.
         * @param {number} newOffset - The new offset.
         * @returns {number} Error code.
         */
        // eslint-disable-next-line no-unused-vars
        fd_seek: (fd, offset, whence, newOffset) => {
          return ErrNo.Success;
        },

        /**
         * Closes the file descriptor.
         * @method
         * @param {number} fd - The file descriptor.
         * @returns {number} Error code.
         */
        // eslint-disable-next-line no-unused-vars
        fd_close: (fd) => {
          return ErrNo.Success;
        },
      },
      env: {
        /**
         * Called when memory has grown.
         * @method
         * @param {number} index - Which memory has grown.
         */
        // eslint-disable-next-line no-unused-vars
        emscripten_notify_memory_growth: (index) => {},

        /**
         * Receives a string info message from the WebAssembly.
         * @method
         * @param {number} pointer - The string info message pointer.
         * @param {number} len - The string info message length.
         */
        onCodecsInfo: (pointer, len) => {
          if (!this.logCodecsInfo) {
            return;
          }

          const str = this._wasmToJsString(pointer, len);
          log.info(`NativeCodecs::onCodecsInfo::${str}`);
        },

        /**
         * Receives a string trace message from the WebAssembly.
         * @method
         * @param {number} pointer - The string trace message pointer.
         * @param {number} len - The string trace message length.
         */
        onCodecsTrace: (pointer, len) => {
          if (!this.logCodecsTrace) {
            return;
          }

          const str = this._wasmToJsString(pointer, len);
          log.info(`NativeCodecs::onCodecsTrace::${str}`);
        },

        /**
         * Receives an exception from the WebAssembly.
         * @method
         * @param {number} pointer - The exception reason string pointer.
         * @param {number} len - The exception reason string length.
         * @throws {Error} If native codecs module exception occurs.
         */
        onCodecsException: (pointer, len) => {
          const str = this._wasmToJsString(pointer, len);
          throw new Error(str);
        },
      },
    };
    /* c8 ignore stop */

    const wasmBytes = await this._getWebAssemblyBytes();
    const { instance, module } = await WebAssembly.instantiate(wasmBytes, imports);

    return { instance, module };
  }

  /**
   * Fetches WebAssembly module bytes as an array buffer.
   * @method
   * @static
   * @private
   * @async
   * @returns {ArrayBuffer} WebAssembly bytes.
   */
  /* c8 ignore start */
  static async _getWebAssemblyBytes() {
    const isNodeJs = !!(
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node
    );
    if (!isNodeJs) {
      const response = await eval('fetch(this.webAssemblyModulePathOrUrl || wasmFilename)');
      const responseArrayBuffer = await response.arrayBuffer();

      return responseArrayBuffer;
    }

    const fs = eval("require('fs')");
    const path = eval("require('path')");
    const buffer = await fs.promises.readFile(
      this.webAssemblyModulePathOrUrl || path.resolve(__dirname, wasmFilename)
    );

    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  /* c8 ignore stop */

  /**
   * Converts an in-WebAssembly-memory string to a js string.
   * @method
   * @static
   * @private
   * @param {number} pointer - String pointer.
   * @param {number} len - String length.
   * @returns {string} The string object.
   * @throws {Error} If native codecs module is not initialized.
   */
  static _wasmToJsString(pointer, len) {
    this._throwIfCodecsModuleIsNotInitialized();

    const heap = new Uint8Array(this.wasmApi.wasmMemory.buffer);
    const stringData = new Uint8Array(heap.buffer, pointer, len);
    let str = '';
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(stringData[i]);
    }

    return str;
  }

  /**
   * Converts a string to a byte array.
   * @method
   * @static
   * @private
   * @param {number} str - String to convert.
   * @returns {Uint8Array} The byte array.
   */
  static _stringToBytes(str) {
    return str.split('').map((x) => x.charCodeAt(0));
  }

  /**
   * Throws error in case the native codecs module is not initialized.
   * @method
   * @static
   * @private
   * @throws {Error} If native codecs module is not initialized.
   */
  static _throwIfCodecsModuleIsNotInitialized() {
    if (!this.wasmApi) {
      throw new Error('Native codecs module is not initialized');
    }
  }
  //#endregion
}
//#endregion

//#region Exports
module.exports = NativeCodecs;
//#endregion
