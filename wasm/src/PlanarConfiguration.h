#pragma once

#include <cstdio>

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void ChangePlanarConfiguration(uint8_t* pixelData, size_t numValues,
                               size_t bitsAllocated, size_t samplesPerPixel,
                               size_t oldPlanarConfiguration);
