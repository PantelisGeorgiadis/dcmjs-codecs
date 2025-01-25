#pragma once

#include <string>

#include "CodecsContext.h"
#include "DecoderParameters.h"
#include "EncoderParameters.h"

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#ifdef WASM_CODECS_TRACE
#define TRACE(...)             \
  do {                         \
    char buf[1024];            \
    sprintf(buf, __VA_ARGS__); \
    OutputCodecsTrace(buf);    \
  } while (0);
#else
#define TRACE(...)
#endif

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#define ENCODER_TRACE_ENTRY(ctx, params)                                     \
  TRACE("File: %s, Line: %d, Function: %s - Entry", __FILE_NAME__, __LINE__, \
        __PRETTY_FUNCTION__)                                                 \
  TRACE("File: %s, Line: %d - Entry Context - %s", __FILE_NAME__, __LINE__,  \
        ContextToString(ctx).c_str())                                        \
  TRACE("File: %s, Line: %d - Entry Encoder Parameters - %s", __FILE_NAME__, \
        __LINE__, EncoderParametersToString(params).c_str())

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#define ENCODER_TRACE_EXIT(ctx)                                             \
  TRACE("File: %s, Line: %d - Exit Context - %s", __FILE_NAME__, __LINE__,  \
        ContextToString(ctx).c_str())                                       \
  TRACE("File: %s, Line: %d, Function: %s - Exit", __FILE_NAME__, __LINE__, \
        __PRETTY_FUNCTION__)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#define DECODER_TRACE_ENTRY(ctx, params)                                     \
  TRACE("File: %s, Line: %d, Function: %s - Entry", __FILE_NAME__, __LINE__, \
        __PRETTY_FUNCTION__)                                                 \
  TRACE("File: %s, Line: %d - Entry Context - %s", __FILE_NAME__, __LINE__,  \
        ContextToString(ctx).c_str())                                        \
  TRACE("File: %s, Line: %d - Entry Decoder Parameters - %s", __FILE_NAME__, \
        __LINE__, DecoderParametersToString(params).c_str())

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#define DECODER_TRACE_EXIT(ctx)                                             \
  TRACE("File: %s, Line: %d - Exit Context - %s", __FILE_NAME__, __LINE__,  \
        ContextToString(ctx).c_str())                                       \
  TRACE("File: %s, Line: %d, Function: %s - Exit", __FILE_NAME__, __LINE__, \
        __PRETTY_FUNCTION__)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OutputCodecsInfo(std::string const &info);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void OutputCodecsTrace(std::string const &trace);
