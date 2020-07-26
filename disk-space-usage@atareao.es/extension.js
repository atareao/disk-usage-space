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
const Cairo = imports.cairo
const GObject = imports.gi.GObject;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Manager = Extension.imports.dsu.Manager;

function notify(msg, details, icon='disk-space-usage') {
    let source = new MessageTray.Source(Extension.uuid, icon);
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details);
    notification.setTransient(true);
    source.notify(notification);
}

function getColor(keyName){
    let color = new Gdk.RGBA();
    color.parse(getValue(keyName));
    return color;
}

function getValue(keyName){
    return Convenience.getSettings().get_value(keyName).deep_unpack();
}

let DiskSpaceUsageButton = GObject.registerClass (
    class DiskSpaceUsageButton extends PanelMenu.Button{
        _init(){
            super._init(St.Align.START);
            this._settings = Convenience.getSettings();
            Gtk.IconTheme.get_default().append_search_path(
                Extension.dir.get_child('icons').get_path());

            let box = new St.BoxLayout();
            let gicon = Gio.icon_new_for_string(Extension.path + '/icons/disk-space-usage.svg');
            let icon = new St.Icon({ gicon: gicon,
                                     style_class: 'system-status-icon' });
            box.add(icon);
            this.actor.add_child(box);
            
            this.disk_usage_section = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this.disk_usage_section);

            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            let settingsMenuItem = new PopupMenu.PopupMenuItem(_("About"));
            settingsMenuItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
            });
            this.menu.addMenuItem(settingsMenuItem);

            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            this.menu.addMenuItem(this._get_help());

            this.manager = new Manager();
    
            this.update();
            this.sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
                                                     60,
                                                     this.update.bind(this));
            this._settings.connect("changed", ()=>{
                this.update();
            });
        }
    
        update(){

            this.disk_usage_section.actor.hide();
            if(this.disk_usage_section.numMenuItems > 0){
                this.disk_usage_section.removeAll();
    
            }
            let columns = getValue('columns');
            this.manager.update();
            let rows = Math.ceil(this.manager.devices.length/columns);
    
            let menurows = [];
            for (let i = 0; i < this.manager.devices.length; i++) {

                let item = new PopupMenu.PopupBaseMenuItem({
                   can_focus: false,
                   reactive: false
                });
                let currentrow = parseInt(i / columns);
                let currentcolumn = i % columns;
                if(currentcolumn == 0){
                    menurows.push(new St.BoxLayout({ vertical: false }));
                    //if(i > 0){
                    item.actor.add_actor(menurows[currentrow]);
                    this.disk_usage_section.addMenuItem(item);
                    //}
                }
                let percentage = parseInt(
                    this.manager.devices[i].percentage.substring(
                        0, this.manager.devices[i].percentage.length-1));
                /*
                if(percentage > 80){
                    notify('Atención',
                           'El dispositivo %s ha superado el %s %'.format(
                                this.manager.devices[i].device, percentage));
                }
                */
                menurows[currentrow].add(
                    this.createCanvas(70, 70, this.manager.devices[i]));
            }
            this.disk_usage_section.actor.show();
            return true;
        }
    
        createCanvas(width, heigth, device){
            let text = device.device.substring(5);
            let percentage = parseInt(device.percentage.substring(
                0, device.percentage.length-1));
    
            let container = new St.BoxLayout({ vertical: true });
    
            container.add(new St.Label({y_align: Clutter.ActorAlign.CENTER,
                                        x_align: Clutter.ActorAlign.CENTER,
                                        text: text }));
            let canvas = new Clutter.Canvas();
    
            canvas.set_size (width, heigth);
            canvas.connect('draw', (canvas, cr, width, height) =>{
                cr.save()
                cr.setSourceRGBA(1, 1, 1, 0);
                //cr.setSourceRGB(1, 1, 1);
                cr.rectangle(0, 0, width, height);
                cr.fill();
                cr.setSourceRGBA(0.24, 0.24, 0.24, 0);
                //cr.setSourceRGB(0.24, 0.24, 0.24);
                cr.rectangle(0, 0, width, height);
                cr.fill();
                cr.restore();
    
                cr.save();
                let linew = width * 0.15;
                cr.setLineWidth(linew);
                cr.setSourceRGB(0.30, 0.30, 0.30);
                cr.arc((width) / 2,
                       (height) / 2,
                       parseInt((width - linew) / 2 * 0.8),
                       0.00001, 0);
                cr.stroke();
                cr.restore();
    
                cr.save();
                cr.setLineWidth(linew);
                if(percentage < getValue('warning')){
                    let color = getColor('normal-color');
                    cr.setSourceRGB(color.red, color.green, color.blue);
                }else if(percentage < getValue('danger')){
                    let color = getColor('warning-color');
                    cr.setSourceRGB(color.red, color.green, color.blue);
                }else{
                    let color = getColor('danger-color');
                    cr.setSourceRGB(color.red, color.green, color.blue);
                }
    
                cr.arc((width) / 2,
                       (height) / 2,
                       parseInt((width - linew) / 2 * 0.8),
                       Math.PI * 2* (1 - percentage / 100), 0);
                cr.stroke();
                cr.restore();
    
                cr.save();
    
                cr.setSourceRGB(0.85, 0.85, 0.85);
                this.write_centered_text(cr,
                                         (width + linew)/2,
                                         (height + linew)/2,
                                         percentage + "%",
                                         'Ubuntu',
                                         width/7)
                cr.restore();
    
            });
            canvas.invalidate();
    
            let dummy = new Clutter.Actor();
            dummy.set_content(canvas);
            dummy.set_size(width, heigth);
    
            container.add(dummy);
            return container;
        }
    
        write_centered_text(cr, x, y, text, font, size){
            let pg_layout = PangoCairo.create_layout(cr);
            let pg_context = pg_layout.get_context();
            pg_layout.set_font_description(
                Pango.FontDescription.from_string('%s %s'.format(font, size)));
            pg_layout.set_text(text, -1);
    
            PangoCairo.update_layout(cr, pg_layout);
            let text_size = pg_layout.get_pixel_size();
    
            cr.moveTo(x - text_size[0]/2, y - size/2);
            cr.setFontSize(size);
            cr.showText(text);
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
                _('Project Page'), 'github', 'https://github.com/atareao/world-cup-indicator-gs'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Get help online...'), 'help-online', 'https://www.atareao.es/aplicacion/el-mundial-en-ubuntu/'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Report a bug...'), 'bug', 'https://github.com/atareao/world-cup-indicator-gs/issues'));
            menu_help.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('El atareao'), 'web', 'https://www.atareao.es'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Follow me in Twitter'), 'twitter', 'https://twitter.com/atareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Follow me in Facebook'), 'facebook', 'http://www.facebook.com/elatareao'));
            menu_help.menu.addMenuItem(this._create_help_menu_item(
                _('Follow me in Google+'), 'google', 'https://plus.google.com/ 118214486317320563625/posts'));
            return menu_help;
        }
    }
);

let diskSpaceUsageButton;

function init(){
}

function enable(){
    diskSpaceUsageButton = new DiskSpaceUsageButton();
    Main.panel.addToStatusArea('DiskSpaceUsageButton',
                               diskSpaceUsageButton,
                               0,
                               'right');
}

function disable() {
    GLib.source_remove(this.sourceId);
    diskSpaceUsageButton.destroy();
}
