function toHex(d) {
  return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

class StarPrint {
  cmdBuffer = [];

  getCommand() {
    const cmd = this.cmdBuffer.join(",");
    this.cmdBuffer = [];
    return cmd;
  }

  setFont(n=0) {
    // 0 = Font-A (12 x 24 dots)
    // 1 = Font-B (9 x 24 dots)
    // 2 = Font-C ( 9 x 17 dots)
    this.cmdBuffer.push("1B,1E,46," + toHex(n));
    return this;
  }

  setCodePage(n=0) {
    // 0 = normal
    // 1 = CodePage437 (USA, Std. Europe)
    // 2 = Katakana
    // ... lihat dokumentasi
    this.cmdBuffer.push("1B,1D,74,"+toHex(n));
    return this;
  }

  setCharset (n=0) {
    // 0 = USA
    // 1 = France
    // 2 = Germany
    // ... lihat dokumentasi
    this.cmdBuffer.push("1B,52,"+toHex(n));
    return this;
  }

  cuttPaper (n=1) {
    // 0 = Full cut at the current position.
    // 1 = Partial cut at the current position.
    // 2 = Paper is fed to cutting position, then a full cut.
    // 3 = Paper is fed to cutting position, then a partial cut.
    this.cmdBuffer.push("1B,64,"+toHex(n));
    return this;
  }

  openDrawer() {
    this.cmdBuffer.push("07,1C");
    return this;
  }

  feedPaperNLine(n=1) {
    // 1<= n <= 127
    this.cmdBuffer.push("97,61,"+toHex(n));
    return this;
  }

  resetPrinter() {
    this.cmdBuffer.push("1B,3F,0A,00");
    return this;
  }

  printPageEn() {
    // Command Initialization
    // Biasanya untuk execute print pada standart mode
    this.cmdBuffer.push("1B,40");
    return this;
  }

  pageModeBegin() {
    this.cmdBuffer.push("1B,1D,50,30");
    return this;
  }

  pageModeDirection(n=0) {
    // 0 = leftToRight
    // 1 = bottomToTop
    // 2 = rightToLeft
    // 3 = topToBottom

    this.cmdBuffer.push("1B,1D,50,32,"+toHex(n));
    return this;
  }

  pageModeSetPrintRegion(xL=0, xH=0, yL=0, yH=0, dxL=128, dxH=1, dyL=170, dyH=3) {
    this.cmdBuffer.push("1B,1D,50,33,"+
      toHex(xL)+","+
      toHex(xH)+","+
      toHex(yL)+","+
      toHex(yH)+","+
      toHex(dxL)+","+
      toHex(dxH)+","+
      toHex(dyL)+","+
      toHex(dyH));
    return this;
  }

  pageModePrintSend() {
    this.cmdBuffer.push("1B,1D,50,37");
    return this;
  }

  qrCodeModel(n=2) {
    // n = 1 // model 1
    // n = 2 // model 2

    this.cmdBuffer.push("1B,1D,79,53,30,"+toHex(n));
    return this;
  }

  qrCodeMistakeLevel(n=0) {
    // n = 0 // level L. mistake ratio rate 7%
    // n = 1 // level M. mistake ratio rate 15%
    // n = 2 // level Q. mistake ratio rate 25%
    // n = 3 // level H. mistake ratio rate 30%


    this.cmdBuffer.push("1B,1D,79,53,31,"+toHex(n));
    return this;
  }

  qrCodeCellSize(n=3) {
    // 1 <= n <= 8
    // n = Cell size (units: dots)
    // recommended cell size 3 <= n

    this.cmdBuffer.push("1B,1D,79,53,32,"+toHex(n));
    return this;
  }

  qrCodeData(data="") {
    // 0 <= data.length <= 255
    const nH = Math.floor(data.length / 256);
    const nL = data.length - (nH * 256);
    this.cmdBuffer.push("1B,1D,79,44,31,00,"+toHex(nL)+","+toHex(nH));
    return this;
  }

  qrCodePrint() {
    this.cmdBuffer.push("1B,1D,79,50");
    return this;
  }

  setLeftMargin(n=0) {
    // 0 <= n <= 255

    this.cmdBuffer.push("1B,6C,"+toHex(n));
    return this;
  }

  setRightMargin(n=0) {
    // 0 <= n <= 255
    // recommended: Uses the left edge as a standard
    this.cmdBuffer.push("1B,51,"+toHex(n));
    return this;
  }

  // Barcode PDF417
  bcPdf417Size(method=0, p1=1, p2=2) {
    // method = 0; USE_LIMITS (Specify ratio of bar code horizontally and vertically) p1:p2
    // method = 1; USE_FIXED (Specifies number of lines and number of columns of bar code.) p1=number of line, p2 = number of column

    this.cmdBuffer.push("1B,1D,78,53,30,"+toHex(method)+","+toHex(p1)+","+toHex(p2));
    return this;
  }

  bcPdf417SecurityLevel(n=2) {
    // 0 <= n <= 8
    this.cmdBuffer.push("1B,1D,78,53,31,"+toHex(n));
    return this;
  }

  bcPdf417XDirectionSize(n=2) {
    // 1 <= n <= 10
    // It is recommended that 2 ≤ n when specifying using this command.
    this.cmdBuffer.push("1B,1D,78,53,32,"+toHex(n));
    return this;
  }

  bcPdf417AspectRatio(n=3) {
    // 1 <= n <= 10     Sets the module aspect ratio (asp).
    // It is recommended that 2 ≤ n when specifying using this command.
    this.cmdBuffer.push("1B,1D,78,53,33,"+toHex(n));
    return this;
  }

  bcPdf417Data(data="") {
    // 0 <= data.length <= 255
    const nH = Math.floor(data.length / 256);
    const nL = data.length - (nH * 256);
    this.cmdBuffer.push("1B,1D,78,44,"+toHex(nL)+","+toHex(nH));
    return this;
  }

  bcPdf417Print() {
    this.cmdBuffer.push("1B,1D,78,50");
    return this;
  }

  bcCode39(data="") {
    // 48≤d≤57 (”0”≤d≤”9”)
    // 65≤d≤90 (”A”≤d≤”Z”)
    // 32, 36, 37, 43, 45, 46, 47 (SP, ”$”, ”%”, ”+”, ”-“, ”.”, ”/”)

    const cnt=data.length;
    this.cmdBuffer.push("1B,62,04,04,01,"+toHex(cnt));
    return this;
  }

  bcCode128(data="") {
    // data : each character of data should between decimal 0 <= d <= 127
    const cnt=data.length;
    this.cmdBuffer.push("1B,62,06,04,03,"+toHex(cnt));
    return this;
  }

  bcEndNotPdf417() {
    this.cmdBuffer.push("1E");
    return this;
  }

  setGraphicsData(base64Img="",kc1=32,kc2=32,xL=0,xH=32,yL=0,yH=9) {
    // kc = keycode. printer akan print logo berdasarkan key code ini.
    // 32 <= kc1 <= 126
    // 32 <= kc2 <= 126
    // 1 ≤ (xL+xH×256) ≤ 8192, (0 ≤ xL ≤ 255, 0 ≤ xH ≤ 32)
    // 1 ≤ (yL+yH×256) ≤ 2304, (0 ≤ yL ≤ 255, 0 ≤ yH ≤ 9)

    const dataLng = base64Img.length;
    const p4 = Math.floor(dataLng / 16777216);
    const p3 = Math.floor((dataLng - (p4 * 16777216)) / 65536);
    const p2 = Math.floor((dataLng - (p4 * 16777216) - (p3 * 65536)) / 256);
    const p1 = dataLng - (p4 * 16777216) - (p3 * 65536) - (p2 * 256);

    this.cmdBuffer.push("1B,1D,38,4C,"+toHex(p1)+","+toHex(p2)+","+toHex(p3)+","+toHex(p4)+",30,43,30,"+toHex(kc1)+","+toHex(kc2)+","+toHex(xL)+","+toHex(xH)+","+toHex(yL)+","+toHex(yH));
    return this;
  }

  printGraphicsData(base64Img="",kc1=32,kc2=32) {
    const dataLng = base64Img.length;
    const p4 = Math.floor(dataLng / 16777216);
    const p3 = Math.floor((dataLng - (p4 * 16777216)) / 65536);
    const p2 = Math.floor((dataLng - (p4 * 16777216) - (p3 * 65536)) / 256);
    const p1 = dataLng - (p4 * 16777216) - (p3 * 65536) - (p2 * 256);

    this.cmdBuffer.push("1B,1D,38,4C,"+toHex(p1)+","+toHex(p2)+","+toHex(p3)+","+toHex(p4)+",30,45,"+toHex(kc1)+","+toHex(kc2)+",01,01");
    return this;
  }


  getPrinterVersion() {
    this.cmdBuffer.push("1B,23,2A,0A,00");
    return this;
  }

}
export function StarPrintComposer() {
  return (new StarPrint());
}





