#include "RleEncoder.h"

#include <algorithm>
#include <string>
#include <vector>

#include "Exception.h"

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
RleEncoder::RleEncoder()
    : segmentCount_(0),
      offsets_{},
      buffer_{},
      prevByte_(-1),
      repeatCount_(0),
      bufferPos_(0) {}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
RleEncoder::~RleEncoder() {}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::NextSegment() {
  Flush();
  if ((GetLength() & 1) == 1) {
    writer_.WriteByte(0x00);
  }
  offsets_[segmentCount_++] = static_cast<int32_t>(writer_.Tell());
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::Encode(const uint8_t b) {
  if (b == prevByte_) {
    repeatCount_++;

    if (repeatCount_ > 2 && bufferPos_ > 0) {
      while (bufferPos_ > 0) {
        auto const count = min(128, bufferPos_);
        writer_.WriteByte(static_cast<uint8_t>(count - 1));
        MoveBuffer(count);
      }
    } else if (repeatCount_ > 128) {
      auto const count = min(repeatCount_, 128);
      writer_.WriteByte(static_cast<uint8_t>(257 - count));
      writer_.WriteByte(static_cast<uint8_t>(prevByte_));
      repeatCount_ -= count;
    }
  } else {
    switch (repeatCount_) {
      case 0:
        break;
      case 1: {
        buffer_[bufferPos_++] = static_cast<uint8_t>(prevByte_);
        break;
      }
      case 2: {
        buffer_[bufferPos_++] = static_cast<uint8_t>(prevByte_);
        buffer_[bufferPos_++] = static_cast<uint8_t>(prevByte_);
        break;
      }
      default: {
        while (repeatCount_ > 0) {
          auto const count = min(repeatCount_, 128);
          writer_.WriteByte(static_cast<uint8_t>(257 - count));
          writer_.WriteByte(static_cast<uint8_t>(prevByte_));
          repeatCount_ -= count;
        }
        break;
      }
    }

    while (bufferPos_ > 128) {
      auto const count = min(128, bufferPos_);
      writer_.WriteByte(static_cast<uint8_t>(count - 1));
      MoveBuffer(count);
    }

    prevByte_ = b;
    repeatCount_ = 1;
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::MakeEvenLength() {
  if (writer_.Tell() % 2 == 1) {
    writer_.WriteByte(0);
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::Flush() {
  if (repeatCount_ < 2) {
    while (repeatCount_ > 0) {
      buffer_[bufferPos_++] = static_cast<uint8_t>(prevByte_);
      repeatCount_--;
    }
  }

  while (bufferPos_ > 0) {
    auto const count = min(128, bufferPos_);
    writer_.WriteByte(static_cast<uint8_t>(count - 1));
    MoveBuffer(count);
  }

  if (repeatCount_ >= 2) {
    while (repeatCount_ > 0) {
      auto const count = min(repeatCount_, 128);
      writer_.WriteByte(static_cast<uint8_t>(257 - count));
      writer_.WriteByte(static_cast<uint8_t>(prevByte_));
      repeatCount_ -= count;
    }
  }

  prevByte_ = -1;
  repeatCount_ = 0;
  bufferPos_ = 0;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::MoveBuffer(int count) {
  for (auto i = 0; i < count; i++) {
    writer_.WriteByte(buffer_[i]);
  }
  for (auto i = count, n = 0; i < bufferPos_; i++, n++) {
    buffer_[n] = buffer_[i];
  }
  bufferPos_ = bufferPos_ - count;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void RleEncoder::WriteHeader() {
  vector<uint8_t> tmp;
  tmp.assign(writer_.GetData(), writer_.GetData() + writer_.Tell());
  writer_.Reset();

  writer_.WriteUInt32(segmentCount_);
  for (auto i = 0; i < segmentCount_; i++) {
    offsets_[i] += sizeof(uint32_t) + 15 * sizeof(int32_t);
  }
  for (auto i = 0; i < 15; i++) {
    writer_.WriteInt32(offsets_[i]);
  }
  writer_.WriteBytes(tmp.data(), tmp.size());
}
