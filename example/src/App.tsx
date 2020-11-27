import * as React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  NativeEventEmitter,
  TouchableOpacity,
} from 'react-native';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-thermal-printer';
import { useEffect } from 'react';

const DeviceEventEmitter = new NativeEventEmitter(BluetoothManager);

export default function App() {
  const [listDevice, setListDevice] = React.useState<any>({});

  const isBluetoothEnabled = () => {
    BluetoothManager.isBluetoothEnabled().then(
      (enabled) => {
        console.log('enabled', enabled);
      },
      (err) => {
        console.log('err', err);
      }
    );
  };

  useEffect(() => {
    const paired = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
      (rsp) => {
        console.log('_deviceAlreadPaired', rsp);
      }
    );
    const found = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_FOUND,
      (rsp) => {
        if (!listDevice.hasOwnProperty(rsp.device.address)) {
          listDevice[rsp.device.address] = rsp.device;
          setListDevice({
            ...listDevice,
          });
        }
      }
    );

    const btState = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_BLUETOOTH_STATE,
      (res) => {
        console.log('btstate', res);
      }
    );

    return () => {
      paired.remove();
      found.remove();
      btState.remove();
    };
  }, []);

  const scanDevices = () => {
    setListDevice({});
    BluetoothManager.scanDevices().then(
      (s) => {
        console.log('scan device raw', s);
      },
      (er) => {
        console.log('scan device', er);
      }
    );
  };

  const connectDevice = (device) => {
    BluetoothManager.connect(device.address) // the device address scanned.
      .then(
        (s) => {
          // s always return true when connected to device, throw error otherwise
          console.log('connected resolve', s);
        },
        (e) => {
          console.log('connected rejct', e);
        }
      );
  };

  const testPrint = async () => {
    console.log('testprint');
    const resinit = await BluetoothEscposPrinter.printerInit();
    const resprint = await BluetoothEscposPrinter.printText(
      'I am an english\r\n\r\n',
      {}
    );
    await BluetoothEscposPrinter.printBarCode(
      '123456789012',
      BluetoothEscposPrinter.BARCODETYPE.JAN13,
      3,
      120,
      0,
      2
    );
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    await BluetoothEscposPrinter.printQRCode(
      '你是不是傻？',
      280,
      BluetoothEscposPrinter.ERROR_CORRECTION.L
    ); //.then(()=>{alert('done')},(err)=>{alert(err)});
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    await BluetoothEscposPrinter.printerUnderLine(2);
    await BluetoothEscposPrinter.printText('中国话\r\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 1,
    });
    await BluetoothEscposPrinter.printerUnderLine(0);
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    await BluetoothEscposPrinter.rotate(BluetoothEscposPrinter.ROTATION.ON);
    await BluetoothEscposPrinter.printText(
      '中国话中国话中国话中国话中国话\r\n',
      {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      }
    );
    await BluetoothEscposPrinter.rotate(BluetoothEscposPrinter.ROTATION.OFF);
    await BluetoothEscposPrinter.printText(
      '中国话中国话中国话中国话中国话\r\n',
      {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      }
    );
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    await BluetoothEscposPrinter.printerLeftSpace(0);
    await BluetoothEscposPrinter.printColumn(
      [
        BluetoothEscposPrinter.width58 / 8 / 3,
        BluetoothEscposPrinter.width58 / 8 / 3 - 1,
        BluetoothEscposPrinter.width58 / 8 / 3 - 1,
      ],
      [
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.CENTER,
      ],
      ['我就是一个测试看看很长会怎么样的啦', 'testing', '223344'],
      { fonttype: 1 }
    );
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    console.log(resinit);
    console.log(resprint);
    // await BluetoothEscposPrinter.printBarCode("123456789012", 67, 3, 120, 0, 2);
    // await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
  };

  return (
    <View style={styles.container}>
      <View>
        <Button title={'enable bluetooth'} onPress={isBluetoothEnabled} />
      </View>
      <View>
        <Button title={'scan device'} onPress={scanDevices} />
      </View>
      <View>
        <Button title={'test print'} onPress={testPrint} />
      </View>
      {Object.values(listDevice).map((device) => {
        return (
          <View key={device.address}>
            <TouchableOpacity
              onPress={() => {
                connectDevice(device);
              }}
            >
              <Text>name : {device.name}</Text>
              <Text>Address : {device.address}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
