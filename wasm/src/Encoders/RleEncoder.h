#pragma once

#include <vector>

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
struct ByteWriter {
 public:
  ByteWriter(const size_t size = 65536) {
    buffer_.resize(0);
    buffer_.reserve(size);
  }
  virtual ~ByteWriter() {}

  void Reset() { buffer_.clear(); }
  size_t Tell() const { return buffer_.size(); }

  void WriteUInt32(const uint32_t value) { Write(&value, sizeof(uint32_t)); }
  void WriteInt32(const int32_t value) { Write(&value, sizeof(int32_t)); }
  void WriteByte(const uint8_t value) { Write(&value, sizeof(uint8_t)); }
  void WriteBytes(uint8_t const *values, const size_t size) {
    for (auto i = 0u; i < size; i++) {
      WriteByte(values[i]);
    }
  }

  uint8_t *GetData() { return buffer_.data(); }

  ByteWriter(ByteWriter const &) = delete;
  ByteWriter &operator=(ByteWriter const &) = delete;

 private:
  std::vector<uint8_t> buffer_;

  size_t Write(void const *ptr, const size_t size) {
    auto const bytes = static_cast<uint8_t const *>(ptr);
    buffer_.insert(buffer_.end(), bytes, bytes + size);

    return size;
  }
};

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
class RleEncoder {
 public:
  RleEncoder();
  ~RleEncoder();

  uint32_t GetNumberOfSegments() const { return segmentCount_; }
  uint8_t *GetBuffer() {
    Flush();
    WriteHeader();

    return writer_.GetData();
  }
  size_t GetLength() const { return writer_.Tell(); }

  void NextSegment();
  void Encode(uint8_t b);
  void MakeEvenLength();
  void Flush();

  RleEncoder(RleEncoder const &) = delete;
  RleEncoder &operator=(RleEncoder const &) = delete;

 private:
  uint32_t segmentCount_;
  int32_t offsets_[15];
  uint8_t buffer_[132];
  int32_t prevByte_;
  int32_t repeatCount_;
  int32_t bufferPos_;
  ByteWriter writer_;

  void MoveBuffer(int count);
  void WriteHeader();
};
