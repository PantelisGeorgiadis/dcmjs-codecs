#include "JpegXlEncoder.h"

#include <cstring>
#include <stdexcept>
#include <vector>

#include "Exception.h"
#include "Logging.h"
#include "jxl/encode.h"
#include "jxl/types.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void EncodeJpegXlImpl(CodecsContext* ctx, EncoderParameters* params) {
  auto const width = GetColumns(ctx);
  auto const height = GetRows(ctx);
  auto const samplesPerPixel = GetSamplesPerPixel(ctx);
  auto const bitsAllocated = GetBitsAllocated(ctx);
  auto const bitsStored = GetBitsStored(ctx);
  auto const* pixelData = GetDecodedBuffer(ctx);
  auto const pixelDataSize = GetDecodedBufferSize(ctx);

  auto* enc = JxlEncoderCreate(nullptr);
  if (!enc) {
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderCreate::Failed to create encoder");
  }

  JxlBasicInfo basicInfo;
  JxlEncoderInitBasicInfo(&basicInfo);
  basicInfo.xsize = static_cast<uint32_t>(width);
  basicInfo.ysize = static_cast<uint32_t>(height);
  basicInfo.bits_per_sample = static_cast<uint32_t>(bitsAllocated);
  basicInfo.exponent_bits_per_sample = 0;
  basicInfo.num_color_channels = static_cast<uint32_t>(samplesPerPixel);
  basicInfo.num_extra_channels = 0;
  basicInfo.uses_original_profile = JXL_TRUE;

  if (JxlEncoderSetBasicInfo(enc, &basicInfo) != JXL_ENC_SUCCESS) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderSetBasicInfo::Failed to set basic info");
  }

  JxlColorEncoding colorEncoding = {};
  colorEncoding.color_space =
      samplesPerPixel == 1 ? JXL_COLOR_SPACE_GRAY : JXL_COLOR_SPACE_RGB;
  colorEncoding.white_point = JXL_WHITE_POINT_D65;
  colorEncoding.primaries = JXL_PRIMARIES_SRGB;
  colorEncoding.transfer_function = samplesPerPixel == 1
                                        ? JXL_TRANSFER_FUNCTION_LINEAR
                                        : JXL_TRANSFER_FUNCTION_SRGB;
  colorEncoding.rendering_intent = JXL_RENDERING_INTENT_RELATIVE;

  if (JxlEncoderSetColorEncoding(enc, &colorEncoding) != JXL_ENC_SUCCESS) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderSetColorEncoding::Failed to set color "
        "encoding");
  }

  auto* frameSettings = JxlEncoderFrameSettingsCreate(enc, nullptr);
  if (!frameSettings) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderFrameSettingsCreate::Failed to create frame "
        "settings");
  }

  if (!params->Lossy) {
    if (JxlEncoderSetFrameLossless(frameSettings, JXL_TRUE) !=
        JXL_ENC_SUCCESS) {
      JxlEncoderDestroy(enc);
      ThrowCodecsException("EncodeJpegXl::JxlEncoderSetFrameLossless::Failed");
    }
  } else {
    auto const quality = static_cast<float>(params->Quality);
    auto const distance = JxlEncoderDistanceFromQuality(quality);
    if (JxlEncoderSetFrameDistance(frameSettings, distance) !=
        JXL_ENC_SUCCESS) {
      JxlEncoderDestroy(enc);
      ThrowCodecsException("EncodeJpegXl::JxlEncoderSetFrameDistance::Failed");
    }
  }

  JxlBitDepth bitDepth = {};
  bitDepth.type = JXL_BIT_DEPTH_FROM_CODESTREAM;
  bitDepth.bits_per_sample = static_cast<uint32_t>(bitsStored);
  bitDepth.exponent_bits_per_sample = 0;

  if (JxlEncoderSetFrameBitDepth(frameSettings, &bitDepth) != JXL_ENC_SUCCESS) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException("EncodeJpegXl::JxlEncoderSetFrameBitDepth::Failed");
  }

  JxlPixelFormat pixelFormat = {};
  pixelFormat.num_channels = static_cast<uint32_t>(samplesPerPixel);
  pixelFormat.data_type = bitsAllocated <= 8 ? JXL_TYPE_UINT8 : JXL_TYPE_UINT16;
  pixelFormat.endianness = JXL_NATIVE_ENDIAN;
  pixelFormat.align = 0;

  if (JxlEncoderAddImageFrame(frameSettings, &pixelFormat, pixelData,
                              pixelDataSize) != JXL_ENC_SUCCESS) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderAddImageFrame::Failed to add image frame");
  }

  JxlEncoderCloseInput(enc);

  vector<uint8_t> outputBuffer(65536);
  auto* nextOut = outputBuffer.data();
  auto availOut = outputBuffer.size();
  JxlEncoderStatus status = JXL_ENC_NEED_MORE_OUTPUT;

  while (status == JXL_ENC_NEED_MORE_OUTPUT) {
    status = JxlEncoderProcessOutput(enc, &nextOut, &availOut);
    if (status == JXL_ENC_NEED_MORE_OUTPUT) {
      size_t const offset = nextOut - outputBuffer.data();
      outputBuffer.resize(outputBuffer.size() * 2);
      nextOut = outputBuffer.data() + offset;
      availOut = outputBuffer.size() - offset;
    }
  }

  if (status != JXL_ENC_SUCCESS) {
    JxlEncoderDestroy(enc);
    ThrowCodecsException(
        "EncodeJpegXl::JxlEncoderProcessOutput::Encoding failed");
  }

  size_t const encodedSize = nextOut - outputBuffer.data();
  JxlEncoderDestroy(enc);

  SetEncodedBufferSize(ctx, encodedSize);
  memcpy(GetEncodedBuffer(ctx), outputBuffer.data(), encodedSize);
}
