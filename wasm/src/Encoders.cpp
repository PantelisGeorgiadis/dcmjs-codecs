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
#include "EncoderParameters.h"
#include "Encoders/JpegEncoder12.h"
#include "Encoders/JpegEncoder16.h"
#include "Encoders/JpegEncoder8.h"
#include "Encoders/RleEncoder.h"
#include "Exception.h"
#include "Jpeg2000Buffer.h"
#include "Logging.h"

using namespace std;
using namespace charls;
using namespace ojph;

extern "C" {
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void EncodeRle(CodecsContext *ctx,
                                    EncoderParameters *params) {
  ENCODER_TRACE_ENTRY(ctx, params);

  auto const bytesAllocated =
      (GetBitsAllocated(ctx) / 8) + ((GetBitsAllocated(ctx) % 8 == 0) ? 0 : 1);
  auto const pixelCount = GetColumns(ctx) * GetRows(ctx);
  auto const numberOfSegments = bytesAllocated * GetSamplesPerPixel(ctx);

  RleEncoder encoder;
  auto pSource = GetDecodedBuffer(ctx);

  for (auto s = 0; s < numberOfSegments; s++) {
    encoder.NextSegment();

    auto const sample = s / bytesAllocated;
    auto const sabyte = s % bytesAllocated;

    auto pos =
        GetPlanarConfiguration(ctx) == +PlanarConfigurationEnum::Interleaved
            ? sample * bytesAllocated
            : sample * bytesAllocated * pixelCount;
    pos += bytesAllocated - sabyte - 1;
    auto const offset =
        GetPlanarConfiguration(ctx) == +PlanarConfigurationEnum::Interleaved
            ? GetSamplesPerPixel(ctx) * bytesAllocated
            : bytesAllocated;

    for (auto p = 0; p < pixelCount; p++) {
      if (pos >= GetDecodedBufferSize(ctx)) {
        ThrowCodecsException(
            "EncodeRle::Read position is past end of frame buffer");
      }
      encoder.Encode(pSource[pos]);
      pos += offset;
    }
    encoder.Flush();
  }

  encoder.MakeEvenLength();
  auto const encodedData = encoder.GetBuffer();

  SetEncodedBufferSize(ctx, encoder.GetLength());
  memcpy(GetEncodedBuffer(ctx), encodedData, encoder.GetLength());

  ENCODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void EncodeJpeg(CodecsContext *ctx,
                                     EncoderParameters *params) {
  ENCODER_TRACE_ENTRY(ctx, params);

  auto const jpegBitDepth = GetBitsStored(ctx);
  if (params->Lossy && jpegBitDepth != 8) {
    ThrowCodecsException("EncodeJpeg::Unsupported lossy Jpeg bit depth (" +
                         to_string(jpegBitDepth) + ")");
  }

  if (jpegBitDepth <= 8) {
    EncodeJpeg8(ctx, params);
  } else if (jpegBitDepth <= 12) {
    EncodeJpeg12(ctx, params);
  } else if (jpegBitDepth <= 16) {
    EncodeJpeg16(ctx, params);
  } else {
    ThrowCodecsException("EncodeJpeg::Unsupported Jpeg bit depth (" +
                         to_string(jpegBitDepth) + ")");
  }

  ENCODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void EncodeJpegLs(CodecsContext *ctx,
                                       EncoderParameters *params) {
  ENCODER_TRACE_ENTRY(ctx, params);

  JlsParameters jlsParams = {};
  auto const bytesAllocated =
      (GetBitsAllocated(ctx) / 8) + ((GetBitsAllocated(ctx) % 8 == 0) ? 0 : 1);

  jlsParams.width = static_cast<int32_t>(GetColumns(ctx));
  jlsParams.height = static_cast<int32_t>(GetRows(ctx));
  jlsParams.bitsPerSample = static_cast<int32_t>(GetBitsAllocated(ctx));
  jlsParams.stride = static_cast<int32_t>(bytesAllocated * GetColumns(ctx) *
                                          GetSamplesPerPixel(ctx));
  jlsParams.components = static_cast<int32_t>(GetSamplesPerPixel(ctx));
  jlsParams.interleaveMode =
      GetSamplesPerPixel(ctx) == 1 ? InterleaveMode::None
      : GetPlanarConfiguration(ctx) == +PlanarConfigurationEnum::Interleaved
          ? InterleaveMode::Sample
          : InterleaveMode::Line;
  jlsParams.colorTransformation = ColorTransformation::None;
  jlsParams.allowedLossyError =
      params->Lossy ? static_cast<int32_t>(params->AllowedLossyError) : 0;

  // Taken from estimated_destination_size in charls_jpegls_encoder.cpp
  // Add 20% to the estimated size to avoid running out of buffer space.
  auto const estimatedJpegLsDataSize = GetColumns(ctx) * GetRows(ctx) *
                                           GetSamplesPerPixel(ctx) *
                                           bytesAllocated +
                                       1024 + 34;
  size_t actualJpegLsDataSize = 0;

  Buffer tmpBuffer;
  tmpBuffer.Reset(estimatedJpegLsDataSize * 0.2 + estimatedJpegLsDataSize);

  char errorMsg[256 + 1] = {'\0'};
  auto const retCode = JpegLsEncode(
      tmpBuffer.GetData(), tmpBuffer.GetSize(), &actualJpegLsDataSize,
      GetDecodedBuffer(ctx), GetDecodedBufferSize(ctx), &jlsParams, errorMsg);
  if (retCode != ApiResult::OK) {
    ThrowCodecsException("EncodeJpegLs::JpegLsEncode::" + string(errorMsg));
  }

  SetEncodedBufferSize(ctx, actualJpegLsDataSize);
  memcpy(GetEncodedBuffer(ctx), tmpBuffer.GetData(),
         actualJpegLsDataSize * sizeof(uint8_t));

  ENCODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void EncodeJpeg2000(CodecsContext *ctx,
                                         EncoderParameters *params) {
  ENCODER_TRACE_ENTRY(ctx, params);

  auto pCodec = opj_create_compress(OPJ_CODEC_J2K);
  if (!pCodec) {
    ThrowCodecsException(
        "EncodeJpeg2000::opj_create_compress::Failed to create codec");
  }

  opj_set_info_handler(pCodec, OpjMessageCallbackInfo, nullptr);
  opj_set_warning_handler(pCodec, OpjMessageCallbackWarning, nullptr);
  opj_set_error_handler(pCodec, OpjMessageCallbackError, nullptr);

  opj_cparameters_t parameters;
  opj_set_default_encoder_parameters(&parameters);
  parameters.irreversible = params->Lossy;
  parameters.prog_order = static_cast<OPJ_PROG_ORDER>(params->ProgressionOrder);
  if (GetPhotometricInterpretation(ctx) ==
          +PhotometricInterpretationEnum::Rgb &&
      params->AllowMct) {
    parameters.tcp_mct = 1;
  }

  parameters.tcp_numlayers++;
  parameters.tcp_rates[0] = static_cast<float>(
      params->Rate * GetBitsStored(ctx) / GetBitsAllocated(ctx));
  if (!params->Lossy) {
    parameters.tcp_rates[parameters.tcp_numlayers++] = 0;
  }
  parameters.cp_disto_alloc = 1;

  auto numberOfResolutions = 0;
  auto tw = GetColumns(ctx) >> 1;
  auto th = GetRows(ctx) >> 1;
  while (tw && th) {
    numberOfResolutions++;
    tw >>= 1;
    th >>= 1;
  }
  parameters.numresolution = numberOfResolutions > 6 ? 6 : numberOfResolutions;

  opj_image_cmptparm_t cmptparm[3] = {};
  for (auto i = 0u; i < GetSamplesPerPixel(ctx); i++) {
    cmptparm[i].bpp = static_cast<OPJ_UINT32>(GetBitsAllocated(ctx));
    cmptparm[i].prec = static_cast<OPJ_UINT32>(GetBitsStored(ctx));
    cmptparm[i].sgnd = static_cast<OPJ_UINT32>(GetPixelRepresentation(ctx));
    cmptparm[i].dx = static_cast<OPJ_UINT32>(parameters.subsampling_dx);
    cmptparm[i].dy = static_cast<OPJ_UINT32>(parameters.subsampling_dy);
    cmptparm[i].h = static_cast<OPJ_UINT32>(GetRows(ctx));
    cmptparm[i].w = static_cast<OPJ_UINT32>(GetColumns(ctx));
  }

  auto const colorspace =
      GetSamplesPerPixel(ctx) > 1 ? OPJ_CLRSPC_SRGB : OPJ_CLRSPC_GRAY;
  auto pImage =
      opj_image_create(static_cast<OPJ_UINT32>(GetSamplesPerPixel(ctx)),
                       &cmptparm[0], colorspace);
  pImage->x0 = static_cast<OPJ_UINT32>(parameters.image_offset_x0);
  pImage->y0 = static_cast<OPJ_UINT32>(parameters.image_offset_y0);
  pImage->x1 =
      pImage->x0 + (GetColumns(ctx) - 1) * parameters.subsampling_dx + 1;
  pImage->y1 = pImage->y0 + (GetRows(ctx) - 1) * parameters.subsampling_dy + 1;

  auto const numPixels = GetColumns(ctx) * GetRows(ctx);
  if (pImage->numcomps == 1) {
    if (pImage->comps[0].prec <= 8) {
      auto pDest = pImage->comps[0].data;
      auto pSource = GetDecodedBuffer(ctx);
      for (auto i = numPixels; i; i--) {
        *pDest++ = *pSource++;
      }
    }
    if (pImage->comps[0].prec > 8) {
      if (GetPixelRepresentation(ctx) == +PixelRepresentationEnum::Unsigned) {
        auto pDest = pImage->comps[0].data;
        auto pSource = reinterpret_cast<uint16_t *>(GetDecodedBuffer(ctx));
        for (auto i = numPixels; i; i--) {
          *pDest++ = *pSource++;
        }
      } else {
        auto pDest = pImage->comps[0].data;
        auto pSource = reinterpret_cast<int16_t *>(GetDecodedBuffer(ctx));
        for (auto i = numPixels; i; i--) {
          *pDest++ = *pSource++;
        }
      }
    }
  } else if (pImage->numcomps == 3) {
    auto pDestR = pImage->comps[0].data;
    auto pDestG = pImage->comps[1].data;
    auto pDestB = pImage->comps[2].data;
    auto pSource = GetDecodedBuffer(ctx);
    for (auto i = numPixels; i; i--) {
      *pDestR++ = *pSource++;
      *pDestG++ = *pSource++;
      *pDestB++ = *pSource++;
    }
  }

  if (!opj_setup_encoder(pCodec, &parameters, pImage)) {
    opj_image_destroy(pImage);
    opj_destroy_codec(pCodec);
    ThrowCodecsException(
        "EncodeJpeg2000::opj_setup_encoder::Failed to setup encoder");
  }

  auto estimatedJpeg2000DataSize = 0;
  for (auto i = 0; i < pImage->numcomps; i++) {
    estimatedJpeg2000DataSize +=
        pImage->comps[i].w * pImage->comps[i].h * pImage->comps[i].prec;
  }
  size_t actualJpeg2000DataSize = 0;

  Buffer tmpBuffer;
  tmpBuffer.Reset(0.1625 * estimatedJpeg2000DataSize + 2000);

  Jpeg2000Buffer destinationBuffer(tmpBuffer.GetData(), tmpBuffer.GetSize());
  auto pStream = OpjCreateMemoryStream(&destinationBuffer,
                                       OPJ_J2K_STREAM_CHUNK_SIZE, false);
  if (!pStream) {
    opj_image_destroy(pImage);
    opj_destroy_codec(pCodec);
    ThrowCodecsException(
        "EncodeJpeg2000::OpjCreateMemoryStream::Failed to create stream");
  }

  if (!opj_start_compress(pCodec, pImage, pStream)) {
    opj_stream_destroy(pStream);
    opj_image_destroy(pImage);
    opj_destroy_codec(pCodec);
    ThrowCodecsException(
        "EncodeJpeg2000::opj_start_compress::Failed to start compress");
  }

  if (!opj_encode(pCodec, pStream)) {
    opj_stream_destroy(pStream);
    opj_image_destroy(pImage);
    opj_destroy_codec(pCodec);
    ThrowCodecsException("EncodeJpeg2000::opj_encode::Failed to encode");
  }

  if (!opj_end_compress(pCodec, pStream)) {
    opj_stream_destroy(pStream);
    opj_image_destroy(pImage);
    opj_destroy_codec(pCodec);
    ThrowCodecsException(
        "EncodeJpeg2000::opj_end_compress::Failed to end compress");
  }

  opj_stream_destroy(pStream);
  opj_destroy_codec(pCodec);
  opj_image_destroy(pImage);

  actualJpeg2000DataSize = destinationBuffer.Offset;
  SetEncodedBufferSize(ctx, actualJpeg2000DataSize);
  memcpy(GetEncodedBuffer(ctx), tmpBuffer.GetData(),
         actualJpeg2000DataSize * sizeof(uint8_t));

  ENCODER_TRACE_EXIT(ctx);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void EncodeHtJpeg2000(CodecsContext *ctx,
                                           EncoderParameters *params) {
  ENCODER_TRACE_ENTRY(ctx, params);

  codestream codestream;
  mem_outfile destinationBuffer;

  auto const colorTransform = GetSamplesPerPixel(ctx) > 1 ? true : false;
  codestream.set_planar(colorTransform == false);
  codestream.set_tilepart_divisions(true, false);
  codestream.request_tlm_marker(true);

  auto siz = codestream.access_siz();
  siz.set_image_extent(point(GetColumns(ctx), GetRows(ctx)));
  siz.set_num_components(GetSamplesPerPixel(ctx));
  for (auto c = 0u; c < GetSamplesPerPixel(ctx); c++) {
    siz.set_component(c, point(1, 1), GetBitsAllocated(ctx),
                      GetPixelRepresentation(ctx) == 1 ? true : false);
  }
  siz.set_image_offset(point(0, 0));
  siz.set_tile_size(size(0, 0));
  siz.set_tile_offset(point(0, 0));

  auto cod = codestream.access_cod();
  const string ProgressionOrders[] = {"LRCP", "RLCP", "RPCL", "PCRL", "CPRL"};
  cod.set_progression_order(
      ProgressionOrders[params->ProgressionOrder].c_str());
  cod.set_color_transform(colorTransform);
  cod.set_block_dims(64, 64);
  cod.set_precinct_size(0, nullptr);
  cod.set_reversible(!params->Lossy);

  auto numberOfDecompositions = 0;
  auto tw = GetColumns(ctx);
  auto th = GetRows(ctx);
  while (tw > 64 && th > 64) {
    numberOfDecompositions++;
    tw = ceil(tw / 2);
    th = ceil(th / 2);
  }
  cod.set_num_decomposition(
      numberOfDecompositions > 6 ? 6 : numberOfDecompositions);

  destinationBuffer.open();

  comment_exchange com_ex;
  codestream.write_headers(&destinationBuffer, &com_ex, 0);

  ui32 next_comp;
  auto const bytesPerPixel = GetBitsAllocated(ctx) / 8;
  auto *cur_line = codestream.exchange(nullptr, next_comp);
  auto const height = siz.get_image_extent().y - siz.get_image_offset().y;
  for (auto y = 0; y < height; y++) {
    for (auto c = 0; c < siz.get_num_components(); c++) {
      auto dp = cur_line->i32;
      if (GetBitsAllocated(ctx) <= 8) {
        auto sp = reinterpret_cast<uint8_t *>(
            GetDecodedBuffer(ctx) +
            (y * GetColumns(ctx) * bytesPerPixel * siz.get_num_components()) +
            c);
        for (auto x = 0; x < GetColumns(ctx); x++) {
          *dp++ = *sp;
          sp += siz.get_num_components();
        }
      } else {
        if (GetPixelRepresentation(ctx) == +PixelRepresentationEnum::Signed) {
          auto sp = reinterpret_cast<int16_t *>(
              GetDecodedBuffer(ctx) + (y * GetColumns(ctx) * bytesPerPixel));
          for (auto x = 0; x < GetColumns(ctx); x++) {
            *dp++ = *sp++;
          }
        } else {
          auto sp = reinterpret_cast<uint16_t *>(
              GetDecodedBuffer(ctx) + (y * GetColumns(ctx) * bytesPerPixel));
          for (auto x = 0; x < GetColumns(ctx); x++) {
            *dp++ = *sp++;
          }
        }
      }
      cur_line = codestream.exchange(cur_line, next_comp);
    }
  }

  codestream.flush();

  auto const actualHtJpeg2000DataSize = destinationBuffer.tell();
  SetEncodedBufferSize(ctx, actualHtJpeg2000DataSize);
  memcpy(GetEncodedBuffer(ctx), destinationBuffer.get_data(),
         actualHtJpeg2000DataSize * sizeof(uint8_t));

  codestream.close();

  ENCODER_TRACE_EXIT(ctx);
}
}
