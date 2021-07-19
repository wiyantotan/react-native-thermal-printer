package com.gdschannel.thermalprinter.bluetooth

import java.util.Arrays
import java.util.Collections

import com.gdschannel.thermalprinter.bluetooth.escpos.RNBluetoothEscposPrinterModule
import com.gdschannel.thermalprinter.bluetooth.tsc.RNBluetoothTscPrinterModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.bridge.JavaScriptModule

class RNBluetoothEscposPrinterPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    val service = BluetoothService(reactContext)
    return Arrays.asList<NativeModule>(RNBluetoothManagerModule(reactContext, service),
      RNBluetoothEscposPrinterModule(reactContext, service),
      RNBluetoothTscPrinterModule(reactContext, service))
  }

  // Deprecated from RN 0.47
  fun createJSModules(): List<Class<out JavaScriptModule>> {
    return emptyList<Class<out JavaScriptModule>>()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList<ViewManager<*, *>>()
  }
}
