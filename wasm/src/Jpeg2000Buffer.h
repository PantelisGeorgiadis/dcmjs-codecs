#pragma once

#include <openjpeg.h>

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
struct Jpeg2000Buffer {
 public:
  Jpeg2000Buffer(uint8_t *srcData, OPJ_SIZE_T const srcSize)
      : SrcData(srcData), SrcSize(srcSize), Offset(0) {}

  uint8_t *SrcData;
  OPJ_SIZE_T SrcSize;
  OPJ_SIZE_T Offset;

  Jpeg2000Buffer(Jpeg2000Buffer const &) = delete;
  Jpeg2000Buffer &operator=(Jpeg2000Buffer const &) = delete;
};

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
opj_stream_t *OPJ_CALLCONV OpjCreateMemoryStream(Jpeg2000Buffer *pBuffer,
                                                 OPJ_UINT32 const size,
                                                 bool const isReadStream);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackInfo(char const *message, void *f);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackWarning(char const *message, void *f);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackError(char const *message, void *f);
