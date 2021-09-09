const fs = require("fs"); //To read files
const Discord = require("discord.js"); //To access Discord API
const { prefix, token } = require("./config.json"); // storing Prefix and Token
const mongo = require("./src/connect");
const general = require("./reactions/general");

const kick = require("./reactions/kick");
const whitelist = require("./reactions/whitelist");
const close = require("./reactions/close");
const reopen = require("./reactions/reopen");
const transcript = require("./reactions/transcript");
const ticket = require("./reactions/delete");
const blacklist = require("./commands/blacklist");

const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
}); // Creating a new Client
client.commands = new Discord.Collection(); // Accessing commands collection

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js")); // Reding command files

/*Storing commands in a accessible manner*/
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection(); // Cooldowns collection

client.on("ready", () => {
  client.user.setActivity("© Threaten, Watching Ticket", {
    type: "PLAYING",
  });
});

/*Invokes When BOT is ready to do tasks*/
client.once("ready", () => {
  console.log("Ticket Tool is Ready!");
});

client.on("messageReactionAdd", async (messageReaction, user) => {
  function SpamTicket(auID, chID) {
    return new Discord.MessageEmbed()
      .setColor("#28df99")
      .setDescription(`<@${auID}> You've Already a Ticket opened at <#${chID}>`)
      .setFooter("© Threaten")
      .setTimestamp();
  }

  function ticketClosed(auID) {
    return new Discord.MessageEmbed()
      .setColor("#28df99")
      .setDescription(`Ticket Closed by <@${auID}>`)
      .setFooter("© Threaten")
      .setTimestamp();
  }

  function ticketDeletePopup() {
    return new Discord.MessageEmbed()
      .setColor("#ff4b5c")
      .setDescription(`This ticket will be deleted in 5 seconds`)
      .setFooter("© Threaten")
      .setTimestamp();
  }

  function convert(str) {
    var date = new Date(str),
      month = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    hour = date.getHours();
    minute = date.getMinutes();
    var result = `${[day, month, date.getFullYear()].join(
      "/"
    )} ${hour}:${minute}`;
    return result;
  }

  function noAdmin_close(id) {
    return new Discord.MessageEmbed()
      .setColor("#ff4b5c")
      .setDescription(`<@${id}> You're not a Admin. You can't Close Ticket`)
      .setFooter("© Threaten")
      .setTimestamp();
  }

  function BanTicket(auID, reason, issuedBy, time) {
    return new Discord.MessageEmbed()
      .setColor("#28df99")
      .setDescription(
        `<@${auID}> You've been blacklisted from creating ticket.`
      )
      .addField("Reason", reason, false)
      .addField("Issued By:", `<@${issuedBy}>`, false)
      .addField("Blacklisted at:", convert(time), false)
      .setFooter("© Threaten")

      .setTimestamp();
  }

  function noAdmin_delete(id) {
    return new Discord.MessageEmbed()
      .setColor("#ff4b5c")
      .setDescription(`<@${id}> You're not a Admin. You can't Close Ticket`)
      .setFooter("© Threaten")
      .setTimestamp();
  }

  if (messageReaction.partial) {
    // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
    try {
      await messageReaction.fetch();
    } catch (error) {
      console.log("Something went wrong when fetching the message: ", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }

  if (messageReaction.emoji.name === "❓" && !user.bot) {
    mongo.validatePanel(messageReaction.message.id, async (res) => {
      if (res) {
        mongo.blacklist(user.id, async (cb) => {
          if (cb) {
            await messageReaction.users.remove(user.id);
            return user.send(
              BanTicket(user.id, cb.reason, cb.issuedBy, cb.createdAt)
            );
          } else {
            await messageReaction.users.remove(user.id);
            general.general_ticket(messageReaction.message, user);
          }
        });
      }
    });
  }

  if (messageReaction.emoji.name === "🛂" && !user.bot) {
    mongo.validatePanel(messageReaction.message.id, async (res) => {
      if (res) {
        mongo.blacklist(user.id, async (cb) => {
          if (cb) {
            await messageReaction.users.remove(user.id);
            return user.send(
              BanTicket(user.id, cb.reason, cb.issuedBy, cb.createdAt)
            );
          } else {
            await messageReaction.users.remove(user.id);

            paypal.paypal_ticket(messageReaction.message, user);
          }
        });
      }
    });
  }

  if (messageReaction.emoji.name === "🎵" && !user.bot) {
    mongo.validatePanel(messageReaction.message.id, async (res) => {
      if (res) {
        await messageReaction.users.remove(user.id);
        resell.resell_ticket(messageReaction.message, user);
      }
    });
  }

  if (messageReaction.emoji.name === "🛠️" && !user.bot) {
    mongo.validatePanel(messageReaction.message.id, async (res) => {
      if (res) {
        await messageReaction.users.remove(user.id);
        kick.kick_ticket(messageReaction.message, user);
      }
    });
  }

  if (messageReaction.emoji.name === "🔒" && !user.bot) {
    mongo.validateTicket_Channel(
      messageReaction.message.channel.id,
      async (res) => {
        if (res) {
          if (res.messageID === messageReaction.message.id) {
            await messageReaction.users.remove(user.id);
            if (!res.status) {
              close.ticket_close(messageReaction.message, user, res);
            } else {
              return;
            }
          }
        }
      }
    );
  }

  if (messageReaction.emoji.name === "🔓" && !user.bot) {
    mongo.validateTicketPanel_Channel(
      messageReaction.message.channel.id,
      async (res) => {
        if (res) {
          if (res.messageID === messageReaction.message.id) {
            await messageReaction.users.remove(user.id);
            if (res.status === "closed") {
              reopen.ticket_reopen(messageReaction.message, user, res, client);
            } else {
              return;
            }
          }
        }
      }
    );
  }

  if (messageReaction.emoji.name === "🗒️" && !user.bot) {
    mongo.validateTicketPanel_Channel(
      messageReaction.message.channel.id,
      async (res) => {
        if (res) {
          if (res.messageID === messageReaction.message.id) {
            await messageReaction.users.remove(user.id);
            transcript.create_transcript(messageReaction.message, user);
          }
        }
      }
    );
  }

  if (messageReaction.emoji.name === "⛔" && !user.bot) {
    mongo.validateTicketPanel_Channel(
      messageReaction.message.channel.id,
      async (res) => {
        if (res) {
          if (res.messageID === messageReaction.message.id) {
            await messageReaction.users.remove(user.id);
            ticket.ticket_delete(messageReaction.message, user);
          }
        }
      }
    );
  }
});

/*Invokes When a new message send in discord*/
client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return; //Returns If the prefix is not matching or If the message is sent by BOT

  const args = message.content.slice(prefix.length).split(/ +/); // Spillting up Arguments
  const commandName = args.shift().toLowerCase(); // Converting to Lowercase

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    ); //Accessing Command from Command Collection in #14

  if (!command) return; // If user command is not matches with our bot command, It returns

  /* If the command should be executed in Guild and the command is executed outside of guild, It'll return with a error message*/
  if (command.guildOnly && message.channel.type !== "text") {
    function e_invalid() {
      return new Discord.MessageEmbed()
        .setColor("#d40808")
        .setDescription(`I can\'t execute that command inside DMs!`)
        .setTimestamp()
        .setFooter("© Threaten");
    }
    return message.channel.send(e_invalid());
  }

  /* If command needs any argument and user doesn't provide any argument, It returns with a error message'*/
  if (command.args && !args.length) {
    if (command.usage) {
      function e_invalid() {
        return new Discord.MessageEmbed()
          .setColor("#d40808")
          .setDescription(
            `You didn't provide any arguments, ${message.author}!\nThe proper usage would be: \`prefix${command.name} ${command.usage}\``
          )
          .setTimestamp()
          .setFooter("© Threaten");
      }

      return message.channel.send(e_invalid()).then((msg) => {
        msg.delete({ timeout: 10000 });
      });
    } else {
      function e_invalid() {
        return new Discord.MessageEmbed()
          .setColor("#d40808")
          .setDescription(
            `You didn't provide any arguments, ${message.author}!`
          )
          .setTimestamp()
          .setFooter("© Threaten");
      }

      return message.channel.send(e_invalid()).then((msg) => {
        msg.delete({ timeout: 10000 });
      });
    }
  }

  /* If command has any cooldown, It'll validate every request */
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      function e_invalid() {
        return new Discord.MessageEmbed()
          .setColor("#d40808")
          .setDescription(
            `please wait ${timeLeft.toFixed(
              1
            )} more second(s) before reusing the \`${command.name}\` command.`
          )
          .setTimestamp()
          .setFooter("© Threaten");
      }

      return message.channel.send(e_invalid()).then((msg) => {
        msg.delete({ timeout: 10000 });
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  /* Executes command, If any error occurs, It goes to Catch Block */
  try {
    command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    function e_invalid() {
      return new Discord.MessageEmbed()
        .setColor("#d40808")
        .setDescription("There was an error trying to execute that command!")
        .setTimestamp()
        .setFooter("© Threaten");
    }

    return message.channel.send(e_invalid()).then((msg) => {
      msg.delete({ timeout: 10000 });
    });
  }
});

client.login(token); // Bot Login with token
