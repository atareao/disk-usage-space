/*
 * Disk Space Usage
 * This a extension to show disk space usage
 * of mounted devices
 *
 * Copyright (C) 2018
 *     Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 *
 * This file is part of Disk Space Usage.
 * 
 * WordReference Search Provider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * WordReference Search Provider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-openweather.
 * If not, see <http://www.gnu.org/licenses/>.
 *
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