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

const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
    
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const SystemActions = imports.misc.systemActions;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

class PowerCommandsButton extends PanelMenu.Button{
    constructor(){
        super(St.Align.START);
        this._settings = Convenience.getSettings();
        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());

        let box = new St.BoxLayout();

        let icon = new St.Icon({ icon_name: 'emblem-system',
                                 style_class: 'system-status-icon' });
        box.add(icon);
        this.actor.add_child(box);

        let systemActions = SystemActions.getDefault();

        this.lineaButtons1 = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });
        this.menu.addMenuItem(this.lineaButtons1)

        var settings = Convenience.getSettings();

        let screensaver_button = null;
        let lock_screen_button = null;
        let switch_user_button = null;
        let logout_button = null;
        let shutdown_button = null;
        let suspend_button = null

        screensaver_button = this._createActionButton('preferences-desktop-screensaver-symbolic', 'Salvapantallas');
        screensaver_button.set_style_class_name('item');
        screensaver_button.connect('clicked', ()=>{
            Util.spawn(['gnome-screensaver-command', '--activate']);
        });
        this.lineaButtons1.actor.add_actor(screensaver_button);

        if(systemActions.can_lock_screen){
            lock_screen_button = this._createActionButton('system-lock-screen-symbolic', 'Bloquear');
            lock_screen_button.set_style_class_name('item');
            lock_screen_button.connect('clicked', ()=>{
                systemActions.activateLockScreen();
            });
            this.lineaButtons1.actor.add_actor(lock_screen_button);
        }

        if (systemActions.can_switch_user){
            switch_user_button = this._createActionButton('system-switch-user-symbolic', 'Cambiar de usuario');
            switch_user_button.set_style_class_name('item');
            switch_user_button.connect('clicked', ()=>{
                systemActions.activateSwitchUser();
            });
            this.lineaButtons1.actor.add_actor(switch_user_button);
        }

        if (systemActions.can_logout){
            logout_button = this._createActionButton('edit-delete-symbolic', 'Cerrar sessión');
            logout_button.set_style_class_name('item');
            logout_button.connect('clicked', ()=>{
                systemActions.activateLogout();
            });
            this.lineaButtons1.actor.add_actor(logout_button);
        }


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.lineaButtons2 = new PopupMenu.PopupBaseMenuItem({
            reactive: false
        });
        this.menu.addMenuItem(this.lineaButtons2)

        let items = new St.BoxLayout({
            style_class: 'button-box'
        });
        this.lineaButtons2.actor.add_actor(items);

        if (systemActions.can_power_off){
            shutdown_button = this._createActionButton('system-shutdown-symbolic', 'Apagar');
            shutdown_button.set_style_class_name('item');
            shutdown_button.connect('clicked', ()=>{
                systemActions.activatePowerOff();
            });
            items.add_actor(shutdown_button);
        }

        if (systemActions.can_suspend){
            suspend_button = this._createActionButton('night-light-symbolic', 'Suspender');
            suspend_button.set_style_class_name('item');
            suspend_button.connect('clicked', ()=>{
                systemActions.activateSuspend();
            });
            //this.lineaButtons2.actor.add_actor(item);
            items.add_actor(suspend_button);
        }
        this._settingsC = this._settings.connect("changed", () => {
            if(screensaver_button != null){
                if(this._settings.get_boolean('show-screensaver')){
                    screensaver_button.show();
                }else{
                    screensaver_button.hide();
                }
            }
            if(lock_screen_button != null){
                if(this._settings.get_boolean('show-lock-screen')){
                    lock_screen_button.show();
                }else{
                    lock_screen_button.hide();
                }
            }
            if(switch_user_button != null){
                if(this._settings.get_boolean('show-switch-user')){
                    switch_user_button.show();
                }else{
                    switch_user_button.hide();
                }
            }
            if(logout_button != null){
                if(this._settings.get_boolean('show-close-session')){
                    logout_button.show();
                }else{
                    logout_button.hide();
                }
            }
            if(shutdown_button != null){
                if(this._settings.get_boolean('show-shutdown')){
                    shutdown_button.show();
                }else{
                    shutdown_button.hide();
                }
            }
            if(suspend_button != null){
                if(this._settings.get_boolean('show-suspend')){
                    suspend_button.show();
                }else{
                    suspend_button.hide();
                }
            }
            /*
            let screensaver_button = null;
            let lock_screen_button = null;
            let switch_user_button = null;
            let logout_button = null;
            let shutdown_button = null;
            let suspend_button = null
            */
        });

    }
    _createActionButton(iconName, accessibleName) {
        let icon = new St.Button({ reactive: true,
                                   can_focus: true,
                                   track_hover: true,
                                   accessible_name: accessibleName,
                                   style_class: 'system-menu-action' });
        icon.child = new St.Icon({ icon_name: iconName });
        return icon;
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