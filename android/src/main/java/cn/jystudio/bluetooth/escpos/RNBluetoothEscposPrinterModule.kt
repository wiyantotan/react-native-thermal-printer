package com.gdschannel.thermalprinter.bluetooth.escpos

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.gdschannel.thermalprinter.bluetooth.BluetoothService
import com.gdschannel.thermalprinter.bluetooth.BluetoothServiceStateObserver
import com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk.Command
import com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk.PrintPicture
import com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk.PrinterCommand
import com.facebook.react.bridge.*
import com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk.Utils
import com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk.Utils.hexToByte
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.io.UnsupportedEncodingException
import java.nio.charset.Charset
import java.util.*
import kotlin.collections.ArrayList


class RNBluetoothEscposPrinterModule(private val reactContext: ReactApplicationContext,
                                     private val mService: BluetoothService) : ReactContextBaseJavaModule(reactContext), BluetoothServiceStateObserver {
  /** */

  private var deviceWidth = WIDTH_58

  override fun getName(): String {
    return "BluetoothEscposPrinter"
  }

  override fun getConstants() : Map<String, Any> {
    val errorConnection = HashMap<String, Int>()
    errorConnection["L"] = 1
    errorConnection["M"] = 0
    errorConnection["Q"] = 3
    errorConnection["H"] = 2

    val barcodeType = HashMap<String, Int>()
    barcodeType["UPC_A"] = 65
    barcodeType["UPC_E"] = 66
    barcodeType["JAN13"] = 67
    barcodeType["JAN8"] = 68
    barcodeType["CODE39"] = 69
    barcodeType["ITF"] = 70
    barcodeType["CODABAR"] = 71
    barcodeType["CODE93"] = 72
    barcodeType["CODE128"] = 73

    val rotation = HashMap<String, Int>()
    rotation["OFF"] = 0
    rotation["ON"] = 1

    val align = HashMap<String, Int>()
    align["LEFT"] = 0
    align["CENTER"] = 1
    align["RIGHT"] = 2

    val constants = HashMap<String, Any>()
    constants["width58"] = WIDTH_58
    constants["width80"] = WIDTH_80
    constants["ERROR_CORRECTION"] = errorConnection
    constants["BARCODETYPE"] = barcodeType
    constants["ROTATION"] = rotation
    constants["ALIGN"] = align

    return constants
  }

  init {
    this.mService.addStateObserver(this)
  }

  @ReactMethod
  fun printerInit(promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_PrtInit())) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  @ReactMethod
  fun printAndFeed(feed: Int, promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(feed))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  @ReactMethod
  fun printerLeftSpace(sp: Int, promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_LeftSP(sp))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  @ReactMethod
  fun printerLineSpace(sp: Int, promise: Promise) {
    var command = PrinterCommand.POS_Set_DefLineSpace()
    if (sp > 0) {
      command = PrinterCommand.POS_Set_LineSpace(sp)!!
    }
    if (command == null || !sendDataByte(command)) {
      promise.reject("COMMAND_NOT_SEND")
    } else {
      promise.resolve(null)
    }
  }

  /**
   * Under line switch, 0-off,1-on,2-deeper
   * @param line 0-off,1-on,2-deeper
   */
  @ReactMethod
  fun printerUnderLine(line: Int, promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_UnderLine(line))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  /**
   * When n=0 or 48, left justification is enabled
   * When n=1 or 49, center justification is enabled
   * When n=2 or 50, right justification is enabled
   * @param align
   * @param promise
   */
  @ReactMethod
  fun printerAlign(align: Int, promise: Promise) {
    Log.d(TAG, "Align:$align")
    if (sendDataByte(PrinterCommand.POS_S_Align(align))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  private fun hexStringToByteArray(hexString : String) : ByteArray? {
    Log.d("hexArr ", "-" + hexString + "-")
    if (!hexString.isBlank()) {
      var hexBytes : ByteArray
      val hexArr = hexString.split(",")
      Log.d("hexArr size ", hexArr.size.toString())
      hexBytes = ByteArray(hexArr.size)

      Log.d("hexString size ", hexBytes.size.toString())

      var i : Int = 0
      val hexList = hexArr.iterator()

      while (hexList.hasNext()) {
        hexBytes.set(i++, Utils.hexToByte(hexList.next()))
      }

      return hexBytes
    }

    return null
  }

  @ReactMethod
  fun printTextWithCmd(headerCmd: String, bodyText: String, footerCmd: String, encoding: String, promise: Promise) {
    try {
      var pbString: ByteArray? = null
      pbString = bodyText.toByteArray(charset(encoding))

      Log.d("textWithCmd", "textWithCmd 1")
      var data: ByteArray? = null
      data = PrinterCommand.concatAll(hexStringToByteArray(headerCmd)!!, pbString, hexStringToByteArray(footerCmd))

      val dataiter = data.iterator()
      while (dataiter.hasNext()) {
        Log.d("textWithCmd", dataiter.next().toString())
      }

      Log.d(TAG, "textWithCmd 1")
      if (sendDataByte(data)) {
        promise.resolve(null)
      } else {
        promise.reject("COMMAND_NOT_SEND", "COMMAND_NOT_SEND")
      }
    } catch (e: Exception) {
      promise.reject(e.message, e)
    }
  }

  fun printGS8(headerCmd: String, base64Img: String, footerCmd: String, promise: Promise) {
    try {
      val bitmapBytes = Base64.decode(base64Img, Base64.DEFAULT)
      val mBitmap = BitmapFactory.decodeByteArray(bitmapBytes, 0, bitmapBytes.size)
      val imageBytes = PrintPicture.decodeBitmap(mBitmap)
      var height = mBitmap.getHeight()
      var width = mBitmap.getWidth()

      Log.d("image height", height.toString())
      Log.d("image width", width.toString())

      val dataLng = imageBytes!!.size.toDouble() + 10;
      val p4 = Math.floor(dataLng / 16777216)
      val p3 = Math.floor((dataLng - (p4 * 16777216)) / 65536);
      val p2 = Math.floor((dataLng - (p4 * 16777216) - (p3 * 65536)) / 256);
      val p1 = dataLng - (p4 * 16777216) - (p3 * 65536) - (p2 * 256);
      Log.d("image dataLng", dataLng.toString())
      Log.d("image p1", p1.toString())
      Log.d("image p2", p2.toString())
      Log.d("image p3", p3.toString())
      Log.d("image p4", p4.toString())

      val xH = Math.floor(width.toDouble() / 256)
      val xL = width.toDouble() - (xH * 256)
      val yH = Math.floor(height.toDouble() / 256)
      val yL = height.toDouble() - (yH * 256)

      Log.d("image xL", xL.toString())
      Log.d("image xH", xH.toString())
      Log.d("image yL", yL.toString())
      Log.d("image yH", yH.toString())

      val kc1 = 33
      val kc2 = 33
      var i : Int = 0
      var headerBytes : ByteArray = ByteArray(17)
      headerBytes.set(i++, hexToByte("1B"))
      headerBytes.set(i++, hexToByte("1D"))
      headerBytes.set(i++, hexToByte("38"))
      headerBytes.set(i++, hexToByte("4C"))
      headerBytes.set(i++, p1.toByte())
      headerBytes.set(i++, p2.toByte())
      headerBytes.set(i++, p3.toByte())
      headerBytes.set(i++, p4.toByte())
      headerBytes.set(i++, hexToByte("30"))
      headerBytes.set(i++, hexToByte("43"))
      headerBytes.set(i++, hexToByte("30"))
      headerBytes.set(i++, kc1.toByte())
      headerBytes.set(i++, kc2.toByte())
      headerBytes.set(i++, xL.toByte())
      headerBytes.set(i++, xH.toByte())
      headerBytes.set(i++, yL.toByte())
      headerBytes.set(i++, yH.toByte())
      headerBytes.set(i++, hexToByte("31"))

      i = 0
      var footerBytes : ByteArray = ByteArray(14)
      footerBytes.set(i++, hexToByte("1B"))
      footerBytes.set(i++, hexToByte("1D"))
      footerBytes.set(i++, hexToByte("38"))
      footerBytes.set(i++, hexToByte("4C"))
      footerBytes.set(i++, p1.toByte())
      footerBytes.set(i++, p2.toByte())
      footerBytes.set(i++, p3.toByte())
      footerBytes.set(i++, p4.toByte())
      footerBytes.set(i++, hexToByte("30"))
      footerBytes.set(i++, hexToByte("45"))
      footerBytes.set(i++, kc1.toByte())
      footerBytes.set(i++, kc2.toByte())
      footerBytes.set(i++, hexToByte("01"))
      footerBytes.set(i++, hexToByte("01"))


//      var grayBitmap = PrintPicture.toGrayscale(mBitmap)
//      val dithered = PrintPicture.thresholdToBWPic(grayBitmap)

      var data: ByteArray? = null
      data = PrinterCommand.concatAll(headerBytes, imageBytes, footerBytes)

      if (sendDataByte(data)) {
        promise.resolve(null)
      } else {
        promise.reject("COMMAND_NOT_SEND", "COMMAND_NOT_SEND")
      }
    } catch (e: Exception) {
      promise.reject(e.message, e)
    }
  }

  @ReactMethod
  fun printImageWithCmd(headerCmd: String, base64Img: String, footerCmd: String, promise: Promise) {
    try {
      val bitmapBytes = Base64.decode(base64Img, Base64.DEFAULT)
      val mBitmap = BitmapFactory.decodeByteArray(bitmapBytes, 0, bitmapBytes.size)
      val bmpBytes = PrintPicture.processBmpImg(mBitmap, deviceWidth, 0,0)

      var i : Int = 0
      var headerBytes : ByteArray = ByteArray(17)
      headerBytes.set(i++, hexToByte("1B"))
      headerBytes.set(i++, hexToByte("1D"))
      headerBytes.set(i++, hexToByte("53"))
      headerBytes.set(i++, hexToByte("01"))



      val bmpPix = PrintPicture.starPrintBmp(mBitmap, deviceWidth, 0, 0)

//      val bmpPix = PrintPicture.bitmapToBWPix(mBitmap)
//      Log.d("withcmd", "test1")
//
//      val n1 = bmpPix.size%256
//      val n2 = bmpPix.size/256

//      var i : Int = 0
//      var headerBytes : ByteArray = ByteArray(4)
//      headerBytes.set(i++, hexToByte("1B"))
//      headerBytes.set(i++, hexToByte("4B"))
//      headerBytes.set(i++, n1.toByte())
//      headerBytes.set(i++, n2.toByte())

      var data: ByteArray? = null
      data = PrinterCommand.concatAll(bmpPix, hexStringToByteArray(footerCmd))

      val dataiter = data.iterator()
      while (dataiter.hasNext()) {
        Log.d("dataiter", dataiter.next().toString())
      }

      if (sendDataByte(data)) {
        promise.resolve(null)
      } else {
        promise.reject("COMMAND_NOT_SEND", "COMMAND_NOT_SEND")
      }
    } catch (e: Exception) {
      promise.reject(e.message, e)
    }
  }

  @ReactMethod
  fun printCmd(cmdString: String, initalValue: ReadableArray, promise: Promise) {
    try {
      Log.d("printCmd", "printCmd 1")
      var data: ByteArray = hexStringToByteArray(cmdString)!!

      val result = Arrays.copyOf(data, (data.size + initalValue.size()))
      var offset = data.size;
      for (i in 0 until initalValue.size()) {
        result[offset++] = initalValue.getInt(i).toByte()
      }

      val dataiter = result.iterator()

      while (dataiter.hasNext()) {
        Log.d(TAG, dataiter.next().toString())
      }

      if (sendDataByte(result)) {
        promise.resolve(null)
      } else {
        promise.reject("COMMAND_NOT_SEND", "COMMAND_NOT_SEND")
      }
    } catch (e: Exception) {
      promise.reject(e.message, e)
    }
  }

  @ReactMethod
  fun printText(text: String, options: ReadableMap?, promise: Promise) {
    try {
      var encoding = "GBK"
      var codepage = 0
      var widthTimes = 0
      var heigthTimes = 0
      var fonttype = 0
      if (options != null) {
        encoding = if (options!!.hasKey("encoding")) options!!.getString("encoding")!! else "GBK"
        codepage = if (options!!.hasKey("codepage")) options!!.getInt("codepage") else 0
        widthTimes = if (options!!.hasKey("widthtimes")) options!!.getInt("widthtimes") else 0
        heigthTimes = if (options!!.hasKey("heigthtimes")) options!!.getInt("heigthtimes") else 0
        fonttype = if (options!!.hasKey("fonttype")) options!!.getInt("fonttype") else 0
      }
//            if ("UTF-8".equalsIgnoreCase(encoding)) {
      //                byte[] b = text.getBytes("UTF-8");
      //                toPrint = new String(b, Charset.forName(encoding));
      //            }

      val bytes = PrinterCommand.POS_Print_Text(text, encoding, codepage, widthTimes, heigthTimes, fonttype)
      if (sendDataByte(bytes)) {
        promise.resolve(null)
      } else {
        promise.reject("COMMAND_NOT_SEND")
      }
    } catch (e: Exception) {
      promise.reject(e.message, e)
    }

  }

  @ReactMethod
  fun printColumn(columnWidths: ReadableArray, columnAligns: ReadableArray, columnTexts: ReadableArray,
                  options: ReadableMap?, promise: Promise) {
    if (columnWidths.size() !== columnTexts.size() || columnWidths.size() !== columnAligns.size()) {
      promise.reject("COLUMN_WIDTHS_ALIGNS_AND_TEXTS_NOT_MATCH")
      return
    }
    var totalLen = 0
    for (i in 0 until columnWidths.size()) {
      totalLen += columnWidths.getInt(i)
    }
    val maxLen = deviceWidth / 8
    if (totalLen > maxLen) {
      promise.reject("COLUNM_WIDTHS_TOO_LARGE")
      return
    }

    var encoding = "GBK"
    var codepage = 0
    var widthTimes = 0
    var heigthTimes = 0
    var fonttype = 0
    if (options != null) {
      encoding = if (options!!.hasKey("encoding")) options!!.getString("encoding")!! else "GBK"
      codepage = if (options!!.hasKey("codepage")) options!!.getInt("codepage") else 0
      widthTimes = if (options!!.hasKey("widthtimes")) options!!.getInt("widthtimes") else 0
      heigthTimes = if (options!!.hasKey("heigthtimes")) options!!.getInt("heigthtimes") else 0
      fonttype = if (options!!.hasKey("fonttype")) options!!.getInt("fonttype") else 0
    }
    Log.d(TAG, "encoding: $encoding")

    /**
     * [column1-1,
     * column1-2,
     * column1-3 ... column1-n]
     * ,
     * [column2-1,
     * column2-2,
     * column2-3 ... column2-n]
     *
     * ...
     *
     */
    val table = ArrayList<List<String>>()

    /**splits the column text to few rows and applies the alignment  */
    val padding = 1
    for (i in 0 until columnWidths.size()) {
      val width = columnWidths.getInt(i) - padding//1 char padding
      val text = String(columnTexts.getString(i)!!.toCharArray())
      val splited = ArrayList<ColumnSplitedString>()
      var shorter = 0
      var counter = 0
      var temp = ""
      for (c in 0 until text.length) {
        val ch = text.get(c)
        val l = if (isChinese(ch)) 2 else 1
        if (l == 2) {
          shorter++
        }
        temp = temp + ch

        if (counter + l < width) {
          counter = counter + l
        } else {
          splited.add(ColumnSplitedString(shorter, temp))
          temp = ""
          counter = 0
          shorter = 0
        }
      }
      if (temp.length > 0) {
        splited.add(ColumnSplitedString(shorter, temp))
      }
      val align = columnAligns.getInt(i)

      val formated = ArrayList<String>()
      for (s in splited) {
        val empty = StringBuilder()
        for (w in 0 until width + padding - s.shorter) {
          empty.append(" ")
        }
        var startIdx = 0
        val ss = s.str
        if (align == 1 && ss.length < width - s.shorter) {
          startIdx = (width - s.shorter - ss.length) / 2
          if (startIdx + ss.length > width - s.shorter) {
            startIdx--
          }
          if (startIdx < 0) {
            startIdx = 0
          }
        } else if (align == 2 && ss.length < width - s.shorter) {
          startIdx = width - s.shorter - ss.length
        }
        Log.d(TAG, "empty.replace(" + startIdx + "," + (startIdx + ss.length) + "," + ss + ")")
        empty.replace(startIdx, startIdx + ss.length, ss)
        formated.add(empty.toString())
      }
      table.add(formated)

    }

    /**  try to find the max row count of the table  */
    var maxRowCount = 0
    for (i in table.indices) {
      val rows = table[i] // row data in current column
      if (rows.size > maxRowCount) {
        maxRowCount = rows.size
      }// try to find the max row count;
    }/*column count*/

    /** loop table again to fill the rows  */
    val rowsToPrint = arrayOfNulls<StringBuilder>(maxRowCount)
    for (column in table.indices) {
      val rows = table[column] // row data in current column
      for (row in 0 until maxRowCount) {
        if (rowsToPrint[row] == null) {
          rowsToPrint[row] = StringBuilder()
        }
        if (row < rows.size) {
          //got the row of this column
          rowsToPrint[row]!!.append(rows[row])
        } else {
          val w = columnWidths.getInt(column)
          val empty = StringBuilder()
          for (i in 0 until w) {
            empty.append(" ")
          }
          rowsToPrint[row]!!.append(empty.toString())//Append spaces to ensure the format
        }
      }
    }/*column count*/

    /** loops the rows and print  */
    for (i in rowsToPrint.indices) {
      rowsToPrint[i]!!.append("\n\r")//wrap line..
      try {
        //                byte[] toPrint = rowsToPrint[i].toString().getBytes("UTF-8");
        //                String text = new String(toPrint, Charset.forName(encoding));
        if (!sendDataByte(PrinterCommand.POS_Print_Text(rowsToPrint[i].toString(), encoding, codepage, widthTimes, heigthTimes, fonttype))) {
          promise.reject("COMMAND_NOT_SEND")
          return
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }

    }
    promise.resolve(null)
  }

  @ReactMethod
  fun setWidth(width: Int) {
    deviceWidth = width
  }

  @ReactMethod
  fun printPic(base64encodeStr: String, options: ReadableMap?) {
    var width = 0
    var leftPadding = 0
    if (options != null) {
      width = if (options!!.hasKey("width")) options!!.getInt("width") else 0
      leftPadding = if (options!!.hasKey("left")) options!!.getInt("left") else 0
    }

    //cannot larger then devicesWith;
    if (width > deviceWidth || width == 0) {
      width = deviceWidth
    }

    val bytes = Base64.decode(base64encodeStr, Base64.DEFAULT)
    val mBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    val nMode = 0
    if (mBitmap != null) {
      /**
       * Parameters:
       * mBitmap  要打印的图片
       * nWidth   打印宽度（58和80）
       * nMode    打印模式
       * Returns: byte[]
       */
      val data = PrintPicture.POS_PrintBMP(mBitmap, width, nMode, leftPadding)
      //  SendDataByte(buffer);
      sendDataByte(Command.ESC_Init)
      sendDataByte(Command.LF)
      sendDataByte(data)
      sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(30))
      sendDataByte(PrinterCommand.POS_Set_Cut(1))
      sendDataByte(PrinterCommand.POS_Set_PrtInit())
    }
  }


  @ReactMethod
  fun selfTest(cb: Callback?) {
    val result = sendDataByte(PrinterCommand.POS_Set_PrtSelfTest())
    if (cb != null) {
      cb!!.invoke(result)
    }
  }

  /**
   * Rotate 90 degree, 0-no rotate, 1-rotate
   * @param rotate  0-no rotate, 1-rotate
   */
  @ReactMethod
  fun rotate(rotate: Int, promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_Rotate(rotate))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  @ReactMethod
  fun setBlob(weight: Int, promise: Promise) {
    if (sendDataByte(PrinterCommand.POS_Set_Bold(weight))) {
      promise.resolve(null)
    } else {
      promise.reject("COMMAND_NOT_SEND")
    }
  }

  @ReactMethod
  fun printQRCode(content: String, size: Int, correctionLevel: Int, promise: Promise) {
    try {
      Log.i(TAG, "生成的文本：$content")
      // 把输入的文本转为二维码
      val hints = Hashtable<EncodeHintType, Any>()
      hints[EncodeHintType.CHARACTER_SET] = "utf-8"
      hints[EncodeHintType.ERROR_CORRECTION] = ErrorCorrectionLevel.forBits(correctionLevel)
      val bitMatrix = QRCodeWriter().encode(content,
        BarcodeFormat.QR_CODE, size, size, hints)

      val width = bitMatrix.getWidth()
      val height = bitMatrix.getHeight()

      println("w:" + width + "h:"
        + height)

      val pixels = IntArray(width * height)
      for (y in 0 until height) {
        for (x in 0 until width) {
          if (bitMatrix.get(x, y)) {
            pixels[y * width + x] = -0x1000000
          } else {
            pixels[y * width + x] = -0x1
          }
        }
      }

      val bitmap = Bitmap.createBitmap(width, height,
        Bitmap.Config.ARGB_8888)

      bitmap.setPixels(pixels, 0, width, 0, 0, width, height)

      //TODO: may need a left padding to align center.
      println("sampai 0")
      val data = PrintPicture.POS_PrintBMP(bitmap, size, 0, 0)
      println("sampai 1")
      if (sendDataByte(data)) {
        println("sampai 2")
        promise.resolve(null)
        println("sampai 3")
      } else {
        println("sampai 4")
        promise.reject("COMMAND_NOT_SEND")
        println("sampai 5")
      }
    } catch (e: Exception) {
      println("sampai 6")
      e.printStackTrace();
      println("sampai 7")
      promise.reject(e.message, e)
      println("sampai 8")
    }

  }

  @ReactMethod
  fun printBarCode(str: String, nType: Int, nWidthX: Int, nHeight: Int,
                   nHriFontType: Int, nHriFontPosition: Int) {
    val command = PrinterCommand.getBarCodeCommand(str, nType, nWidthX, nHeight, nHriFontType, nHriFontPosition)
    sendDataByte(command)
  }

  @ReactMethod
  fun openDrawer(nMode: Int, nTime1: Int, nTime2: Int) {
    try {
//      val command = PrinterCommand.POS_Set_Cashbox(nMode, nTime1, nTime2)
//      sendDataByte(command)

      val command = PrinterCommand.mPOP_Opendrawer()
      sendDataByte(command)

    } catch (e: Exception) {
      Log.d(TAG, e.message)
    }

  }


  @ReactMethod
  fun cutOnePoint() {
    try {
      val command = PrinterCommand.POS_Cut_One_Point()
      sendDataByte(command)

    } catch (e: Exception) {
      Log.d(TAG, e.message)
    }

  }

  private fun sendDataByte(data: ByteArray?): Boolean {
    if (data == null || mService.state !== BluetoothService.STATE_CONNECTED) {
      return false
    }
    mService.write(data)
    return true
  }

  override fun onBluetoothServiceStateChanged(state: Int, boundle: Map<String, Any>?) {

  }

  /** */

  private class ColumnSplitedString(val shorter: Int, val str: String)

  companion object {
    private val TAG = "BluetoothEscposPrinter"

    val WIDTH_58 = 384
    val WIDTH_80 = 576

    // 根据Unicode编码完美的判断中文汉字和符号
    private fun isChinese(c: Char): Boolean {
      val ub = Character.UnicodeBlock.of(c)
      return if (ub === Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
        || ub === Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS
        || ub === Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
        || ub === Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_B
        || ub === Character.UnicodeBlock.CJK_SYMBOLS_AND_PUNCTUATION
        || ub === Character.UnicodeBlock.HALFWIDTH_AND_FULLWIDTH_FORMS
        || ub === Character.UnicodeBlock.GENERAL_PUNCTUATION) {
        true
      } else false
    }
  }

}
