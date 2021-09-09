
const cmd=require('node-cmd');
const { token } = require('../config.json')

function chatExport(channel,user){
    return new Promise((resolve,reject)=>{
      console.log(__dirname);
        var cmdPrepare = `dotnet DiscordChatExporter.Cli.dll export -c ${channel} -t "${token}" -b True -o "a.html"`
        cmd.run(`cd ./Chat/Discord/ && ${cmdPrepare}`,(err,data,stderr)=>{
            if(data){
                resolve(`a.html`)
            }
            else{
                const data = {
                    err: err,
                    stderr: stderr
                }
                reject(data)
          }
      })
      
  }).catch(err => console.error(err)) ;
}

module.exports = { chatExport };
