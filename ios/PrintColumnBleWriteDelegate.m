//
//  PrintColumnBleWriteDelegate.m
//  ThermalPrinter
//
//  Created by Wiyanto Tan on 27/11/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PrintColumnBleWriteDelegate.h"
@implementation PrintColumnBleWriteDelegate

NSMutableArray<NSMutableString *>  *columns;
NSInteger maxRowCount;

- (void)didWriteDataToBle:(BOOL)success {NSLog(@"Call back deletgate: %lu",_now+1);
    if(self.canceled){
           if(self.pendingReject) self.pendingReject(@"ERROR_IN_PRINT_COLUMN",@"ERROR_IN_PRINT_COLUMN",nil);
        return;
    }
    self.now = self.now+1;
    if(self.now >= maxRowCount){
        if(self.error && self.pendingReject){
            self.pendingReject(@"ERROR_IN_PRINT_COLUMN",@"ERROR_IN_PRINT_COLUMN",nil);
        }else if(self.pendingResolve){
            self.pendingResolve(nil);
        }
    }else{
        if(!success){
            self.error = true;
        }
        [self print];
    }
    [NSThread sleepForTimeInterval:0.05f];//slow down.
}

-(void)printColumn:( NSMutableArray<NSMutableString *> *)columnsToPrint withMaxcount:(NSInteger)maxcount{
    columns = columnsToPrint;
    maxRowCount = maxcount;
    [self print];
}

-(void)print{
    [(NSMutableString *)[columns objectAtIndex:self.now] appendString:@"\n\r"];//wrap line..
    @try {
        [self.printer textPrint:[columns objectAtIndex:self.now] inEncoding:self.encodig withCodePage:self.codePage widthTimes:self.widthTimes heightTimes:self.heightTimes fontType:self.fontType delegate:self];
    }
    @catch (NSException *e){
        NSLog(@"ERROR IN PRINTING COLUMN:%@",e);
        self.pendingReject(@"ERROR_IN_PRINT_COLUMN",@"ERROR_IN_PRINT_COLUMN",nil);
        self.canceled = true;
    }
}

@end
