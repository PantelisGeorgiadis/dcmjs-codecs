#include "Jpeg2000Buffer.h"

#include <algorithm>
#include <limits>

#include "Exception.h"
#include "Logging.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
OPJ_SIZE_T OpjReadFromMemory(void *pBuffer, OPJ_SIZE_T nBytes,
                             Jpeg2000Buffer *pEncodedBuffer) {
  if (!pEncodedBuffer || !pEncodedBuffer->SrcData ||
      pEncodedBuffer->SrcSize == 0) {
    return static_cast<OPJ_SIZE_T>(-1);
  }
  if (pEncodedBuffer->Offset >= pEncodedBuffer->SrcSize) {
    return static_cast<OPJ_SIZE_T>(-1);
  }

  auto const bufferLength = pEncodedBuffer->SrcSize - pEncodedBuffer->Offset;
  auto const readLength = nBytes < bufferLength ? nBytes : bufferLength;
  memcpy(pBuffer, &pEncodedBuffer->SrcData[pEncodedBuffer->Offset], readLength);
  pEncodedBuffer->Offset += readLength;

  return readLength;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
OPJ_SIZE_T OpjWriteToMemory(void *pBuffer, OPJ_SIZE_T nBytes,
                            Jpeg2000Buffer *pJpeg2000Buffer) {
  if (!pJpeg2000Buffer || !pJpeg2000Buffer->SrcData ||
      pJpeg2000Buffer->SrcSize == 0) {
    return static_cast<OPJ_SIZE_T>(-1);
  }
  if (pJpeg2000Buffer->Offset >= pJpeg2000Buffer->SrcSize) {
    return static_cast<OPJ_SIZE_T>(-1);
  }

  auto const bufferLength = pJpeg2000Buffer->SrcSize - pJpeg2000Buffer->Offset;
  auto const writeLength = nBytes < bufferLength ? nBytes : bufferLength;
  memcpy(&pJpeg2000Buffer->SrcData[pJpeg2000Buffer->Offset], pBuffer,
         writeLength);
  pJpeg2000Buffer->Offset += writeLength;

  return writeLength;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
OPJ_OFF_T OpjSkipFromMemory(OPJ_OFF_T nBytes, Jpeg2000Buffer *pJpeg2000Buffer) {
  if (!pJpeg2000Buffer || !pJpeg2000Buffer->SrcData ||
      pJpeg2000Buffer->SrcSize == 0) {
    return static_cast<OPJ_SIZE_T>(-1);
  }
  if (nBytes < 0) {
    return static_cast<OPJ_SIZE_T>(-1);
  }
  if (pJpeg2000Buffer->Offset > numeric_limits<OPJ_SIZE_T>::max() - nBytes) {
    return static_cast<OPJ_SIZE_T>(-1);
  }

  auto const newoffset = pJpeg2000Buffer->Offset + nBytes;
  if (newoffset > pJpeg2000Buffer->SrcSize) {
    nBytes = pJpeg2000Buffer->SrcSize - pJpeg2000Buffer->Offset;
    pJpeg2000Buffer->Offset = pJpeg2000Buffer->SrcSize;
  } else {
    pJpeg2000Buffer->Offset = newoffset;
  }

  return nBytes;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
OPJ_BOOL OpjSeekFromMemory(OPJ_OFF_T nBytes, Jpeg2000Buffer *pJpeg2000Buffer) {
  if (!pJpeg2000Buffer || !pJpeg2000Buffer->SrcData ||
      pJpeg2000Buffer->SrcSize == 0) {
    return OPJ_FALSE;
  }
  if (nBytes < 0) {
    return OPJ_FALSE;
  }

  pJpeg2000Buffer->Offset =
      min(static_cast<OPJ_SIZE_T>(nBytes), pJpeg2000Buffer->SrcSize);

  return OPJ_TRUE;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
opj_stream_t *OPJ_CALLCONV
OpjCreateMemoryStream(Jpeg2000Buffer *pJpeg2000Buffer, OPJ_UINT32 const size,
                      bool const isReadStream) {
  if (!pJpeg2000Buffer) {
    return nullptr;
  }

  auto pStream = opj_stream_create(size, isReadStream);
  if (!pStream) {
    return nullptr;
  }

  opj_stream_set_user_data(pStream, pJpeg2000Buffer, nullptr);
  opj_stream_set_user_data_length(pStream, pJpeg2000Buffer->SrcSize);
  opj_stream_set_read_function(
      pStream, reinterpret_cast<opj_stream_read_fn>(OpjReadFromMemory));
  opj_stream_set_write_function(
      pStream, reinterpret_cast<opj_stream_write_fn>(OpjWriteToMemory));
  opj_stream_set_skip_function(
      pStream, reinterpret_cast<opj_stream_skip_fn>(OpjSkipFromMemory));
  opj_stream_set_seek_function(
      pStream, reinterpret_cast<opj_stream_seek_fn>(OpjSeekFromMemory));

  return pStream;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackInfo(char const *msg, void *unused) {
  OutputCodecsInfo("Jpeg2000Buffer::OpjMessageCallbackInfo::" + string(msg));
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackWarning(char const *msg, void *unused) {
  OutputCodecsInfo("Jpeg2000Buffer::OpjMessageCallbackWarning::" + string(msg));
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OpjMessageCallbackError(char const *msg, void *unused) {
  ThrowCodecsException("Jpeg2000Buffer::OpjMessageCallbackError::" +
                       string(msg));
}
