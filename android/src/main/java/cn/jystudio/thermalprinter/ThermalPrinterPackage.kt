package com.gdschannel.thermalprinter

import java.util.Arrays
import java.util.Collections

import com.gdschannel.thermalprinter.bluetooth.escpos.RNBluetoothEscposPrinterModule
import com.gdschannel.thermalprinter.bluetooth.tsc.RNBluetoothTscPrinterModule
import com.gdschannel.thermalprinter.bluetooth.RNBluetoothManagerModule
import com.gdschannel.thermalprinter.bluetooth.BluetoothService
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.bridge.JavaScriptModule

class ThermalPrinterPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val service = BluetoothService(reactContext)
        return Arrays.asList<NativeModule>(ThermalPrinterModule(reactContext),
                RNBluetoothManagerModule(reactContext, service),
                RNBluetoothEscposPrinterModule(reactContext, service),
                RNBluetoothTscPrinterModule(reactContext, service))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList<ViewManager<*, *>>()
    }
}
