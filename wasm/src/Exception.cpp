#include "Exception.h"

#include <emscripten.h>

#include <stdexcept>

using namespace std;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
EM_JS(void, onCodecsException, (char const *message, size_t const len), {});

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void ThrowCodecsException(string const &message) {
  onCodecsException(message.c_str(), message.length());

  throw runtime_error(message);
}
