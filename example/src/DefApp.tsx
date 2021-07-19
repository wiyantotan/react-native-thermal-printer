import * as React from 'react';
import {
  View,
  Text, StyleSheet, Button, NativeEventEmitter, TouchableOpacity
} from 'react-native';
import {
  ThermalPrinter, BluetoothManager, BluetoothEscposPrinter
} from 'react-native-thermal-printer';
import {StarPrintComposer} from './ThermalCmd';

const DeviceEventEmitter = new NativeEventEmitter(BluetoothManager);

const imgPanda = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAA8FBMVEUAAABCQkJDQ0NFRUU/Pz9BQUFAQEBERERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0MAAAA0ZZMIAAAATnRSTlMAAAAAAAAAABWFz8JdBQFHt9OYIxSi/PBsBFHjvCSk/vJt5b7mo26h75ziIZkD1csRXvpziwvx+QadveRSSA3XF6r31DMPOSLWzMTZFgd4wftfAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAaBJREFUSMe11dlSwjAUgOE2WmUTQRBtBQVBREREQEVUFkHcz/s/jklbQ7YOhwtz2fzftJ1OTi0rWDaJxRPJ1A6xxEXSu5nsXo7Ylrpskt8vABwcuqIgG94RABRLmtgk+eMTugXliiAI8U7ZRaiqwvnrJUH7WnBRFfR5zsKeinoohN4XRHyeZc8F2RJ6SSh9KJReeCpH7QOh9st76L3/5lrPRf5c6wEaF039IlQvmYgXAL1aVxQk8D20YxQk1wDXHQpuGui+22Pv4FbK2L5/639Rt44TYY8WvEcKoUcJqUcIpV8ptN4Xd5H9vd5TMXiIBMOOoXe8x0igzJKgf6pB9JJmCaIXJkPYb6/oFYHoJYHqxXllo/qlcDxcz8VzE9lTkWInLoPuAZIjCrJrgPGEgtYaYDqgIFc07LwMTbNkNmfvQEpVbafbfzXMkvbCn622Lth50adP2BuEf740MVvwP4oi+LyShNArQphXgpB69v/jQppXXCi9IJR5FQqt50KbV74w9Ey8td4/etq8Sn1+TeeGngn3u5PW7myPJj/G/v/WL4DMswebZ4AxAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE1LTA2LTI1VDA4OjQ0OjQ2KzA4OjAww1b9dwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNS0wNi0yNVQwODo0NDo0NiswODowMLILRcsAAAAASUVORK5CYII=";

export default function App() {
  const [result, setResult] = React.useState<any>(null);
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

  const enableBluetooth = () => {
    BluetoothManager.enableBluetooth().then(
      (enabled) => {
        console.log('enabled bt', enabled);
      },
      (err) => {
        console.log('err bt', err);
      }
    );
  };

  const disableBluetooth = () => {
    BluetoothManager.disableBluetooth().then(
      (enabled) => {
        console.log('disable bt', enabled);
      },
      (err) => {
        console.log('disable err bt', err);
      }
    );
  };

  React.useEffect(() => {
    ThermalPrinter.multiply(7,3).then(setResult);

    const paired = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
      (rsp) => {
        console.log('_deviceAlreadPaired', rsp);
      }
    );
    const found = DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_FOUND,
      (rsp) => {
        var r = null;
        try {
          if (typeof(rsp.device) == "object") {
            r = rsp.device;
          } else {
            r = JSON.parse(rsp.device);
          }
        } catch (e) {//alert(e.message);
          //ignore
        }

        console.log("_deviceFound", rsp);
        if (!listDevice.hasOwnProperty(r.address)) {
          listDevice[r.address] = r;
          setListDevice({
            ...listDevice,
          });
        }
      }
    );

    return () => {
      paired.remove();
      found.remove();
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
    console.log("connect", device);
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

  const printSimple = async () => {
    setListDevice({});
    await BluetoothEscposPrinter.printText('Wiyanto - 中国话\r\n\r\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 1, // http://www.sam4s.co.kr/files/DOWN/2019012393432_1.pdf  page 15
    });
  };

  const openDrawer = async () => {
    await BluetoothEscposPrinter.openDrawer(0, 10, 20);
  }

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
      { fonttype: 1, encoding: 'GBK' }
    );
    await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    console.log(resinit);
    console.log(resprint);
    // await BluetoothEscposPrinter.printBarCode("123456789012", 67, 3, 120, 0, 2);
    // await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
  };



  return (
    <View style={styles.container}>
      <Text>Result : {result}</Text>
      <View>
        <Button title={'is bluetooth enabled?'} onPress={isBluetoothEnabled} />
      </View>

      <View style={styles.btn}>
        <Button title={'enable bluetooth'} onPress={enableBluetooth} />
      </View>

      <View style={styles.btn}>
        <Button title={'disable bluetooth'} onPress={disableBluetooth} />
      </View>

      <View style={styles.btn}>
        <Button title={'scan device'} onPress={scanDevices} />
      </View>

      <View style={styles.btn}>
        <Button title={'test print'} onPress={testPrint} />
      </View>

      <View style={styles.btn}>
        <Button title={'print simple '} onPress={printSimple} />
      </View>

      <View style={styles.btn}>
        <Button title={'Open drawer'} onPress={openDrawer} />
      </View>

      <View style={styles.btn}>
        <Button title={'Connect mpop'} onPress={() => {
          connectDevice({
            address: "00:12:F3:2D:52:DB"
          })
        }} />
      </View>

      <Button onPress={async () => {
        // await BluetoothEscposPrinter.printTextWithCmd("", "Hai Im Wiyanto Tan" ,"GBK")
        // await BluetoothEscposPrinter.printCmd("1B,40,0A,0A,0A,0A,0A,0A")
        setListDevice({});
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "Hai Im Wiyanto Tan" ,"GBK")

        // mPOP
        // hardware reset
        // await BluetoothEscposPrinter.printCmd("1B,3F,0A,00")
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "this 中国话 line 1", "1B,61,0A,69,6E,69,20,73,6C,69,70,20,6C,69,6E,65,0A" ,"GBK")
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "this is line 2", "0A" ,"GBK")
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "this is line 3", "0A" ,"GBK")
        // await BluetoothEscposPrinter.printCmd("1B,61",[5])
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "this is line 4", "0A" ,"GBK")
        // await BluetoothEscposPrinter.printCmd("1B,61,0A,1B,40,32",[])
        // await BluetoothEscposPrinter.printCmd("0A",[])

        const escPrinter = StarPrintComposer();

        // const qrToPrint = "a2931293httpsgdschannelcom923kjsdlajsd09dkajdoiqnuce9euou9c8nuc9ucncn38c92u34un99cnw9nwrn9wyw9rwzhttps://gdschannel.com/923kjsdlajsd09dkajdoiqnuce9euou9c8nuc9ucncn38c92u34un99cnw9nwrn9wyw9rwzhttps://gdschannel.com/923kjsdlajsd09dkajdoiqnuce9euokajsdoi3o4@";
        //
        // console.log(escPrinter.qrCodeModel().qrCodeMistakeLevel().qrCodeCellSize().qrCodeData(qrToPrint).getCommand());
        // // ok print qrcode
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.setLeftMargin(1).setRightMargin(10).qrCodeModel().qrCodeMistakeLevel().qrCodeCellSize(6).qrCodeData(qrToPrint).getCommand(),
        //   qrToPrint,
        //   escPrinter.qrCodePrint().feedPaperNLine(6).printPageEn().getCommand(),
        //   "UTF-8"
        // );

        // ok print normal text
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.setFont().setCodePage().setCharset().getCommand(),
        //   "ldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajdldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajdldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajd this is wiyanto tan ",
        //   escPrinter.feedPaperNLine(10).printPageEn().getCommand(),
        //   "UTF-8"
        // );

        // page mode ok.
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.pageModeBegin().pageModeSetPrintRegion().pageModeDirection(3).getCommand(),
        //   "ldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajdldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajdldjaldj aldjasldajdla jdlajd ladj lakdjald jaldj aldaj sdlajd lajdlajd",
        //   escPrinter.pageModePrintSend().feedPaperNLine(5).printPageEn().getCommand(),
        //   "UTF-8"
        // );

        // const barcodeText = "1234567890123456";

        // console.log(escPrinter.barCodeSize().barCodeData(barcodeText).getCommand());
        // console.log(escPrinter.barCodePrint().feedPaperNLine(4).printPageEn().getCommand());

        // console.log(escPrinter.bcCode39(barcodeText).getCommand());
        // console.log(escPrinter.setGraphicsData(imgPanda).getCommand());

        // ok barcode pdf417
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.bcPdf417Size().bcPdf417Data(barcodeText).getCommand(),
        //   barcodeText,
        //   escPrinter.bcPdf417Print().feedPaperNLine(4).printPageEn().getCommand(),
        //   "UTF-8"
        // );
        // // barcode code39
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.bcCode39(barcodeText).getCommand(),
        //   barcodeText,
        //   escPrinter.bcEndNotPdf417().feedPaperNLine(4).printPageEn().getCommand(),
        //   "UTF-8"
        // );
        // // barcode code128
        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.bcCode128(barcodeText).getCommand(),
        //   barcodeText,
        //   escPrinter.bcEndNotPdf417().feedPaperNLine(4).printPageEn().getCommand(),
        //   "UTF-8"
        // );

        // console.log(escPrinter.bcCode39(barcodeText).getCommand());

        // print image
        // await BluetoothEscposPrinter.printImageWithCmd(
        //   escPrinter.pageModeBegin().pageModeSetPrintRegion().getCommand(),
        //   imgPanda,
        //   escPrinter.feedPaperNLine(4).getCommand()
        // );


        await BluetoothEscposPrinter.printCmd(escPrinter.getPrinterVersion().getCommand(),[]);

        // await BluetoothEscposPrinter.printTextWithCmd(
        //   escPrinter.pageModeBegin().pageModeSetPrintRegion().pageModeDirection(3).barCodeSize().barCodeSecurityLevel().barCodeXDirectionSize().barCodeAspectRatio().barCodeData(barcodeText).getCommand(),
        //   barcodeText,
        //   escPrinter.barCodePrint().pageModePrintSend().feedPaperNLine(5).printPageEn().getCommand(),
        //   "UTF-8"
        // );


        // await BluetoothEscposPrinter.printTextWithCmd("1B,1E,46,00,1B,1D,74,00,1B,52,08", "this 中国话 line 1", "1B,61,0A,69,6E,69,20,73,6C,69,70,20,6C,69,6E,65,0A,1B,64,01,1B,40" ,"GBK")

        // await BluetoothEscposPrinter.printCmd("07,1C",[])
        // await BluetoothEscposPrinter.printTextWithCmd("1B,40", "-", "0A" ,"GBK")

        // await BluetoothEscposPrinter.printerInit();
        // await BluetoothEscposPrinter.printText("Hai Im Wiyanto Tan 我就是一个测试看看很长会怎么样的啦\r\n\r\n\r\n\r\n", {
        //   encoding: 'BIG-5',
        //   codepage: 0,
        //   widthtimes: 0,
        //   heigthtimes: 0,
        //   fonttype: 1, // http://www.sam4s.co.kr/files/DOWN/2019012393432_1.pdf  page 15
        // });
      }} title="Print Text"/>

      {Object.values(listDevice).map((device) => {
        console.log(device, "device");
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
  btn: {
    paddingTop: 10,
    paddingBottom: 10,
  }
});
