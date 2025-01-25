#include "DecoderParameters.h"

#include <sstream>

using namespace std;

extern "C" {
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE DecoderParameters *CreateDecoderParameters(void) {
  return new DecoderParameters;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void ReleaseDecoderParameters(
    DecoderParameters const *params) {
  if (params) {
    delete params;
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE bool GetConvertColorspaceToRgb(
    DecoderParameters const *params) {
  return params->ConvertColorspaceToRgb;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EMSCRIPTEN_KEEPALIVE void SetConvertColorspaceToRgb(
    DecoderParameters *params, bool const convertColorspaceToRgb) {
  params->ConvertColorspaceToRgb = convertColorspaceToRgb;
}
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
string DecoderParametersToString(DecoderParameters const *params) {
  ostringstream oss;

  oss << "ConvertColorspaceToRgb [JPEG]: "
      << to_string(params->ConvertColorspaceToRgb);

  return oss.str();
}
