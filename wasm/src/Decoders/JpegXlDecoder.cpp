#include "JpegXlDecoder.h"

#include <cstring>
#include <vector>

#include "Exception.h"
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

  if (JxlDecoderSubscribeEvents(dec, JXL_DEC_BASIC_INFO | JXL_DEC_FULL_IMAGE) !=
      JXL_DEC_SUCCESS) {
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

      auto const width = static_cast<size_t>(basicInfo.xsize);
      auto const height = static_cast<size_t>(basicInfo.ysize);
      auto const bitsStored = static_cast<size_t>(basicInfo.bits_per_sample);
      auto const bitsAllocated = bitsStored <= 8 ? 8u : 16u;
      auto const samplesPerPixel =
          static_cast<size_t>(basicInfo.num_color_channels);

      if (GetColumns(ctx) != 0) {
        if (GetColumns(ctx) != width) {
          JxlDecoderDestroy(dec);
          ThrowCodecsException("DecodeJpegXl::Decoded width mismatch");
        }
      } else {
        SetColumns(ctx, width);
      }
      if (GetRows(ctx) != 0) {
        if (GetRows(ctx) != height) {
          JxlDecoderDestroy(dec);
          ThrowCodecsException("DecodeJpegXl::Decoded height mismatch");
        }
      } else {
        SetRows(ctx, height);
      }
      if (GetSamplesPerPixel(ctx) != 0) {
        if (GetSamplesPerPixel(ctx) != samplesPerPixel) {
          JxlDecoderDestroy(dec);
          ThrowCodecsException(
              "DecodeJpegXl::Decoded samples per pixel mismatch");
        }
      } else {
        SetSamplesPerPixel(ctx, samplesPerPixel);
      }
      if (GetBitsAllocated(ctx) != 0) {
        if (GetBitsAllocated(ctx) != bitsAllocated) {
          JxlDecoderDestroy(dec);
          ThrowCodecsException(
              "DecodeJpegXl::Decoded bits allocated mismatch");
        }
      } else {
        SetBitsAllocated(ctx, bitsAllocated);
      }
      if (GetBitsStored(ctx) == 0) {
        SetBitsStored(ctx, bitsStored);
      }
      SetPlanarConfiguration(ctx, +PlanarConfigurationEnum::Interleaved);

      pixelFormat.num_channels = static_cast<uint32_t>(samplesPerPixel);
      pixelFormat.data_type =
          bitsAllocated <= 8 ? JXL_TYPE_UINT8 : JXL_TYPE_UINT16;
      pixelFormat.endianness = JXL_NATIVE_ENDIAN;
      pixelFormat.align = 0;
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
