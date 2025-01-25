#include "EncoderParameters.h"

#include <sstream>

using namespace std;

extern "C" {
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE EncoderParameters *CreateEncoderParameters(void) {
  return new EncoderParameters;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void ReleaseEncoderParameters(
    EncoderParameters const *params) {
  if (params) {
    delete params;
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE bool GetLossy(EncoderParameters const *params) {
  return params->Lossy;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetLossy(EncoderParameters *params,
                                   bool const lossy) {
  params->Lossy = lossy;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetQuality(EncoderParameters const *params) {
  return params->Quality;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetQuality(EncoderParameters *params,
                                     size_t const quality) {
  params->Quality = quality;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t
GetSmoothingFactor(EncoderParameters const *params) {
  return params->SmoothingFactor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetSmoothingFactor(EncoderParameters *params,
                                             size_t const smoothingFactor) {
  params->SmoothingFactor = smoothingFactor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetSampleFactor(EncoderParameters const *params) {
  return params->SampleFactor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetSampleFactor(EncoderParameters *params,
                                          size_t const sampleFactor) {
  params->SampleFactor = sampleFactor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetPredictor(EncoderParameters const *params) {
  return params->Predictor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetPredictor(EncoderParameters *params,
                                       size_t const predictor) {
  params->Predictor = predictor;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetPointTransform(EncoderParameters const *params) {
  return params->PointTransform;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetPointTransform(EncoderParameters *params,
                                            size_t const pointTransform) {
  params->PointTransform = pointTransform;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t
GetAllowedLossyError(EncoderParameters const *params) {
  return params->AllowedLossyError;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetAllowedLossyError(EncoderParameters *params,
                                               size_t const allowedLossyError) {
  params->AllowedLossyError = allowedLossyError;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t
GetProgressionOrder(EncoderParameters const *params) {
  return params->ProgressionOrder;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetProgressionOrder(EncoderParameters *params,
                                              size_t const progressionOrder) {
  params->ProgressionOrder = progressionOrder;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetRate(EncoderParameters const *params) {
  return params->Rate;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetRate(EncoderParameters *params,
                                  size_t const rate) {
  params->Rate = rate;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE size_t GetAllowMct(EncoderParameters const *params) {
  return params->AllowMct;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetAllowMct(EncoderParameters *params,
                                      size_t const allowMct) {
  params->AllowMct = allowMct;
}
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
string EncoderParametersToString(EncoderParameters const *params) {
  ostringstream oss;
  auto const sampleFactor =
      SampleFactorEnum::_from_integral_nothrow(params->SampleFactor);
  auto const progressionOrder =
      ProgressionOrderEnum::_from_integral_nothrow(params->ProgressionOrder);

  oss << "Lossy: " << to_string(params->Lossy);
  oss << ", Quality [JPEG]: " << to_string(params->Quality);
  oss << ", SmoothingFactor [JPEG]: " << to_string(params->SmoothingFactor);
  oss << ", SampleFactor [JPEG]: "
      << (sampleFactor ? sampleFactor->_to_string() : "");
  oss << ", Predictor [JPEG]: " << to_string(params->Predictor);
  oss << ", PointTransform [JPEG]: " << to_string(params->PointTransform);
  oss << ", AllowedLossyError [JPEG-LS]: "
      << to_string(params->AllowedLossyError);
  oss << ", ProgressionOrder [JPEG 2000 / HT-JPEG 2000]: "
      << (progressionOrder ? progressionOrder->_to_string() : "");
  oss << ", Rate [JPEG 2000]: " << to_string(params->Rate);
  oss << ", AllowMct [JPEG 2000]: " << to_string(params->AllowMct);

  return oss.str();
}
