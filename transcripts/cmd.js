const cmd=require('node-cmd');
const { token } = require('../config.json')

function chatExport(channel,channelName,user){
    var time = Date.now();
    return new Promise((resolve,reject)=>{
        var cmdPrepare = `dotnet DiscordChatExporter.Cli.dll export -c ${channel} -t "${token}" -b True -o "${__dirname}//${channelName}-${time}.html"`
        cmd.run(`cd ./Chat/Discord/ && ${cmdPrepare}`,(err,data,stderr)=>{
            if(data.indexOf('Done.') !== -1){
                resolve(__dirname + `//${channelName}-${time}.html`)
            }
            else{
                const data = {
                    err: err,
                    stderr: stderr
                }
                reject(data)
            }
        })
    }).catch(err => console.error(err));
}

module.exports = { chatExport }

