/*
 * Power Commands
 * This a extension with some useful commands
 * with GNOME Shell
 *
 * Copyright (C) 2018
 *     Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 *
 * This file is part of Power Commands.
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

imports.gi.versions.St = "1.0";

const St = imports.gi.St;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Main = imports.ui.main;

class PowerCommandsButton extends PanelMenu.Button{
    constructor(){
        super(St.Align.START);

        let box = new St.BoxLayout();

        let icon = new St.Icon({ icon_name: 'emblem-system',
                                 style_class: 'system-status-icon' });
        box.add(icon);
        this.actor.add_child(box);

        let item = new PopupMenu.PopupMenuItem('Salvapantallas');
        item.connect('activate',  ()=>{
            Util.spawn(['gnome-screensaver-command', '--activate']);
        });
        this.menu.addMenuItem(item);
    }
}

let powerCommandsButton;

function init(){
}

function enable(){
    powerCommandsButton = new PowerCommandsButton();
    Main.panel.addToStatusArea('PowerCommandsButton', powerCommandsButton, 0, 'right');
}

function disable() {
    powerCommandsButton.destroy();
}