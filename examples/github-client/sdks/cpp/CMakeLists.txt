cmake_minimum_required(VERSION 3.14)
project(app_sdk LANGUAGES CXX)

add_library(app_sdk INTERFACE)
target_include_directories(app_sdk INTERFACE include/)
target_compile_features(app_sdk INTERFACE cxx_std_17)
