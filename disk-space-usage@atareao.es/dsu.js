/*
 * This file is part of disk-space-usage
 *
 * Copyright (c) 2018 Lorenzo Carbonell Cerezo <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const GLib = imports.gi.GLib;

class Manager{

    constructor(){
        this.update();
    }

    update(){
        this._devices = [];
        let dfstring = GLib.spawn_command_line_sync('df -x squashfs -x tmpfs')[1].toString();
        let regex = /^\/dev(.*)$/gim
        let m;
        dfstring.match(regex).forEach((match) => {
            let regex2 = /[^\s]+/gi
            let params = match.match(regex2);
            let result = {
                device: params[0],
                size: params[1],
                usage: params[2],
                free: params[3],
                percentage: params[4],
                mounted: params[5]
            }
            this._devices.push(result);
        });
        this._devices.sort((a, b) =>{
            var keyA = a.device,
                keyB = b.device;
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
    }

    toString(){
        return JSON.stringify(this._devices);
    }
    
    get devices(){
        return this._devices;
    }
}

var manager = new Manager();
print(manager.toString());
let devices = manager.devices;
print(devices[0].device.substring(5));
print(devices[0].percentage.substring(0,devices[0].percentage.length-1)/100);
devices.push(1);
devices.push(1);
let rows = devices.length;
print(Math.ceil(devices.length/3));
print(rows, parseInt(rows / 3), rows % 3);
print(0, 0%3, parseInt(0/3));
print(1, 1%3, parseInt(1/3));
print(2, 2%3, parseInt(2/3));
print(3, 3%3, parseInt(3/3));
print(4, 4%3, parseInt(4/3));
print(5, 5%3, parseInt(5/3));
print(6, 6%3, parseInt(6/3));
print(7, 7%3, parseInt(7/3));
