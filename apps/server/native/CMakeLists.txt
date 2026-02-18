cmake_minimum_required(VERSION 3.15)
project(beacon-native CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Explicitly add Node-API headers from node-addon-api
# This path is relative to CMAKE_CURRENT_SOURCE_DIR (which is apps/server/native)
include_directories("${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api")

# Add Node.js headers (provided by cmake-js via CMAKE_JS_INC)
include_directories(${CMAKE_JS_INC})

# Add Node.js add-on target
add_library(${PROJECT_NAME} SHARED src/index.cc)

# Link against the Node.js native library (provided by cmake-js via CMAKE_JS_LIB)
target_link_libraries(${PROJECT_NAME} PRIVATE "${CMAKE_JS_LIB}")

# Set output directory for the compiled .dll file
set_target_properties(${PROJECT_NAME} PROPERTIES LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/Release")

# Post-build step to rename the .dll to .node for Node.js compatibility
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E rename
        $<TARGET_FILE:${PROJECT_NAME}>
        $<TARGET_FILE_DIR:${PROJECT_NAME}>/${PROJECT_NAME}.node
    COMMENT "Renaming .dll to .node for Node.js compatibility"
)
