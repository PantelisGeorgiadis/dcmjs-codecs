#include "CodecsContext.h"

#include <sstream>

using namespace std;

extern "C" {
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE CodecsContext *CreateCodecsContext(void) {
  return new CodecsContext;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void ReleaseCodecsContext(CodecsContext const *ctx) {
  if (ctx) {
    delete ctx;
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetColumns(CodecsContext const *ctx) {
  return ctx->Columns;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetColumns(CodecsContext *ctx, size_t const columns) {
  ctx->Columns = columns;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetRows(CodecsContext const *ctx) {
  return ctx->Rows;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetRows(CodecsContext *ctx, size_t const rows) {
  ctx->Rows = rows;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetBitsAllocated(CodecsContext const *ctx) {
  return ctx->BitsAllocated;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetBitsAllocated(CodecsContext *ctx,
                                           size_t const bitsAllocated) {
  ctx->BitsAllocated = bitsAllocated;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetBitsStored(CodecsContext const *ctx) {
  return ctx->BitsStored;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetBitsStored(CodecsContext *ctx,
                                        size_t const bitsStored) {
  ctx->BitsStored = bitsStored;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetSamplesPerPixel(CodecsContext const *ctx) {
  return ctx->SamplesPerPixel;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetSamplesPerPixel(CodecsContext *ctx,
                                             size_t const samplesPerPixel) {
  ctx->SamplesPerPixel = samplesPerPixel;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetPixelRepresentation(CodecsContext const *ctx) {
  return ctx->PixelRepresentation;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetPixelRepresentation(
    CodecsContext *ctx, size_t const pixelRepresentation) {
  ctx->PixelRepresentation = pixelRepresentation;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetPlanarConfiguration(CodecsContext const *ctx) {
  return ctx->PlanarConfiguration;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetPlanarConfiguration(
    CodecsContext *ctx, size_t const planarConfiguration) {
  ctx->PlanarConfiguration = planarConfiguration;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t
GetPhotometricInterpretation(CodecsContext const *ctx) {
  return ctx->PhotometricInterpretation;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetPhotometricInterpretation(
    CodecsContext *ctx, size_t const photometricInterpretation) {
  ctx->PhotometricInterpretation = photometricInterpretation;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE uint8_t *GetEncodedBuffer(CodecsContext const *ctx) {
  return ctx->EncodedBuffer.GetData();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetEncodedBufferSize(CodecsContext const *ctx) {
  return ctx->EncodedBuffer.GetSize();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetEncodedBuffer(CodecsContext *ctx,
                                           uint8_t const *data,
                                           size_t const size) {
  ctx->EncodedBuffer.Reset(size);
  memcpy(ctx->EncodedBuffer.GetData(), data, size);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetEncodedBufferSize(CodecsContext *ctx,
                                               size_t const size) {
  ctx->EncodedBuffer.Reset(size);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE uint8_t *GetDecodedBuffer(CodecsContext const *ctx) {
  return ctx->DecodedBuffer.GetData();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetDecodedBufferSize(CodecsContext const *ctx) {
  return ctx->DecodedBuffer.GetSize();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetDecodedBuffer(CodecsContext *ctx,
                                           uint8_t const *data,
                                           size_t const size) {
  ctx->DecodedBuffer.Reset(size);
  memcpy(ctx->DecodedBuffer.GetData(), data, size);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetDecodedBufferSize(CodecsContext *ctx,
                                               size_t const size) {
  ctx->DecodedBuffer.Reset(size);
}
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
string ContextToString(CodecsContext const *ctx) {
  ostringstream oss;
  auto const pixelRepresentation =
      PixelRepresentationEnum::_from_integral_nothrow(
          GetPixelRepresentation(ctx));
  auto const planarConfiguration =
      PlanarConfigurationEnum::_from_integral_nothrow(
          GetPlanarConfiguration(ctx));
  auto const photometricInterpretation =
      PhotometricInterpretationEnum::_from_integral_nothrow(
          GetPhotometricInterpretation(ctx));

  oss << "Columns: " << to_string(GetColumns(ctx));
  oss << ", Rows: " << to_string(GetRows(ctx));
  oss << ", BitsAllocated: " << to_string(GetBitsAllocated(ctx));
  oss << ", BitsStored: " << to_string(GetBitsStored(ctx));
  oss << ", SamplesPerPixel: " << to_string(GetSamplesPerPixel(ctx));
  oss << ", PixelRepresentation: "
      << (pixelRepresentation ? pixelRepresentation->_to_string() : "");
  oss << ", PlanarConfiguration: "
      << (planarConfiguration ? planarConfiguration->_to_string() : "");
  oss << ", PhotometricInterpretation: "
      << (photometricInterpretation ? photometricInterpretation->_to_string()
                                    : "");
  oss << ", EncodedBufferSize: " << to_string(GetEncodedBufferSize(ctx));
  oss << ", DecodedBufferSize: " << to_string(GetDecodedBufferSize(ctx));

  return oss.str();
}
