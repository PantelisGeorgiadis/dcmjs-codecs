#include "JpegEncoder16.h"

#include <jerror16.h>
#include <jpeglib16.h>
#include <setjmp.h>

#include <string>
#include <vector>

#include "Exception.h"
#include "Logging.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#define JPEG16_BLOCKSIZE 16384

struct JpegEncoderDestinationManager16 : public jpeg_destination_mgr {
  vector<JOCTET> data;
};

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void EncodeJpeg16(CodecsContext *ctx, EncoderParameters *params) {
  jpeg_error_mgr jerr;

  jpeg_compress_struct cinfo;
  cinfo.err = jpeg_std_error(&jerr);
  cinfo.err->error_exit = [](j_common_ptr cinfo) {
    char buf[JMSG_LENGTH_MAX];
    (*cinfo->err->format_message)(cinfo, buf);
    ThrowCodecsException("JpegEncoder16::ErrorExit::" + string(buf));
  };
  cinfo.err->output_message = [](j_common_ptr cinfo) {
    char buf[JMSG_LENGTH_MAX];
    (*cinfo->err->format_message)(cinfo, buf);
    OutputCodecsInfo("JpegEncoder16::OutputMessage::" + string(buf));
  };
  cinfo.err->emit_message = [](j_common_ptr cinfo, int messageLevel) {
    char buf[JMSG_LENGTH_MAX];
    (*cinfo->err->format_message)(cinfo, buf);
    OutputCodecsInfo("JpegEncoder16::EmitMessage::" + string(buf));
  };
  jpeg_create_compress(&cinfo);

  JpegEncoderDestinationManager16 dest;
  dest.init_destination = [](j_compress_ptr cinfo) {
    auto dest =
        reinterpret_cast<JpegEncoderDestinationManager16 *>(cinfo->dest);
    dest->data.resize(JPEG16_BLOCKSIZE);
    dest->next_output_byte = &dest->data[0];
    dest->free_in_buffer = dest->data.size();
  };
  dest.empty_output_buffer = [](j_compress_ptr cinfo) -> boolean {
    auto dest =
        reinterpret_cast<JpegEncoderDestinationManager16 *>(cinfo->dest);
    auto const oldSize = dest->data.size();
    dest->data.resize(oldSize + JPEG16_BLOCKSIZE);
    cinfo->dest->next_output_byte = &dest->data[oldSize];
    cinfo->dest->free_in_buffer = dest->data.size() - oldSize;

    return TRUE;
  };
  dest.term_destination = [](j_compress_ptr cinfo) {
    auto dest =
        reinterpret_cast<JpegEncoderDestinationManager16 *>(cinfo->dest);
    dest->data.resize(dest->data.size() - cinfo->dest->free_in_buffer);
  };
  cinfo.dest = &dest;

  cinfo.image_width = static_cast<JDIMENSION>(GetColumns(ctx));
  cinfo.image_height = static_cast<JDIMENSION>(GetRows(ctx));
  cinfo.input_components = static_cast<int>(GetSamplesPerPixel(ctx));
  cinfo.in_color_space = GetSamplesPerPixel(ctx) > 1 ? JCS_RGB : JCS_GRAYSCALE;

  jpeg_set_defaults(&cinfo);
  cinfo.optimize_coding = true;

  if (params->Lossy) {
    jpeg_set_quality(&cinfo, static_cast<int>(params->Quality), 0);
    if (cinfo.jpeg_color_space == JCS_YCbCr &&
        params->SampleFactor != SampleFactorEnum::Unknown) {
      switch (params->SampleFactor) {
        case SampleFactorEnum::Sf444:
          cinfo.comp_info[0].h_samp_factor = 1;
          cinfo.comp_info[0].v_samp_factor = 1;
          break;
        case SampleFactorEnum::Sf422:
          cinfo.comp_info[0].h_samp_factor = 2;
          cinfo.comp_info[0].v_samp_factor = 1;
          break;
      }
    } else {
      if (params->SampleFactor == SampleFactorEnum::Unknown) {
        jpeg_set_colorspace(&cinfo, cinfo.in_color_space);
      }
      cinfo.comp_info[0].h_samp_factor = 1;
      cinfo.comp_info[0].v_samp_factor = 1;
    }
  } else {
    jpeg_simple_lossless(&cinfo, static_cast<int>(params->Predictor),
                         static_cast<int>(params->PointTransform));
    jpeg_set_colorspace(&cinfo, cinfo.in_color_space);
    cinfo.comp_info[0].h_samp_factor = 1;
    cinfo.comp_info[0].v_samp_factor = 1;
  }

  for (auto sfi = 1; sfi < MAX_COMPONENTS; sfi++) {
    cinfo.comp_info[sfi].h_samp_factor = 1;
    cinfo.comp_info[sfi].v_samp_factor = 1;
  }

  cinfo.smoothing_factor = static_cast<int>(params->SmoothingFactor);

  jpeg_start_compress(&cinfo, TRUE);

  JSAMPROW rowPointer[1];
  auto const bytesAllocated =
      (GetBitsAllocated(ctx) / 8) + ((GetBitsAllocated(ctx) % 8 == 0) ? 0 : 1);
  auto const rowStride = GetColumns(ctx) * GetSamplesPerPixel(ctx) *
                         (GetBitsStored(ctx) <= 8 ? 1 : bytesAllocated);

  auto pDecodedBuffer = GetDecodedBuffer(ctx);
  while (cinfo.next_scanline < cinfo.image_height) {
    rowPointer[0] = reinterpret_cast<JSAMPLE *>(
        &pDecodedBuffer[cinfo.next_scanline * rowStride]);
    jpeg_write_scanlines(&cinfo, rowPointer, 1);
  }

  jpeg_finish_compress(&cinfo);
  jpeg_destroy_compress(&cinfo);

  auto const actualJpegDataSize = dest.data.size();
  SetEncodedBufferSize(ctx, actualJpegDataSize);
  memcpy(GetEncodedBuffer(ctx), dest.data.data(), actualJpegDataSize);
}
