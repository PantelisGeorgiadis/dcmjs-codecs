#include "JpegXlDecoder.h"

#include <cstring>
#include <vector>

#include "Exception.h"
#include "jxl/cms.h"
#include "jxl/decode.h"
#include "jxl/types.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void DecodeJpegXlImpl(CodecsContext* ctx, DecoderParameters* params) {
  auto const* encodedBuffer = GetEncodedBuffer(ctx);
  auto const encodedSize = GetEncodedBufferSize(ctx);

  auto* dec = JxlDecoderCreate(nullptr);
  if (!dec) {
    ThrowCodecsException(
        "DecodeJpegXl::JxlDecoderCreate::Failed to create decoder");
  }

  if (JxlDecoderSetCms(dec, *JxlGetDefaultCms()) != JXL_DEC_SUCCESS) {
    JxlDecoderDestroy(dec);
    ThrowCodecsException("DecodeJpegXl::JxlDecoderSetCms::Failed");
  }

  if (JxlDecoderSubscribeEvents(dec,
                                JXL_DEC_BASIC_INFO | JXL_DEC_COLOR_ENCODING |
                                    JXL_DEC_FULL_IMAGE) != JXL_DEC_SUCCESS) {
    JxlDecoderDestroy(dec);
    ThrowCodecsException("DecodeJpegXl::JxlDecoderSubscribeEvents::Failed");
  }

  if (JxlDecoderSetInput(dec, encodedBuffer, encodedSize) != JXL_DEC_SUCCESS) {
    JxlDecoderDestroy(dec);
    ThrowCodecsException("DecodeJpegXl::JxlDecoderSetInput::Failed");
  }
  JxlDecoderCloseInput(dec);

  JxlPixelFormat pixelFormat = {};
  vector<uint8_t> decodedPixels;
  size_t samplesPerPixel = 0;

  for (;;) {
    auto const status = JxlDecoderProcessInput(dec);

    if (status == JXL_DEC_ERROR) {
      JxlDecoderDestroy(dec);
      ThrowCodecsException(
          "DecodeJpegXl::JxlDecoderProcessInput::Decoding failed");
    }

    if (status == JXL_DEC_NEED_MORE_INPUT) {
      JxlDecoderDestroy(dec);
      ThrowCodecsException(
          "DecodeJpegXl::JxlDecoderProcessInput::Unexpected end of input");
    }

    if (status == JXL_DEC_BASIC_INFO) {
      JxlBasicInfo basicInfo;
      if (JxlDecoderGetBasicInfo(dec, &basicInfo) != JXL_DEC_SUCCESS) {
        JxlDecoderDestroy(dec);
        ThrowCodecsException("DecodeJpegXl::JxlDecoderGetBasicInfo::Failed");
      }

      auto const bitsStored = static_cast<size_t>(basicInfo.bits_per_sample);
      auto const bitsAllocated = bitsStored <= 8 ? 8u : 16u;
      samplesPerPixel = static_cast<size_t>(basicInfo.num_color_channels);

      pixelFormat.num_channels = static_cast<uint32_t>(samplesPerPixel);
      pixelFormat.data_type =
          bitsAllocated <= 8 ? JXL_TYPE_UINT8 : JXL_TYPE_UINT16;
      pixelFormat.endianness = JXL_NATIVE_ENDIAN;
      pixelFormat.align = 0;
      continue;
    }

    if (status == JXL_DEC_COLOR_ENCODING) {
      if (samplesPerPixel > 1) {
        JxlColorEncoding srgb = {};
        srgb.color_space = JXL_COLOR_SPACE_RGB;
        srgb.white_point = JXL_WHITE_POINT_D65;
        srgb.primaries = JXL_PRIMARIES_SRGB;
        srgb.transfer_function = JXL_TRANSFER_FUNCTION_SRGB;
        srgb.rendering_intent = JXL_RENDERING_INTENT_RELATIVE;
        if (JxlDecoderSetOutputColorProfile(dec, &srgb, nullptr, 0) !=
            JXL_DEC_SUCCESS) {
          JxlDecoderDestroy(dec);
          ThrowCodecsException(
              "DecodeJpegXl::JxlDecoderSetOutputColorProfile::Failed");
        }
      }
      continue;
    }

    if (status == JXL_DEC_NEED_IMAGE_OUT_BUFFER) {
      size_t bufferSize = 0;
      if (JxlDecoderImageOutBufferSize(dec, &pixelFormat, &bufferSize) !=
          JXL_DEC_SUCCESS) {
        JxlDecoderDestroy(dec);
        ThrowCodecsException(
            "DecodeJpegXl::JxlDecoderImageOutBufferSize::Failed");
      }

      decodedPixels.resize(bufferSize);
      if (JxlDecoderSetImageOutBuffer(dec, &pixelFormat, decodedPixels.data(),
                                      decodedPixels.size()) !=
          JXL_DEC_SUCCESS) {
        JxlDecoderDestroy(dec);
        ThrowCodecsException(
            "DecodeJpegXl::JxlDecoderSetImageOutBuffer::Failed");
      }
      continue;
    }

    if (status == JXL_DEC_FULL_IMAGE) {
      continue;
    }

    if (status == JXL_DEC_SUCCESS) {
      break;
    }

    JxlDecoderDestroy(dec);
    ThrowCodecsException(
        "DecodeJpegXl::JxlDecoderProcessInput::Unexpected status");
  }

  JxlDecoderDestroy(dec);

  auto const decodedSize = decodedPixels.size();
  SetDecodedBufferSize(ctx, decodedSize);
  memcpy(GetDecodedBuffer(ctx), decodedPixels.data(), decodedSize);
}
