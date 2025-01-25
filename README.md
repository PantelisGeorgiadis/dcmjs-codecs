[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![build][build-image]][build-url] [![MIT License][license-image]][license-url] 

# dcmjs-codecs
DICOM file and dataset transcoding for Node.js and browser using Steve Pieper's [dcmjs][dcmjs-url] library.

### Note
**This effort is a work-in-progress and should not be used for production or clinical purposes.**

### Install
#### Node.js

	npm install dcmjs-codecs

#### Browser

	<script type="text/javascript" src="https://unpkg.com/dcmjs"></script>
	<script type="text/javascript" src="https://unpkg.com/dcmjs-codecs"></script>

### Build

	npm install
	npm run build

### Build codecs WebAssembly (optional)

	cd wasm
	./build.sh
[Emscripten SDK (emsdk)][emscripten-sdk-url] is required.

### Supported Transfer Syntaxes
- Implicit VR Little Endian (1.2.840.10008.1.2)
- Explicit VR Little Endian (1.2.840.10008.1.2.1)
- Explicit VR Big Endian (1.2.840.10008.1.2.2)
- RLE Lossless (1.2.840.10008.1.2.5)\*
- JPEG Baseline - Process 1 (1.2.840.10008.1.2.4.50)\*
- JPEG Lossless, Nonhierarchical, First-Order Prediction - Processes 14 [Selection Value 1] (1.2.840.10008.1.2.4.70)\*
- JPEG-LS Lossless Image Compression (1.2.840.10008.1.2.4.80)\*
- JPEG-LS Lossy Image Compression - Near-Lossless (1.2.840.10008.1.2.4.81)\*
- JPEG 2000 Image Compression - Lossless Only (1.2.840.10008.1.2.4.90)\*
- JPEG 2000 Image Compression (1.2.840.10008.1.2.4.91)\*
- High Throughput JPEG 2000 Image Compression - Lossless Only (1.2.840.10008.1.2.4.201)\*
- High Throughput JPEG 2000 with RPCL Options Image Compression - Lossless Only (1.2.840.10008.1.2.4.202)\*
- High Throughput JPEG 2000 Image Compression (1.2.840.10008.1.2.4.203)\*
--------
\*: Syntax is transcoded using the codecs WebAssembly.

### Usage

#### Basic image transcoding
```js
// Import objects in Node.js
const dcmjsCodecs = require('dcmjs-codecs');
const { NativeCodecs, Transcoder } = dcmjsCodecs;
const { TransferSyntax } = constants;

// Import objects in Browser
const { NativeCodecs, Transcoder } = window.dcmjsCodecs;
const { TransferSyntax } = constants;

// Register native codecs WebAssembly.
await NativeCodecs.initializeAsync();

// Create an ArrayBuffer with the contents of the DICOM P10 byte stream.
const transcoder = new Transcoder(arrayBuffer);

// Transcode to a different transfer syntax UID.
transcoder.transcode(TransferSyntax.JpegLosslessProcess14V1);

// Get the transcoded DICOM P10 byte stream in an ArrayBuffer.
const transcodedArrayBuffer = transcoder.getDicomPart10();
```

#### Advanced image transcoding
```js
// Import objects in Node.js
const dcmjsCodecs = require('dcmjs-codecs');
const { NativeCodecs, Transcoder } = dcmjsCodecs;
const { TransferSyntax } = constants;

// Import objects in Browser
const { NativeCodecs, Transcoder } = window.dcmjsCodecs;
const { Jpeg2000ProgressionOrder, TransferSyntax } = constants;

// Import objects in Browser
const { DicomImage, WindowLevel, NativePixelDecoder } = window.dcmjsImaging;
const { StandardColorPalette } = window.dcmjsImaging.constants;

// Create native codecs WebAssembly initialization options.
const initOpts = {
  // Optionally, provide the path or URL to WebAssembly module.
  // If empty or undefined, the module is trying to be resolved 
  // within the same directory.
  webAssemblyModulePathOrUrl: undefined,
  // Optional flag to enable native codecs informational message logging.
  // If not provided, the native codecs informational message logging is disabled.
  logCodecsInfo: false
  // Optional flag to enable native codecs trace message logging.
  // If not provided, the native codecs trace message logging is disabled.
  logCodecsTrace: false
};
await NativeCodecs.initializeAsync(initOpts);

// Create an ArrayBuffer with the contents of the DICOM P10 byte stream.
const transcoder = new Transcoder(arrayBuffer);

// Create encoding and decoding options.
const encodingDecodingOpts = {
  // JPEG encoding params
  // Optional JPEG quality, in case of JPEG baseline encoding.
  // Sets the libjpeg jpeg_set_quality quality input variable.
  quality: 90,

  // JPEG-LS encoding params
  // Optional JPEG-LS quality, in case of JPEG-LS lossy encoding.
  // Sets the charls allowedLossyError variable.
  allowedLossyError: 10,

  // JPEG 2000 and HT-JPEG 2000 encoding params
  // Optional JPEG progression order, in case of JPEG 2000 and HT-JPEG 2000 encoding.
  progressionOrder: Lrcp,
  // Optional JPEG 2000 quality, in case of JPEG 2000 lossy encoding.
  // Sets the charls allowedLossyError variable.
  rate: 20,
};

// Transcode to a different transfer syntax UID.
transcoder.transcode(TransferSyntax.Jpeg2000Lossless, encodingDecodingOpts);

// Get the transcoded DICOM P10 byte stream in an ArrayBuffer.
const transcodedArrayBuffer = transcoder.getDicomPart10();
```
Please check a live example [here][dcmjs-codecs-live-example-url].

### Related libraries
* [dcmjs-dimse][dcmjs-dimse-url] - DICOM DIMSE implementation for Node.js using dcmjs.
* [dcmjs-imaging][dcmjs-imaging-url] - DICOM image and overlay rendering for Node.js and browser using dcmjs.

### License
dcmjs-codecs is released under the MIT License.

[npm-url]: https://npmjs.org/package/dcmjs-codecs
[npm-version-image]: https://img.shields.io/npm/v/dcmjs-codecs.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/dcmjs-codecs.svg?style=flat

[build-url]: https://github.com/PantelisGeorgiadis/dcmjs-codecs/actions/workflows/build.yml
[build-image]: https://github.com/PantelisGeorgiadis/dcmjs-codecs/actions/workflows/build.yml/badge.svg?branch=master

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE.txt

[dcmjs-url]: https://github.com/dcmjs-org/dcmjs
[dcmjs-dimse-url]: https://github.com/PantelisGeorgiadis/dcmjs-dimse
[dcmjs-imaging-url]: https://github.com/PantelisGeorgiadis/dcmjs-imaging

[dcmjs-codecs-live-example-url]: https://unpkg.com/dcmjs-codecs@latest/build/index.html

[emscripten-sdk-url]: https://emscripten.org/docs/getting_started/downloads.html
