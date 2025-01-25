#include "PlanarConfiguration.h"

#include <string>
#include <vector>

#include "CodecsContext.h"
#include "Exception.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void ChangePlanarConfiguration(uint8_t* pixelData, size_t const numValues,
                               size_t const bitsAllocated,
                               size_t const samplesPerPixel,
                               size_t const oldPlanarConfiguration) {
  auto const bytesAllocated = bitsAllocated / 8;
  auto const numPixels = numValues / samplesPerPixel;

  if (bytesAllocated == 1) {
    vector<uint8_t> buffer(numValues);
    if (oldPlanarConfiguration == +PlanarConfigurationEnum::Planar) {
      for (auto n = 0; n < numPixels; ++n) {
        for (auto s = 0; s < samplesPerPixel; ++s) {
          buffer[n * samplesPerPixel + s] = pixelData[n + numPixels * s];
        }
      }
    } else {
      for (auto n = 0; n < numPixels; ++n) {
        for (auto s = 0; s < samplesPerPixel; ++s) {
          buffer[n + numPixels * s] = pixelData[n * samplesPerPixel + s];
        }
      }
    }
    memcpy(pixelData, buffer.data(), numValues);
  } else {
    ThrowCodecsException(
        "ChangePlanarConfiguration::Unsupported bits allocated (" +
        to_string(bitsAllocated) + ")");
  }
}
