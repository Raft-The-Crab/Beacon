#include <napi.h> // Corrected to use node-addon-api header
#include <string> // Required for std::string

// Removed unused GetString helper function

Napi::String Method(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env(); // Corrected: get Env from info object
  return Napi::String::New(env, "Hello from C++ native add-on (finally building!)!");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "hello"), Napi::Function::New(env, Method));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)