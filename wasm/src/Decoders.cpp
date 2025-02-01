#include <charls/charls.h>
#include <emscripten.h>
#include <ojph_codestream.h>
#include <ojph_file.h>
#include <ojph_mem.h>
#include <ojph_params.h>
#include <opj_includes.h>

#include <string>
#include <vector>

#include "Buffer.h"
#include "CodecsContext.h"
#include "DecoderParameters.h"
#include "Decoders/JpegDecoder.h"
#include "Decoders/JpegDecoder12.h"
#include "Decoders/JpegDecoder16.h"
#include "Decoders/JpegDecoder8.h"
#include "Decoders/RleDecoder.h"
#include "Exception.h"
#include "Jpeg2000Buffer.h"
#include "Logging.h"

using namespace std;
using namespace charls;
using namespace ojph;

#define JP2_RFC3745_MAGIC "\x00\x00\x00\x0c\x6a\x50\x20\x20\x0d\x0a\x87\x0a"
#define JP2_MAGIC "\x0d\x0a\x87\x0a"
#define J2K_CODESTREAM_MAGIC "\xff\x4f\xff\x51"

extern "C" {
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void DecodeRle(CodecsContext *ctx,
                                    DecoderParameters *params) {
  DECODER_TRACE_ENTRY(ctx, params);

  RleDecoder decoder(GetEncodedBuffer(ctx),
                     static_cast<int32_t>(GetEncodedBufferSize(ctx)));

  auto const bytesAllocated =
      (GetBitsAllocated(ctx) / 8) + ((GetBitsAllocated(ctx) % 8 == 0) ? 0 : 1);
  auto const pixelCount = GetColumns(ctx) * GetRows(ctx);

  auto const decodedBufferSize =
      pixelCount * bytesAllocated * GetSamplesPerPixel(ctx);
  SetDecodedBufferSize(ctx, decodedBufferSize);
  auto const pDest = GetDecodedBuffer(ctx);

  for (auto s = 0; s < decoder.GetNumberOfSegments(); s++) {
    auto const sample = static_cast<size_t>(s) / bytesAllocated;
    auto const sabyte = static_cast<size_t>(s) % bytesAllocated;

    auto pos =
        GetPlanarConfiguration(ctx) == +PlanarConfigurationEnum::Interleaved
            ? sample * bytesAllocated
            : sample * bytesAllocated * pixelCount;
    pos += bytesAllocated - sabyte - 1;
    auto const offset =
        GetPlanarConfiguration(ctx) == +PlanarConfigurationEnum::Interleaved
            ? GetSamplesPerPixel(ctx) * bytesAllocated
            : bytesAllocated;

    decoder.DecodeSegment(s, pDest, static_cast<int32_t>(decodedBufferSize),
                          static_cast<int32_t>(pos),
                          static_cast<int32_t>(offset));
  }

  DECODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void DecodeJpeg(CodecsContext *ctx,
                                     DecoderParameters *params) {
  DECODER_TRACE_ENTRY(ctx, params);

  auto jpegBitDepth =
      ScanJpegDataForBitDepth(GetEncodedBuffer(ctx), GetEncodedBufferSize(ctx));
  if (jpegBitDepth == 0) {
    jpegBitDepth = GetBitsStored(ctx);
  }
  if (jpegBitDepth == 0) {
    ThrowCodecsException("DecodeJpeg::Jpeg bit depth is 0");
  }

  if (jpegBitDepth <= 8) {
    DecodeJpeg8(ctx, params);
  } else if (jpegBitDepth <= 12) {
    DecodeJpeg12(ctx, params);
  } else if (jpegBitDepth <= 16) {
    DecodeJpeg16(ctx, params);
  } else {
    ThrowCodecsException("DecodeJpeg::Unsupported Jpeg bit depth (" +
                         to_string(jpegBitDepth) + ")");
  }

  DECODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void DecodeJpegLs(CodecsContext *ctx,
                                       DecoderParameters *params) {
  DECODER_TRACE_ENTRY(ctx, params);

  JlsParameters jlsParams = {};

  char errorMsg[256 + 1] = {'\0'};
  auto retCode = JpegLsReadHeader(
      GetEncodedBuffer(ctx), GetEncodedBufferSize(ctx), &jlsParams, errorMsg);
  if (retCode != ApiResult::OK) {
    ThrowCodecsException("DecodeJpegLs::JpegLsReadHeader::" + string(errorMsg));
  }
  jlsParams.outputBgr = false;

  auto const bytesPerSample = (jlsParams.bitsPerSample / 8) +
                              (jlsParams.bitsPerSample % 8 == 0 ? 0 : 1);
  auto const decodedBufferSize = jlsParams.width * jlsParams.height *
                                 jlsParams.components * bytesPerSample;
  SetDecodedBufferSize(ctx, static_cast<size_t>(decodedBufferSize));

  retCode = JpegLsDecode(GetDecodedBuffer(ctx), GetDecodedBufferSize(ctx),
                         GetEncodedBuffer(ctx), GetEncodedBufferSize(ctx),
                         &jlsParams, errorMsg);
  if (retCode != ApiResult::OK) {
    ThrowCodecsException("DecodeJpegLs::JpegLsDecode::" + string(errorMsg));
  }

  DECODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void DecodeJpeg2000(CodecsContext *ctx,
                                         DecoderParameters *params) {
  DECODER_TRACE_ENTRY(ctx, params);

  Jpeg2000Buffer sourceBuffer(GetEncodedBuffer(ctx), GetEncodedBufferSize(ctx));

  uint8_t buf12[12];
  auto codecFormat = OPJ_CODEC_FORMAT::OPJ_CODEC_UNKNOWN;
  memcpy(buf12, GetEncodedBuffer(ctx), 12);
  if (memcmp(buf12, JP2_RFC3745_MAGIC, 12) == 0 ||
      memcmp(buf12, JP2_MAGIC, 4) == 0) {
    codecFormat = OPJ_CODEC_FORMAT::OPJ_CODEC_JP2;
  } else if (memcmp(buf12, J2K_CODESTREAM_MAGIC, 4) == 0) {
    codecFormat = OPJ_CODEC_FORMAT::OPJ_CODEC_J2K;
  }

  auto pStream =
      OpjCreateMemoryStream(&sourceBuffer, OPJ_J2K_STREAM_CHUNK_SIZE, true);
  if (!pStream) {
    ThrowCodecsException(
        "DecodeJpeg2000::OpjCreateMemoryStream::Failed to create stream");
  }

  auto pCodec = opj_create_decompress(codecFormat);
  if (!pCodec) {
    opj_stream_destroy(pStream);
    ThrowCodecsException(
        "DecodeJpeg2000::opj_create_decompress::Failed to create codec");
  }

  opj_set_info_handler(pCodec, OpjMessageCallbackInfo, nullptr);
  opj_set_warning_handler(pCodec, OpjMessageCallbackWarning, nullptr);
  opj_set_error_handler(pCodec, OpjMessageCallbackError, nullptr);

  opj_dparameters_t parameters;
  opj_set_default_decoder_parameters(&parameters);
  if (!opj_setup_decoder(pCodec, &parameters)) {
    opj_stream_destroy(pStream);
    opj_destroy_codec(pCodec);
    ThrowCodecsException(
        "DecodeJpeg2000::opj_setup_decoder::Failed to setup the decoder");
  }

  opj_image_t *pImage = nullptr;
  if (!opj_read_header(pStream, pCodec, &pImage)) {
    opj_stream_destroy(pStream);
    opj_destroy_codec(pCodec);
    opj_image_destroy(pImage);
    ThrowCodecsException(
        "DecodeJpeg2000::opj_read_header::Failed to read the header");
  }

  if (!(opj_decode(pCodec, pStream, pImage) &&
        opj_end_decompress(pCodec, pStream))) {
    opj_stream_destroy(pStream);
    opj_destroy_codec(pCodec);
    opj_image_destroy(pImage);
    ThrowCodecsException("DecodeJpeg2000::opj_decode::Failed to decode image");
  }

  auto const depth = (pImage->comps[0].prec + 7) / 8;
  auto const decodedBufferSize =
      GetColumns(ctx) * GetRows(ctx) * pImage->numcomps * depth;
  SetDecodedBufferSize(ctx, decodedBufferSize);

  auto const numPixels = GetColumns(ctx) * GetRows(ctx);
  if (pImage->numcomps == 1) {
    if (pImage->comps[0].prec <= 8) {
      auto pDest = GetDecodedBuffer(ctx);
      auto pSource = pImage->comps[0].data;
      for (auto i = numPixels; i; i--) {
        *pDest++ = static_cast<uint8_t>(*pSource++);
      }
    }
    if (pImage->comps[0].prec > 8) {
      auto pDest = reinterpret_cast<uint16_t *>(GetDecodedBuffer(ctx));
      auto pSource = pImage->comps[0].data;
      for (auto i = numPixels; i; i--) {
        *pDest++ = static_cast<uint16_t>(*pSource++);
      }
    }
  } else if (pImage->numcomps == 3) {
    auto pDest = GetDecodedBuffer(ctx);
    auto pSourceR = pImage->comps[0].data;
    auto pSourceG = pImage->comps[1].data;
    auto pSourceB = pImage->comps[2].data;
    for (auto i = numPixels; i; i--) {
      *pDest++ = static_cast<uint8_t>(*pSourceR++);
      *pDest++ = static_cast<uint8_t>(*pSourceG++);
      *pDest++ = static_cast<uint8_t>(*pSourceB++);
    }
  }

  opj_stream_destroy(pStream);
  opj_destroy_codec(pCodec);
  opj_image_destroy(pImage);

  DECODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void DecodeHtJpeg2000(CodecsContext *ctx,
                                           DecoderParameters *params) {
  DECODER_TRACE_ENTRY(ctx, params);

  mem_infile sourceBuffer;
  codestream codestream;

  sourceBuffer.open(GetEncodedBuffer(ctx), GetEncodedBufferSize(ctx));
  codestream.enable_resilience();
  codestream.read_headers(&sourceBuffer);
  codestream.restrict_input_resolution(0, 0);

  auto const siz = codestream.access_siz();
  ui32 bitDepths[4] = {0, 0, 0, 0};
  for (auto c = 0u; c < siz.get_num_components(); c++) {
    bitDepths[c] = siz.get_bit_depth(c);
  }

  auto const cod = codestream.access_cod();
  codestream.set_planar(siz.get_num_components() == 1
                            ? true
                            : (cod.is_using_color_transform() ? false : true));
  codestream.create();

  auto const width = siz.get_image_extent().x - siz.get_image_offset().x;
  auto const height = siz.get_image_extent().y - siz.get_image_offset().y;

  auto const bytesPerPixel = GetBitsAllocated(ctx) / 8;
  auto const decodedBufferSize =
      width * height * GetSamplesPerPixel(ctx) * bytesPerPixel;
  vector<uint8_t> decodedBuffer;
  decodedBuffer.resize(decodedBufferSize);

  ui32 comp_num;
  for (auto y = 0u; y < height; y++) {
    auto const lineStart = y * width * GetSamplesPerPixel(ctx) * bytesPerPixel;
    if (GetSamplesPerPixel(ctx) == 1) {
      auto line = codestream.pull(comp_num);
      if (GetBitsAllocated(ctx) <= 8) {
        auto dp = &decodedBuffer[lineStart];
        for (auto x = 0; x < width; x++) {
          auto const val = line->i32[x];
          dp[x] = static_cast<uint8_t>(max(0, min(val, UCHAR_MAX)));
        }
      } else {
        if (GetPixelRepresentation(ctx) == +PixelRepresentationEnum::Signed) {
          auto dp = reinterpret_cast<int16_t *>(&(decodedBuffer)[lineStart]);
          for (auto x = 0; x < width; x++) {
            auto const val = line->i32[x];
            dp[x] = static_cast<int16_t>(max(SHRT_MIN, min(val, SHRT_MAX)));
          }
        } else {
          auto dp = reinterpret_cast<uint16_t *>(&(decodedBuffer)[lineStart]);
          for (auto x = 0u; x < width; x++) {
            auto const val = line->i32[x];
            dp[x] = static_cast<uint16_t>(max(0, min(val, USHRT_MAX)));
          }
        }
      }
    } else {
      for (auto c = 0; c < GetSamplesPerPixel(ctx); c++) {
        auto line = codestream.pull(comp_num);
        if (GetBitsAllocated(ctx) <= 8) {
          auto dp = &(decodedBuffer)[lineStart] + c;
          for (auto x = 0u; x < width; x++) {
            auto const val = line->i32[x];
            dp[x * GetSamplesPerPixel(ctx)] =
                static_cast<uint8_t>(max(0, min(val, UCHAR_MAX)));
          }
        } else {
          if (GetPixelRepresentation(ctx) == +PixelRepresentationEnum::Signed) {
            auto dp =
                reinterpret_cast<int16_t *>(&(decodedBuffer)[lineStart]) + c;
            for (auto x = 0u; x < width; x++) {
              auto const val = line->i32[x];
              dp[x * GetSamplesPerPixel(ctx)] =
                  static_cast<int16_t>(max(SHRT_MIN, min(val, SHRT_MAX)));
            }
          } else {
            auto dp =
                reinterpret_cast<uint16_t *>(&(decodedBuffer)[lineStart]) + c;
            for (auto x = 0u; x < width; x++) {
              auto const val = line->i32[x];
              dp[x * GetSamplesPerPixel(ctx)] =
                  static_cast<uint16_t>(max(0, min(val, USHRT_MAX)));
            }
          }
        }
      }
    }
  }

  codestream.close();

  SetDecodedBufferSize(ctx, decodedBufferSize);
  auto pDest = GetDecodedBuffer(ctx);
  memcpy(pDest, decodedBuffer.data(), decodedBufferSize);

  DECODER_TRACE_EXIT(ctx);
}
}
