#!/usr/bin/env gjs

const {GLib, Gio} = imports.gi;

let loop = GLib.MainLoop.new(null, false);


let command = ['df', '-x', 'squashfs', '-x', 'tmpfs'];
let proc = Gio.Subprocess.new(
    command,
    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
);
proc.communicate_utf8_async(null, null, (proc, res) => {
    try{
        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
        let regex = /\/dev\/.*$/gm;
        stdout = stdout.toString();
        print('disk =============================');
        print('disk:' + stdout);
        print('disk =============================');
        stdout.match(regex).forEach((match) => {
            let regex2 = /[^\s]+/gi
            let params = match.match(regex2);
            print(params[0]);
            let name = params[0].substring(5);
            let percentage = params[4].substring(
                0,
                params[4].length - 1);
            print('disk:' + name + ' ' + percentage);
            print('disk =============================');
        });
    }catch(e){
        print(e);
    }finally{
        loop.quit();
    }
});
loop.run();
