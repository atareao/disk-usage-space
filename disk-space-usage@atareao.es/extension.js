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

imports.gi.versions.Gdk = "3.0";
imports.gi.versions.St = "1.0";

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Pango = imports.gi.Pango;
const PangoCairo = imports.gi.PangoCairo;
const GObject = imports.gi.GObject;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const BoxDevice = Extension.imports.piechart.BoxDevice;

function notify(msg, details, icon='disk-space-usage') {
    let source = new MessageTray.Source(Extension.uuid, icon);
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details);
    notification.setTransient(true);
    source.notify(notification);
}

let DiskSpaceUsageButton = GObject.registerClass (
    class DiskSpaceUsageButton extends PanelMenu.Button{
        _init(){
            super._init(St.Align.START);
            this._devices = {};
            this._settings = Convenience.getSettings();
            this._loadConfig();
            Gtk.IconTheme.get_default().append_search_path(
                Extension.dir.get_child('icons').get_path());

            let box = new St.BoxLayout();
            let gicon = Gio.icon_new_for_string(Extension.path + '/icons/disk-space-usage.svg');
            let icon = new St.Icon({ gicon: gicon,
                                     style_class: 'system-status-icon' });
            box.add(icon);
            this.add_actor(box);

            // Add the indicator
            if (this._show_indicator) {
                this._indicator = new DiskSpaceIndicator(
                    this._warning, this._danger, this._normalColor,
                    this._warningColor, this._dangerColor);
            }
            else {
                this._indicator = null;
            }


            this.disk_usage_section = new PopupMenu.PopupBaseMenuItem({
                reactive: false
            });
            this.menu.addMenuItem(this.disk_usage_section);
            this._rows = new St.BoxLayout({
                vertical: true,
                style_class: 'message battery-box'
            });
            this.disk_usage_section.actor.add_actor(this._rows);

            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            let settingsMenuItem = new PopupMenu.PopupMenuItem(_("About"));
            settingsMenuItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
            });
            this.menu.addMenuItem(settingsMenuItem);
            this.menu.addMenuItem(this._get_help());

            this.update();
            this._sourceId = 0;
            this._settingsChanged();
            this._settings.connect('changed',
                                   this._settingsChanged.bind(this));
        }

        _loadConfig(){
            this._columns = this._settings.get_value('columns').deep_unpack();
            this._warning = this._settings.get_value('warning').deep_unpack();
            this._danger = this._settings.get_value('danger').deep_unpack();
            this._normalColor = this._settings.get_value('normal-color').deep_unpack();
            this._warningColor = this._settings.get_value('warning-color').deep_unpack();
            this._dangerColor = this._settings.get_value('danger-color').deep_unpack();
            this._show_indicator = this._settings.get_value('show-indicator').deep_unpack();
        }

        _settingsChanged(){
            this._loadConfig();
            this.update();
            if(this._sourceId > 0){
                GLib.source_remove(this._sourceId);
            }
            this._sourceId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT, 60, this.update.bind(this));

            // Deal with the indicator
            if (this._show_indicator && this._indicator == null) {
                this._indicator = new DiskSpaceIndicator(
                    this._warning, this._danger, this._normalColor,
                    this._warningColor, this._dangerColor);
            }
            else if (!this._show_indicator && this._indicator != null) {
                this._indicator.destroy();
                this._indicator = null;
            }
        }

        recalculate(devices){
            let keys = Object.keys(devices);
            keys.sort();
            let removedDevice = false;
            Object.keys(this._devices).forEach((item)=>{
                if(!keys.includes(item)){
                    removedDevice = true;
                }
            });
            let updateColumns = false;
            this._rows.get_children().forEach((row)=>{
                if(row.get_children().length != this._columns){
                    updateColumns = true;
                }
            });
            if((keys.length != Object.keys(this._devices).length) ||
                    removedDevice || updateColumns){
                this._rows.get_children().forEach((item) => {
                    this._rows.remove_child(item);
                    this._devices = {};
                    this._indicators = {};
                });
            }
            keys.forEach((name)=>{
                let percentage = devices[name];
                if(Object.keys(this._devices).length > 0 &&
                        name in this._devices){
                    this._devices[name].setPercentage(percentage);
                    this._devices[name].redraw();
                }else{
                    this._devices[name] = new BoxDevice(name, 70,
                        70, percentage, this._warning, this._danger,
                        this._normalColor, this._warningColor,
                        this._dangerColor);
                    this._devices[name].redraw();
                    if(this._rows.get_children().length > 0){
                        let item = -1;
                        this._rows.get_children().forEach((row, index)=>{
                            if(row.get_children().length < this._columns){
                                row.add_actor(this._devices[name]);
                                item = index;
                            }
                        });
                        if(item == -1){
                            let row = new St.BoxLayout({
                                vertical: false
                            });
                            row.add_actor(this._devices[name]);
                            this._rows.add_actor(row);
                        }
                    }else{
                        let row = new St.BoxLayout({
                            vertical: false
                        });
                        row.add_actor(this._devices[name]);
                        this._rows.add_actor(row);
                    }
                }
            });
            // Now do the same for the indicator
            this._indicator.refresh(devices);
        }
        update(){
            try{
                let command = ['df', '-x', 'squashfs', '-x', 'tmpfs'];
                let proc = Gio.Subprocess.new(
                    command,
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                );
                proc.communicate_utf8_async(null, null, (proc, res) => {
                    try{
                        let devices = {};
                        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                        let regex = /\/dev\/.*$/gm;
                        stdout = stdout.toString();
                        stdout.match(regex).forEach((match) => {
                            let regex2 = /[^\s]+/gi
                            let params = match.match(regex2);
                            let name = params[0].substring(5);
                            let percentage = params[4].substring(
                                0,
                                params[4].length - 1);
                            devices[name] = percentage;
                        });
                        this.recalculate(devices);
                    }catch(e){
                        logError(e);
                    }
                });
            }catch(e){
                logError(e);
            }
            return true;
        }

        disableUpdate(){
            if(this._sourceId > 0){
                GLib.source_remove(this._sourceId);
            }
        }

        _create_help_menu_item(text, icon_name, url){
            let icon = Gio.icon_new_for_string(Extension.path + '/icons/' +    icon_name + '.svg')
            let menu_item = new PopupMenu.PopupImageMenuItem(text, icon);
            menu_item.connect('activate', () => {
                Gio.app_info_launch_default_for_uri(url, null);
            });
            return menu_item;
        }

       _get_help(){
            let menu_help = new PopupMenu.PopupSubMenuMenuItem(_('Help'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Project Page'), 'github', 'https://github.com/atareao/disk-usage-space'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Get help online...'), 'help-online', 'https://www.atareao.es/aplicacion/disk-space-usage'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Report a bug...'), 'bug', 'https://github.com/atareao/disk-usage-space/issues'));
            menu_help.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('El atareao'), 'atareao', 'https://www.atareao.es'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('GitHub'), 'github', 'https://github.com/atareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Twitter'), 'twitter', 'https://twitter.com/atareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Telegram'), 'telegram', 'https://t.me/canal_atareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Mastodon'), 'mastodon', 'https://mastodon.social/@atareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Spotify'), 'spotify', 'https://open.spotify.com/show/2v0fC8PyeeUTQDD67I0mKW'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('YouTube'), 'youtube', 'http://youtube.com/c/atareao'));
            return menu_help;
        }
    }
);

let DiskSpaceIndicator = GObject.registerClass (
    class DiskSpaceIndicator extends PanelMenu.Button {

        _init(warning, danger, normalColor, warningColor, dangerColor) {
            super._init(0.0, `Indicator`, false);
            this._percentage = {};

            this.warning = warning;
            this.danger = danger;
            this.normalColor = normalColor;
            this.warningColor = warningColor;
            this.dangerColor = dangerColor;

            this._text = new St.Label({
                text: "0%",
                y_align: Clutter.ActorAlign.CENTER,
                style: "color:" + normalColor,
            });

            this.add_actor(this._text);

            // Add to the status bar
            Main.panel.addToStatusArea(
                'DiskSpaceIndicator', this, 0, 'right');

        }

        refresh(devices) {
            let keys = Object.keys(devices);
            keys.sort();

            let text = "";
            keys.forEach((name)=>{
                let percentage = devices[name];
                let color = this.normalColor;
                if (percentage > this.warning) {
                    color = this.warningColor;
                }
                if (percentage > this.danger) {
                    color = this.dangerColor;
                }
                text += "<span fgcolor=\"" + color + "\">";
                text += percentage.toString() + "% </span>";
            });
            let clut = this._text.get_clutter_text();
            clut.set_markup(text);
        }

    }
)

let diskSpaceUsageButton;

function init(){
    Convenience.initTranslations();
}

function enable(){
    diskSpaceUsageButton = new DiskSpaceUsageButton();
    Main.panel.addToStatusArea('DiskSpaceUsageButton',
                               diskSpaceUsageButton,
                               0,
                               'right');
}

function disable() {
    diskSpaceUsageButton.disableUpdate();
    diskSpaceUsageButton.destroy();
}
