#include "JpegDecoder8.h"

#include <jerror8.h>
#include <jpeglib8.h>
#include <setjmp.h>

#include <algorithm>
#include <cstdio>
#include <string>
#include <vector>

#include "Exception.h"
#include "Logging.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void DecodeJpeg8(CodecsContext *ctx, DecoderParameters *params) {
  jpeg_error_mgr jerr;

  jpeg_decompress_struct dinfo;
  dinfo.err = jpeg_std_error(&jerr);
  dinfo.err->error_exit = [](j_common_ptr dinfo) {
    char buf[JMSG_LENGTH_MAX];
    (*dinfo->err->format_message)(dinfo, buf);
    ThrowCodecsException("JpegDecoder8::ErrorExit::" + string(buf));
  };
  dinfo.err->output_message = [](j_common_ptr dinfo) {
    char buf[JMSG_LENGTH_MAX];
    (*dinfo->err->format_message)(dinfo, buf);
    OutputCodecsInfo("JpegDecoder8::OutputMessage::" + string(buf));
  };
  dinfo.err->emit_message = [](j_common_ptr dinfo, int messageLevel) {
    char buf[JMSG_LENGTH_MAX];
    (*dinfo->err->format_message)(dinfo, buf);
    OutputCodecsInfo("JpegDecoder8::EmitMessage::" + string(buf));
  };
  jpeg_create_decompress(&dinfo);

  jpeg_source_mgr src;
  memset(&src, 0, sizeof(src));

  src.init_source = [](j_decompress_ptr dinfo) {};
  src.fill_input_buffer = [](j_decompress_ptr dinfo) -> boolean {
    static uint8_t buf[4] = {0xff, 0xd9, 0, 0};
    dinfo->src->next_input_byte = buf;
    dinfo->src->bytes_in_buffer = 2;

    return TRUE;
  };
  src.skip_input_data = [](j_decompress_ptr dinfo, long nBytes) {
    auto &src = *dinfo->src;
    if (nBytes > 0) {
      while (nBytes > static_cast<long>(src.bytes_in_buffer)) {
        nBytes -= static_cast<long>(src.bytes_in_buffer);
        (*src.fill_input_buffer)(dinfo);
      }
      src.next_input_byte += nBytes;
      src.bytes_in_buffer -= nBytes;
    }
  };
  src.resync_to_restart = jpeg_resync_to_restart;
  src.term_source = [](j_decompress_ptr dinfo) {};
  src.bytes_in_buffer = GetEncodedBufferSize(ctx);
  src.next_input_byte = GetEncodedBuffer(ctx);
  dinfo.src = &src;

  if (jpeg_read_header(&dinfo, TRUE) == JPEG_SUSPENDED) {
    ThrowCodecsException(
        "JpegDecoder8::DecodeJpeg8::jpeg_read_header::Suspended");
  }

  if (params->ConvertColorspaceToRgb && (dinfo.out_color_space == JCS_YCbCr ||
                                         dinfo.out_color_space == JCS_RGB)) {
    if (GetPixelRepresentation(ctx) == +PixelRepresentationEnum::Signed) {
      ThrowCodecsException(
          "JpegDecoder8::DecodeJpeg8::JPEG codec unable to perform colorspace "
          "conversion on signed pixel data");
    }
    dinfo.out_color_space = JCS_RGB;
    // Tag patching is performed at the codec level however this is an exception
    // due to required JPEG colorspace information
    SetPhotometricInterpretation(ctx, +PhotometricInterpretationEnum::Rgb);
    SetPlanarConfiguration(ctx, +PlanarConfigurationEnum::Interleaved);
  } else {
    dinfo.jpeg_color_space = JCS_UNKNOWN;
    dinfo.out_color_space = JCS_UNKNOWN;
  }

  auto const bytesAllocated =
      (GetBitsAllocated(ctx) / 8) + ((GetBitsAllocated(ctx) % 8 == 0) ? 0 : 1);
  auto const decodedBufferSize = dinfo.image_width * dinfo.image_height *
                                 bytesAllocated * dinfo.num_components;
  SetDecodedBufferSize(ctx, decodedBufferSize);

  jpeg_start_decompress(&dinfo);

  vector<JSAMPLE *> rows;
  auto const scanlineBytes =
      dinfo.image_width * bytesAllocated * dinfo.num_components;
  auto pDecodedBuffer = GetDecodedBuffer(ctx);
  while (dinfo.output_scanline < dinfo.output_height) {
    auto const height = min<size_t>(dinfo.output_height - dinfo.output_scanline,
                                    dinfo.rec_outbuf_height);
    rows.resize(height);
    auto ptr = pDecodedBuffer;
    for (auto i = 0u; i < height; ++i, ptr += scanlineBytes) {
      rows[i] = reinterpret_cast<JSAMPLE *>(ptr);
    }
    auto const n = jpeg_read_scanlines(
        &dinfo, rows.data(), static_cast<JDIMENSION>(dinfo.rec_outbuf_height));
    pDecodedBuffer += scanlineBytes * n;
  }

  jpeg_finish_decompress(&dinfo);
  jpeg_destroy_decompress(&dinfo);
}
