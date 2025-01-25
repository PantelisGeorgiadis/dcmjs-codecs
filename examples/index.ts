import { NativeCodecs, Transcoder } from './..';

import path from 'path';
import fs from 'fs';

async function transcode(dicomFileOld: string, dicomFileNew: string, transferSyntaxUid: string) {
  // Register native decoders
  // Optionally, provide the path to WebAssembly module.
  // If not provided, the module is trying to be resolved within the same directory.
  await NativeCodecs.initializeAsync({
    webAssemblyModulePathOrUrl: path.resolve(__dirname, './../wasm/bin/dcmjs-native-codecs.wasm'),
  });

  const fileBuffer = fs.readFileSync(dicomFileOld);
  const transcoder = new Transcoder(
    fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
  );
  transcoder.transcode(transferSyntaxUid);
  fs.writeFileSync(dicomFileNew, Buffer.from(transcoder.getDicomPart10()));
}

const args = process.argv.slice(2);
(async () => {
  await transcode(args[0], args[1], args[2]);
})();
