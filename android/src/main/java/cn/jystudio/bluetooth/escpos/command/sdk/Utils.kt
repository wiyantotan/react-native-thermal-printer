package com.gdschannel.thermalprinter.bluetooth.escpos.command.sdk

object Utils {
    fun hexToByte(c1: Char, c2: Char) : Byte {
        val firstDigit : Int = toDigit(c1);
        val secondDigit : Int = toDigit(c2);

        return ((firstDigit shl 4) + secondDigit).toByte()
    }

    fun hexToByte(hexString : String) : Byte {
        val firstDigit : Int = toDigit(hexString.get(0));
        val secondDigit : Int = toDigit(hexString.get(1));

        return ((firstDigit shl 4) + secondDigit).toByte()
    }

    private fun toDigit(hexChar : Char) : Int {
        val digit : Int = Character.digit(hexChar, 16)
        if (digit == -1) {
            throw IllegalArgumentException(
                    "Invalid Hexadecimal Character: "+ hexChar);
        }
        return digit
    }
}
