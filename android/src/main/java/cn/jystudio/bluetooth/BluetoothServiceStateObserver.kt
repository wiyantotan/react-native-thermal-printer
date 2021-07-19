package com.gdschannel.thermalprinter.bluetooth


/**
 * Created by januslo on 2018/9/22.
 */
 interface BluetoothServiceStateObserver {
 fun onBluetoothServiceStateChanged(state:Int, boundle:Map<String, Any>?)
}
